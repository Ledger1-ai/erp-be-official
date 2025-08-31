"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FloorMap from './FloorMap';
import AssignSplitPane from './AssignSplitPane';
import FloorDesigner from './FloorDesigner';
import { getPreset } from '@/lib/host/presets';
import { FloorPreset } from '@/lib/host/types';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function HostProPanel() {
  const [presets, setPresets] = useState<FloorPreset[]>([]);
  const [preset, setPreset] = useState<FloorPreset | null>(null);
  const [session, setSession] = useState<any>(null);
  const [servers, setServers] = useState<Array<{ id: string; name: string; department?: string; role?: string; isActive?: boolean; range?: string; start?: string; end?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'domains' | 'servers'>('domains');
  const [openTables, setOpenTables] = useState<Record<string, boolean>>({});
  const [ordersByTable, setOrdersByTable] = useState<Record<string, { serverName?: string; checks: number; total?: number }>>({});
  const [layouts, setLayouts] = useState<Array<{ slug: string; updatedAt?: string }>>([]);
  const [layoutSlug, setLayoutSlug] = useState<string>('');
  const [layoutData, setLayoutData] = useState<any | null>(null);

  // Load presets and active servers
  useEffect(() => {
    (async () => {
      const p = await fetch('/api/hostpro/presets').then(r => r.json()).catch(() => null);
      if (p?.success) setPresets(p.data || []);
    })();
  }, []);

  // Poll Toast for open orders to reflect live occupancy and counts
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const now = new Date();
        const start = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
        const end = now.toISOString();
        const res = await fetch(`/api/toast/orders?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`);
        const js = await res.json();
        if (!js?.success) return;
        const map: Record<string, boolean> = {};
        const byTable: Record<string, { serverName?: string; checks: number; total?: number }> = {};
        for (const o of (js.data || [])) {
          const tid = o?.table?.externalId || '';
          if (!tid) continue;
          map[tid] = true;
          if (!byTable[tid]) byTable[tid] = { serverName: o?.server?.externalId || undefined, checks: 0, total: 0 } as any;
          byTable[tid].checks += (Array.isArray(o.checks) ? o.checks.length : 1);
          byTable[tid].total = (byTable[tid].total || 0) + (o.totalAmount || o.amount || 0);
        }
        if (active) { setOpenTables(map); setOrdersByTable(byTable); }
      } catch {}
    }
    load();
    const t = setInterval(load, 15000);
    return () => { active = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/7shifts/active-shifts');
        const j = await r.json();
        const grouped = j?.grouped as Record<string, any[]> | undefined;
        const list: any[] = [];
        if (grouped) {
          for (const [_dept, arr] of Object.entries(grouped)) for (const it of arr as any[]) list.push(it);
        } else if (Array.isArray(j?.data)) list.push(...j.data);
        function normRole(r?: string) {
          const v = (r || '').toLowerCase();
          if (v.includes('bart')) return 'Bartender';
          if (v.includes('host')) return 'Host';
          if (v.includes('server') || v.includes('wait')) return 'Server';
          return r || 'Staff';
        }
        const mapped = list
          .filter((x: any) => {
            const v = `${x.department || ''} ${x.role || ''}`.toLowerCase();
            return v.includes('server') || v.includes('bart') || v.includes('host');
          })
          .map((s: any) => ({ id: String(s.userId || s.id || s.name), name: s.name, department: s.department, role: normRole(s.role), isActive: s.isActive, range: s.range, start: s.start, end: s.end }));
        // Deduplicate by id to avoid duplicate React keys and double entries
        const uniq = Array.from(new Map(mapped.map(m => [String(m.id), m])).values());
        setServers(uniq);
        // If team members changed and there was a previous submit, show hazard
        try {
          const el = document.getElementById('assign-tab');
          if (el && uniq.length && (session?.assignments?.length || 0)) {
            el.innerHTML = 'Assign ⚠️';
          }
        } catch {}
      } catch {}
    })();
  }, []);

  // Load available layouts and select most recent
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/hostpro/scan-layout?all=1');
        const js = await res.json();
        if (js?.success) {
          const list = (js.data || []).map((x: any) => ({ slug: x.slug, updatedAt: x.updatedAt })) as Array<{ slug: string; updatedAt?: string }>;
          setLayouts(list);
          if (list.length && !layoutSlug) setLayoutSlug(list[0].slug);
        }
      } catch {}
    })();
  }, [layoutSlug]);

  // Load selected layout details
  useEffect(() => {
    (async () => {
      try {
        const url = layoutSlug ? `/api/hostpro/scan-layout?slug=${encodeURIComponent(layoutSlug)}` : '/api/hostpro/scan-layout';
        const res = await fetch(url);
        const js = await res.json();
        if (js?.success) setLayoutData(js.data || null);
      } catch {}
    })();
  }, [layoutSlug]);

  useEffect(() => {
    (async () => {
      const s = await fetch('/api/hostpro/session').then(r => r.json()).catch(() => null);
      if (s?.success && s.data) setSession(s.data);
    })();
  }, []);

  useEffect(() => {
    if (presets.length && !preset) setPreset(presets[0]);
  }, [presets, preset]);

  async function startSession() {
    if (!preset) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hostpro/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ presetSlug: preset.slug, servers }) });
      const json = await res.json();
      if (json?.success) setSession(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function updateAssignments(a: Array<{ serverId: string; domainIds: string[] }>) {
    await fetch('/api/hostpro/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignments: a }) });
    setSession((s: any) => ({ ...s, assignments: a }));
  }

  async function autoAssign() {
    const r = await fetch('/api/hostpro/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const j = await r.json();
    if (j?.success) setSession((s: any) => ({ ...s, assignments: j.data }));
  }

  const presetName = preset?.name || 'Preset';
  const showMapAssignments = Boolean(session?.assignments?.length);
  // Build preset using selected layout tables (and size) + domains from localStorage
  const basePreset = useMemo(() => {
    if (!preset) return { slug: '', name: '', tables: [], domains: [] } as any;
    const tables = Array.isArray(layoutData?.tables) && layoutData.tables.length
      ? preset.tables.map((t: any) => {
          const s = layoutData.tables.find((x: any) => String(x.id) === String(t.id));
          return s ? { ...t, x: s.x, y: s.y, w: s.w, h: s.h, type: s.type || t.type } : t;
        })
      : preset.tables;
    const width = layoutData?.width || preset.width;
    const height = layoutData?.height || preset.height;
    return { ...preset, width, height, tables };
  }, [preset, layoutData]);
  const livePreset = computeLiveDomains(basePreset);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">HostPro</h2>
          <p className="text-muted-foreground text-sm">Smart hosting with 7shifts-driven roster and domain mapping</p>
        </div>
      </div>

      {/* Hide module on small phones */}
      <div className="block md:hidden">
        <div className="relative overflow-hidden rounded-xl border">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/30" />
          <div className="relative p-6 text-center text-white">
            <div className="text-lg font-semibold">HostPro is available on tablets and desktops</div>
            <div className="text-sm opacity-90 mt-1">Please use a larger device to access this module.</div>
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <Tabs defaultValue="servers">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="servers">Active Servers</TabsTrigger>
          <TabsTrigger value="domains">Domains & Map</TabsTrigger>
          <TabsTrigger value="assign" id="assign-tab">Assign</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
        </TabsList>

        {/* Tab 1: Servers */}
        <TabsContent value="servers">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Current Active Servers</CardTitle>
            </CardHeader>
            <CardContent>
              <ActiveStaff servers={servers} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Domains & Map */}
        <TabsContent value="domains" className="space-y-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Domains & Map</CardTitle>
            </CardHeader>
            <CardContent>
              <FloorDesigner preset={getPreset('3-plus-2-bar') || { slug:'', name:'', tables:[], domains:[] }} showRegionColors={true} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Assign */}
        <TabsContent value="assign">
          <AssignSplitPane
            preset={computeLiveDomains(preset)}
            servers={computeTeamMembers(servers, session)}
            assignments={session?.assignments || computeTeamMembers(servers, session).map(s => ({ serverId: String(s.id), domainIds: [] }))}
            onChange={updateAssignments}
            onAuto={autoAssign}
            onSubmit={(assignments) => {
              updateAssignments(assignments);
              // Add green check to Assign tab
              const el = document.getElementById('assign-tab');
              if (el) el.innerHTML = 'Assign ✓';
            }}
          />
        </TabsContent>

        {/* Tab 4: Live */}
        <TabsContent value="live">
          <Card className="bg-card">
            <CardHeader className="flex-row items-center justify-between">
              <div>
              <CardTitle>Live Rotation</CardTitle>
                <div className="text-xs text-muted-foreground mt-0.5">Domains preset: {livePreset && (livePreset as any).domainsPresetName ? (livePreset as any).domainsPresetName : 'Custom'}</div>
              </div>
              <div className="flex gap-2">
                {/* Layout manager */}
                <select className="rounded-md border bg-background px-2 py-1 text-sm" value={layoutSlug || (layouts[0]?.slug || '')} onChange={async (e) => {
                  const slug = e.target.value;
                  setLayoutSlug(slug);
                  // Auto-load selected layout details
                  try {
                    const url = slug ? `/api/hostpro/scan-layout?slug=${encodeURIComponent(slug)}` : '/api/hostpro/scan-layout';
                    const res = await fetch(url);
                    const js = await res.json();
                    if (js?.success) setLayoutData(js.data || null);
                  } catch {}
                }}>
                  {layouts.map((l, idx) => {
                    const label = idx === 0 ? 'Default' : (l.updatedAt ? new Date(l.updatedAt).toLocaleString() : l.slug);
                    return <option key={l.slug} value={l.slug}>{label}</option>;
                  })}
                </select>
                <Button size="sm" variant="ghost" onClick={async () => {
                  const now = new Date();
                  const name = `layout-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
                  const payload = {
                    slug: name,
                    width: layoutData?.width || livePreset?.width,
                    height: layoutData?.height || livePreset?.height,
                    tables: Array.isArray(layoutData?.tables) ? layoutData.tables : livePreset?.tables,
                    walls: Array.isArray(layoutData?.walls) ? layoutData.walls : [],
                    labels: Array.isArray(layoutData?.labels) ? layoutData.labels : [],
                  };
                  await fetch('/api/hostpro/scan-layout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  const res = await fetch('/api/hostpro/scan-layout?all=1');
                  const js = await res.json();
                  if (js?.success) setLayouts((js.data || []).map((x: any) => ({ slug: x.slug, updatedAt: x.updatedAt })));
                  setLayoutSlug(name);
                }}>New</Button>
                <Button size="sm" variant="outline" onClick={async () => { await fetch('/api/hostpro/session', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotation: { ...session?.rotation, isLive: !session?.rotation?.isLive } }) }); setSession((s: any) => ({ ...s, rotation: { ...s.rotation, isLive: !s?.rotation?.isLive } })); }}>
                  {session?.rotation?.isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {session?.rotation?.isLive ? 'Pause' : 'Play'}
                </Button>
                <Button size="sm" variant="ghost" onClick={async () => { await fetch('/api/hostpro/session', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotation: { ...(session?.rotation || {}), pointer: 0 } }) }); setSession((s: any) => ({ ...s, rotation: { ...(s.rotation || {}), pointer: 0 } })); }}><RotateCcw className="h-4 w-4" /> Reset</Button>
              </div>
            </CardHeader>
            <CardContent>
              {preset && (
                <div className="relative">
                  {session?.rotation?.isLive && (
                    <div className="absolute inset-0 z-10 backdrop-blur-md bg-black/20 rounded-xl flex">
                      <div className="m-auto w-full max-w-3xl rounded-lg border bg-background/80 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">Auto-rotation running</div>
                          <div className="text-xs">Preset: {(livePreset as any).domainsPresetName || 'Custom'}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div className="md:col-span-2 rounded-md border p-3 bg-background/60">
                            <div className="text-xs text-muted-foreground mb-1">Rotation Order</div>
                            <ol className="text-sm space-y-1">
                              {(session?.rotation?.order || []).map((id: string, idx: number) => (
                                <li key={`rot-${id}-${idx}`} className={`flex items-center justify-between rounded px-2 py-1 ${idx===session?.rotation?.pointer ? 'bg-primary/10 border border-primary/30' : ''}`}>
                                  <span>{idx+1}. {servers.find(s => String(s.id) === String(id))?.name || id}</span>
                                  {idx===session?.rotation?.pointer && (<span className="text-xs text-primary">Next</span>)}
                                </li>
                              ))}
                            </ol>
                          </div>
                          <div className="rounded-md border p-3 bg-background/60">
                            <div className="text-xs text-muted-foreground mb-1">Next Seat</div>
                            {(() => {
                              const nextId = session?.rotation?.order?.[session?.rotation?.pointer || 0];
                              const a = (session?.assignments || []).find((x: any) => String(x.serverId) === String(nextId));
                              const domain = (livePreset?.domains || []).find((d: any) => (a?.domainIds || [])[0] === d.id);
                              // Find a candidate table number quickly (smallest capacity that is free)
                              let tableNum: string | undefined = undefined;
                              if (domain) {
                                for (const tid of domain.tableIds || []) {
                                  if (!session?.tableOccupied?.[tid]) { tableNum = tid; break; }
                                }
                              }
                              return (
                                <div className="text-center">
                                  <div className="text-5xl font-bold leading-tight">{domain?.name || '—'}</div>
                                  <div className="text-xs text-muted-foreground">Domain</div>
                                  <div className="mt-3 text-4xl font-semibold">{tableNum || '—'}</div>
                                  <div className="text-xs text-muted-foreground">Suggested Table</div>
                                  <div className="mt-3 flex items-center justify-center gap-2">
                                    <Button size="sm" onClick={async () => {
                                      const sizeStr = typeof window !== 'undefined' ? window.prompt('Party size?', '2') : '2';
                                      const partySize = Math.max(1, parseInt(String(sizeStr || '2'), 10) || 2);
                                      const r = await fetch('/api/hostpro/seat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partySize }) });
                                      const j = await r.json();
                                      if (j?.data?.serverId && j?.data?.tableId) {
                                        await fetch('/api/hostpro/assign-table', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId: j.data.serverId, tableId: j.data.tableId, partySize, advancePointer: true }) });
                                        const s = await fetch('/api/hostpro/session').then(r => r.json());
                                        if (s?.success) setSession(s.data);
                                      }
                                    }}>Seat</Button>
                                    <Button size="sm" variant="outline" onClick={async () => {
                                      const sizeStr = typeof window !== 'undefined' ? window.prompt('Party size?', '2') : '2';
                                      const partySize = Math.max(1, parseInt(String(sizeStr || '2'), 10) || 2);
                                      const nextOrder = session?.rotation?.order || [];
                                      const nextIdx = ((session?.rotation?.pointer || 0) + 1) % (nextOrder.length || 1);
                                      const nextServerId = nextOrder[nextIdx];
                                      if (!nextServerId) return;
                                      const r = await fetch('/api/hostpro/seat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partySize, preferredServerId: nextServerId }) });
                                      const j = await r.json();
                                      if (j?.data?.serverId && j.data.serverId === nextServerId && j.data.tableId) {
                                        await fetch('/api/hostpro/assign-table', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId: j.data.serverId, tableId: j.data.tableId, partySize, advancePointer: false }) });
                                        const order: string[] = Array.from(session.rotation.order as any);
                                        const idx = order.findIndex((id) => String(id) === String(nextServerId));
                                        if (idx >= 0) order.splice(idx, 1);
                                        order.push(String(nextServerId));
                                        const rot = { ...session.rotation, order, pointer: session.rotation.pointer };
                                        await fetch('/api/hostpro/session', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotation: rot }) });
                                        const s = await fetch('/api/hostpro/session').then(r => r.json());
                                        if (s?.success) setSession(s.data);
                                      }
                                    }}>Skip</Button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(() => {
                    const combined: Record<string, boolean> = { ...(session?.tableOccupied || {}) };
                    for (const [tid, val] of Object.entries(openTables)) if (val) combined[tid] = true;
                    return (
                      <FloorMap preset={livePreset} occupied={combined} showDomains={true} assignments={session?.assignments || []} servers={servers} walls={layoutData?.walls} labels={layoutData?.labels} />
                    );
                  })()}
                  {/* Next up card */}
                  {session?.rotation?.order?.length ? (
                    <div className="absolute top-3 right-3 rounded-xl border shadow p-3 bg-card/90 backdrop-blur">
                      <div className="flex items-center gap-3">
                        <div>
                      <div className="text-xs text-muted-foreground">Next Up</div>
                      <div className="font-semibold">{servers.find(s => String(s.id) === String(session.rotation.order[session.rotation.pointer]))?.name || '—'}</div>
                        </div>
                        <Button size="sm" onClick={async () => {
                          const sizeStr = typeof window !== 'undefined' ? window.prompt('Party size?', '2') : '2';
                          const partySize = Math.max(1, parseInt(String(sizeStr || '2'), 10) || 2);
                          const r = await fetch('/api/hostpro/seat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partySize }) });
                          const j = await r.json();
                          if (j?.data?.serverId && j?.data?.tableId) {
                            await fetch('/api/hostpro/assign-table', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId: j.data.serverId, tableId: j.data.tableId, partySize, advancePointer: true }) });
                            const s = await fetch('/api/hostpro/session').then(r => r.json());
                            if (s?.success) setSession(s.data);
                          } else if (Array.isArray(j?.data?.suggestions)) {
                            // No table for next-up. Offer to try the next server in rotation.
                            const nextOrder = session?.rotation?.order || [];
                            const nextIdx = ((session?.rotation?.pointer || 0) + 1) % (nextOrder.length || 1);
                            const nextServerId = nextOrder[nextIdx];
                            const nextName = servers.find(s => String(s.id) === String(nextServerId))?.name || 'Next server';
                            const ok = typeof window !== 'undefined' ? window.confirm(`No table available for the current next-up. Try ${nextName}?`) : true;
                            if (ok && nextServerId) {
                              const r2 = await fetch('/api/hostpro/seat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partySize, preferredServerId: nextServerId }) });
                              const j2 = await r2.json();
                              if (j2?.data?.serverId && j2.data.serverId === nextServerId && j2.data.tableId) {
                                await fetch('/api/hostpro/assign-table', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId: j2.data.serverId, tableId: j2.data.tableId, partySize, advancePointer: false }) });
                                // Move next server to end; keep pointer same so skipped remains at front
                                const order: string[] = Array.from(session.rotation.order as any);
                                const idx = order.findIndex((id) => String(id) === String(nextServerId));
                                if (idx >= 0) order.splice(idx, 1);
                                order.push(String(nextServerId));
                                const rot = { ...session.rotation, order, pointer: session.rotation.pointer };
                                await fetch('/api/hostpro/session', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotation: rot }) });
                                const s = await fetch('/api/hostpro/session').then(r => r.json());
                                if (s?.success) setSession(s.data);
                              } else if (typeof window !== 'undefined') {
                                window.alert('No table available for the next server either.');
                              }
                            }
                          }
                        }}>Seat</Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          const sizeStr = typeof window !== 'undefined' ? window.prompt('Party size?', '2') : '2';
                          const partySize = Math.max(1, parseInt(String(sizeStr || '2'), 10) || 2);
                          const nextOrder = session?.rotation?.order || [];
                          const nextIdx = ((session?.rotation?.pointer || 0) + 1) % (nextOrder.length || 1);
                          const nextServerId = nextOrder[nextIdx];
                          if (!nextServerId) return;
                          const r = await fetch('/api/hostpro/seat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partySize, preferredServerId: nextServerId }) });
                          const j = await r.json();
                          if (j?.data?.serverId && j.data.serverId === nextServerId && j.data.tableId) {
                            await fetch('/api/hostpro/assign-table', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId: j.data.serverId, tableId: j.data.tableId, partySize, advancePointer: false }) });
                            const order: string[] = Array.from(session.rotation.order as any);
                            const idx = order.findIndex((id) => String(id) === String(nextServerId));
                            if (idx >= 0) order.splice(idx, 1);
                            order.push(String(nextServerId));
                            const rot = { ...session.rotation, order, pointer: session.rotation.pointer };
                            await fetch('/api/hostpro/session', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotation: rot }) });
                            const s = await fetch('/api/hostpro/session').then(r => r.json());
                            if (s?.success) setSession(s.data);
                          } else if (typeof window !== 'undefined') {
                            window.alert('No table available for the next server.');
                          }
                        }}>Skip</Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
              {/* Legend & quick counts */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="font-medium mb-2">Assignments</div>
                  <div className="space-y-2">
                    {(() => {
                      // Merge duplicates by serverId to avoid duplicate keys and ensure unique view
                      const merged = mergeAssignments(session?.assignments || []);
                      const activeOnly = merged.filter((a: any) => (a.domainIds || []).length > 0);
                      return activeOnly.map((a: any) => {
                      const sv = servers.find(s => String(s.id) === String(a.serverId));
                      const domains = (livePreset?.domains || []).filter((d: any) => (a.domainIds || []).includes(d.id));
                      const tableCount = domains.reduce((acc: number, d: any) => acc + (d.tableIds?.length || 0), 0);
                      // Count active tables as union of host session seatings and Toast open orders belonging to this server within assigned domains
                      const hostActiveSet = new Set((session?.seatings || []).filter((x: any) => x.serverId === a.serverId && x.status === 'seated').map((x: any) => x.tableId));
                      const assignedTableIds = new Set<string>();
                      for (const d of domains) for (const tid of (d.tableIds || [])) assignedTableIds.add(String(tid));
                      const assignedName = sv?.name ? String(sv.name).toLowerCase() : undefined;
                      for (const tid of Array.from(assignedTableIds)) {
                        const info = ordersByTable[tid];
                        if (!info) continue;
                        const posServer = info.serverName ? String(info.serverName).toLowerCase() : undefined;
                        if (!posServer || !assignedName) continue;
                        if (posServer === assignedName || posServer === String(a.serverId).toLowerCase()) {
                          hostActiveSet.add(String(tid));
                        }
                      }
                      const activeTables = hostActiveSet.size;
                      return (
                        <div key={`assign-${a.serverId}`} className={`flex items-center justify-between rounded-md border p-2 ${sv?.isActive ? 'bg-background/60' : 'bg-amber-500/10'}`}>
                          <div>
                            <div className="font-medium leading-tight">{sv?.name || a.serverId}</div>
                            {!sv?.isActive && (
                              <div className="text-[10px] text-amber-700 mt-0.5">Inactive - reassign domains</div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {domains.map((d: any) => (
                                <span key={`tag-${a.serverId}-${d.id}`} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border" style={{ background: d.color + '22' }}>
                                  <span className="inline-block size-2 rounded-full" style={{ backgroundColor: d.color }} /> {d.name}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {domains.length} domains • {tableCount} tables • {activeTables} active
                          </div>
                        </div>
                      );
                    }); })()}
                    {(session?.assignments || []).length === 0 && (
                      <div className="text-xs text-muted-foreground">No assignments yet</div>
                    )}
                  </div>
                  {(() => {
                    const merged = mergeAssignments(session?.assignments || []);
                    const anyInactive = merged.some((a: any) => {
                      const sv = servers.find(s => String(s.id) === String(a.serverId));
                      return (a.domainIds || []).length > 0 && !sv?.isActive;
                    });
                    if (!anyInactive) return null;
                    return (
                      <div className="mt-3 flex items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
                        <div className="text-xs text-amber-700">Some assigned staff are inactive. Reassign domains.</div>
                        <a href="#assign" onClick={(e) => { e.preventDefault(); try { document.querySelector('button[value="assign"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch {} }} className="text-xs underline">Go to Assign</a>
                      </div>
                    );
                  })()}
                </div>
                {/* Quick seat by party (manual) */}
                <div className="rounded-lg border p-3">
                  <div className="font-medium mb-2">Quick Seat</div>
                <SeatGuestForm onSeat={async (partySize: number) => {
                  const r = await fetch('/api/hostpro/seat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partySize }) });
                  const j = await r.json();
                  if (j?.data?.serverId && j?.data?.tableId) {
                    await fetch('/api/hostpro/assign-table', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId: j.data.serverId, tableId: j.data.tableId, partySize }) });
                    const s = await fetch('/api/hostpro/session').then(r => r.json());
                    if (s?.success) setSession(s.data);
                  }
                }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SeatGuestForm({ onSeat }: { onSeat: (partySize: number) => void }) {
  const [size, setSize] = useState(2);
  return (
    <div className="flex items-center gap-2">
      <input type="number" min={1} max={12} value={size} onChange={(e) => setSize(parseInt(e.target.value || '2', 10))} className="w-24 rounded-md border bg-background px-2 py-1 text-sm" />
      <Button size="sm" onClick={() => onSeat(size)}>Seat party</Button>
    </div>
  );
}

function ActiveStaff({ servers }: { servers: Array<{ id: string; name: string; role?: string; isActive?: boolean; range?: string }> }) {
  const groups: Record<string, typeof servers> = { Server: [], Bartender: [], Host: [] };
  for (const s of servers) {
    const key = (s.role as any) || 'Server';
    if (!groups[key]) groups[key] = [] as any;
    groups[key].push(s);
  }
  const order = ['Server', 'Bartender', 'Host'];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {order.map((k) => (
        <div key={k} className="rounded-xl border bg-card p-3">
          <div className="font-semibold mb-2">{k}s</div>
          <div className="space-y-2">
            {(groups[k] || []).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2 bg-card/70 backdrop-blur">
                <div>
                  <div className="font-medium leading-tight">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.range || '—'}</div>
                </div>
                <span className={`text-xs rounded-full px-2 py-0.5 ${s.isActive ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'}`}>{s.isActive ? 'Active' : 'Scheduled'}</span>
              </div>
            ))}
            {(groups[k] || []).length === 0 && <div className="text-xs text-muted-foreground">No {k.toLowerCase()}s</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function computeLiveDomains(preset: any | null, layoutSlug?: string): any {
  if (!preset) return { slug: '', name: '', tables: [], domains: [] };
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('hostpro:regions') : null;
    if (raw) {
      const regions = JSON.parse(raw) as Array<{ id: string; name: string; color: string; tableIds: string[] }>;
      const domains = regions.map((r, idx) => ({ id: r.id || `D${idx+1}`, name: r.name || `Region ${idx+1}`, color: r.color || '#22c55e', tableIds: r.tableIds || [] }));
      return { ...preset, domains, domainsPresetName: 'Custom' };
    }
    // If no localStorage, try to load latest or selected layout from API and map tables
    // Note: For simplicity we only adopt tables coordinates; domains remain as-is unless regions are set via UI
    // The Live panel will still use domains from Assign to color map and legend
    // This ensures we never show old default layout if a saved layout exists
    if (typeof window !== 'undefined') {
      // Fire-and-forget fetch; component will re-render when session/preset updates elsewhere
      fetch(`/api/hostpro/scan-layout${layoutSlug ? `?slug=${encodeURIComponent(layoutSlug)}` : ''}`).then(r => r.json()).then(js => {
        if (js?.success && js?.data?.tables) {
          // Merge table positions into preset
          const map = new Map((js.data.tables as any[]).map((t: any) => [String(t.id), t]));
          preset.tables = preset.tables.map((t: any) => {
            const s = map.get(String(t.id));
            return s ? { ...t, x: s.x, y: s.y, w: s.w, h: s.h, type: s.type || t.type } : t;
          });
        }
      }).catch(() => {});
    }
  } catch {}
  return preset;
}

function mergeAssignments(assignments: Array<{ serverId: string; domainIds: string[] }>) {
  const map = new Map<string, Set<string>>();
  for (const a of assignments || []) {
    const id = String(a.serverId);
    if (!map.has(id)) map.set(id, new Set());
    const set = map.get(id)!;
    for (const d of a.domainIds || []) set.add(d);
  }
  return Array.from(map.entries()).map(([serverId, set]) => ({ serverId, domainIds: Array.from(set) }));
}

function computeTeamMembers(servers: Array<any>, session: any): Array<any> {
  const active = servers.filter(s => ['Server','Bartender'].includes((s.role as any) || 'Server') && s.isActive);
  const byId = new Map(active.map(s => [String(s.id), s]));
  // Include previously assigned but now inactive staff for reassignment
  if (Array.isArray(session?.assignments)) {
    for (const a of session.assignments) {
      const id = String(a.serverId);
      if (!byId.has(id)) {
        byId.set(id, { id, name: 'Inactive', role: 'Server', isActive: false });
      }
    }
  }
  return Array.from(byId.values());
}


