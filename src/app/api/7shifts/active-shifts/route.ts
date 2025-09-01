import { NextRequest, NextResponse } from 'next/server';
import SevenShiftsApiClient from '@/lib/services/seven-shifts-api-client';
import { getDefaultTimeZone, formatYMDInTimeZone } from '@/lib/timezone';
import { connectDB } from '@/lib/db/connection';
import ToastEmployee from '@/lib/models/ToastEmployee';

function formatLocalRange(startIso: string, endIso: string): string {
  try {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const tz = getDefaultTimeZone();
    const fmt = new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: '2-digit', minute: '2-digit' });
    return `${fmt.format(s)} - ${fmt.format(e)}`;
  } catch {
    return '—';
  }
}

export async function GET(_req: NextRequest) {
  try {
    const token = process.env['SEVENSHIFTS_ACCESS_TOKEN'];
    if (!token) return NextResponse.json({ success: false, error: '7shifts token missing' }, { status: 500 });

    const client = new SevenShiftsApiClient(token);
    const { companyId, companyGuid, locationIds } = await client.getCompanyAndLocations();
    const ctx = { companyId, companyGuid } as { companyId: number; companyGuid?: string };

    // Today range in restaurant timezone (7shifts accepts YYYY-MM-DD)
    const tz = getDefaultTimeZone();
    const ymd = formatYMDInTimeZone(tz, new Date());
    const locIds = (locationIds && locationIds.length ? locationIds.map((id: number) => String(id)) : ['0']);
    let shifts: any[] = [];
    try {
      const lists = await Promise.all(locIds.map((id) => client.listShifts(id, ymd, ymd, ctx).catch(() => [])));
      shifts = ([] as any[]).concat(...lists);
    } catch {}
    if (!Array.isArray(shifts) || shifts.length === 0) {
      // Fallback: query without location filter to include all locations the token can access
      try { shifts = await client.listShifts('0', ymd, ymd, ctx); } catch {}
    }
    const now = Date.now();

    // Build user lookup for names
    const anyLoc = (locIds[0] || '0');
    let users: Array<{ id: number; first_name: string; last_name: string }> = [];
    try {
      users = await client.listUsers(anyLoc, ctx) as any;
    } catch {
      try { users = await client.listUsers('0', ctx) as any; } catch {}
    }
    const idToUser = new Map<number, { first_name: string; last_name: string }>();
    for (const u of users) idToUser.set(Number(u.id), { first_name: u.first_name, last_name: u.last_name });

    // Role/Department metadata
    let roles: Array<{ id: number; name: string; department_id?: number }> = [];
    let departments: Array<{ id: number; name: string }> = [];
    try {
      roles = await client.listRoles(companyId);
    } catch {}
    try {
      departments = await client.listDepartments(companyId);
    } catch {}
    const roleById = new Map<number, { id: number; name: string; department_id?: number }>();
    for (const r of roles) roleById.set(Number(r.id), r);
    const deptById = new Map<number, { id: number; name: string }>();
    for (const d of departments) deptById.set(Number(d.id), d);

    let items = shifts.map(s => {
      const u = idToUser.get(Number(s.user_id));
      const name = u ? `${u.first_name} ${u.last_name}`.trim() : '';
      const role = s.role_id ? roleById.get(Number(s.role_id)) : undefined;
      const dept = (s.department_id ? deptById.get(Number(s.department_id)) : (role?.department_id ? deptById.get(Number(role.department_id)) : undefined));
      const st = new Date(s.start).getTime();
      const en = new Date(s.end).getTime();
      const isActive = (st && en && now >= st && now <= en);
      return {
        userId: s.user_id,
        name: name || String(s.user_id),
        start: s.start,
        end: s.end,
        range: formatLocalRange(s.start, s.end),
        role: role?.name || undefined,
        department: dept?.name || 'Other',
        isActive,
        startMs: st,
        endMs: en,
      };
    }).sort((a, b) => a.start.localeCompare(b.start));

    // Enrich names from ToastEmployee if missing or numeric-only
    try {
      await connectDB();
      const missing = items.filter(it => !it.name || /^\d+$/.test(String(it.name))).map(it => Number(it.userId)).filter(n => Number.isFinite(n));
      if (missing.length) {
        const rows = await ToastEmployee.find({ sevenShiftsId: { $in: missing } }).lean();
        const byId = new Map<number, { firstName?: string; lastName?: string }>();
        for (const r of rows) byId.set(Number(r.sevenShiftsId), { firstName: (r as any).firstName, lastName: (r as any).lastName });
        items = items.map(it => {
          if (!it.name || /^\d+$/.test(String(it.name))) {
            const m = byId.get(Number(it.userId));
            if (m && (m.firstName || m.lastName)) {
              const full = `${m.firstName || ''} ${m.lastName || ''}`.trim();
              if (full) return { ...it, name: full };
            }
          }
          return it;
        });
      }
    } catch {}

    // If no shifts were found, fall back to listing active employees as scheduled (dimmed)
    if (!items.length && users && users.length) {
      items = users.map((u) => ({
        userId: (u as any).id,
        name: `${(u as any).first_name} ${(u as any).last_name}`.trim(),
        start: '',
        end: '',
        range: '—',
        role: undefined,
        department: 'Other',
        isActive: false,
      }));
    }

    // Group by department for clients that want domains
    const grouped: Record<string, typeof items> = {} as any;
    for (const it of items) {
      const key = (it.department || 'Other') as string;
      if (!grouped[key]) grouped[key] = [] as any;
      grouped[key].push(it as any);
    }

    return NextResponse.json({ success: true, data: items, grouped });
  } catch (e) {
    console.error('GET /api/7shifts/active-shifts error', e);
    return NextResponse.json({ success: false, error: 'Failed to load active shifts' }, { status: 500 });
  }
}


