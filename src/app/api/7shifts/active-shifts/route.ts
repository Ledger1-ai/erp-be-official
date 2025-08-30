import { NextRequest, NextResponse } from 'next/server';
import SevenShiftsApiClient from '@/lib/services/seven-shifts-api-client';
import { getDefaultTimeZone, formatYMDInTimeZone } from '@/lib/timezone';

function formatLocalRange(startIso: string, endIso: string): string {
  try {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const fmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
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
    const loc = (locationIds && locationIds.length ? String(locationIds[0]) : '0');
    const shifts = await client.listShifts(loc, ymd, ymd, ctx);

    // Filter to active now or upcoming today
    const now = Date.now();
    const active = shifts.filter(s => {
      const st = new Date(s.start).getTime();
      const en = new Date(s.end).getTime();
      return en >= now; // show ongoing or later today
    });

    // Build user lookup for names
    const users = await client.listUsers(loc, ctx);
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

    const items = active.map(s => {
      const u = idToUser.get(Number(s.user_id));
      const name = u ? `${u.first_name} ${u.last_name}` : `User ${s.user_id}`;
      const role = s.role_id ? roleById.get(Number(s.role_id)) : undefined;
      const dept = (s.department_id ? deptById.get(Number(s.department_id)) : (role?.department_id ? deptById.get(Number(role.department_id)) : undefined));
      return {
        userId: s.user_id,
        name,
        start: s.start,
        end: s.end,
        range: formatLocalRange(s.start, s.end),
        role: role?.name || undefined,
        department: dept?.name || 'Other',
      };
    }).sort((a, b) => a.start.localeCompare(b.start));

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


