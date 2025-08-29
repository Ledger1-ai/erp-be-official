"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link as LinkIcon, RefreshCw, EyeOff, Eye, AlertTriangle } from "lucide-react";
import { useIndexedMenus, useIndexMenus, useOrderTrackingStatus, useSetOrderTracking, useInventoryItems, useMenuMappings, useUpsertMenuMapping, useMenuItemCapacity, useMenuItemStock, useUpdateMenuItemStock } from "@/lib/hooks/use-graphql";
import { apolloClient } from "@/lib/apollo-client";
import { GET_MENU_MAPPINGS } from "@/lib/hooks/use-graphql";
//

interface MenuItemLite {
  guid: string;
  name: string;
  description?: string;
  price?: number | null;
  category?: string;
  nodeKey: string;
}

interface MappingComponent {
  kind: 'inventory' | 'menu';
  inventoryItem?: string;
  nestedToastItemGuid?: string;
  modifierOptionGuid?: string;
  quantity: number;
  unit: string;
  notes?: string;
  overrides?: MappingComponent[];
}

export default function MenuPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flatItems, setFlatItems] = useState<MenuItemLite[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItemLite | null>(null);
  const [components, setComponents] = useState<MappingComponent[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedMenuGuid, setSelectedMenuGuid] = useState<string | null>(null);
  const [selectedGroupGuid, setSelectedGroupGuid] = useState<string | null>(null);
  const [invSearch, setInvSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [hiddenMenus, setHiddenMenus] = useState<Set<string>>(new Set());
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());
  const [activeModifierOptionGuid, setActiveModifierOptionGuid] = useState<string | null>(null);

  // Strip GraphQL __typename recursively from objects/arrays before sending as input
  const stripTypenameDeep = <T,>(data: T): T => {
    if (Array.isArray(data)) return (data as any).map((d: any) => stripTypenameDeep(d));
    if (data && typeof data === 'object') {
      const { __typename, ...rest } = data as any;
      for (const k of Object.keys(rest)) {
        (rest as any)[k] = stripTypenameDeep((rest as any)[k]);
      }
      return rest as T;
    }
    return data;
  };

  useEffect(() => {
    const saved = localStorage.getItem('toast-selected-restaurant');
    if (saved) setSelectedRestaurant(saved);
  }, []);

  const { data: menusData, loading: menusLoading, refetch: refetchMenus } = useIndexedMenus(selectedRestaurant || "");
  const [indexMenusMutation] = useIndexMenus();
  const { data: trackingData } = useOrderTrackingStatus(selectedRestaurant || "");
  const [setTracking] = useSetOrderTracking();
  const { data: inventoryApiData } = useInventoryItems();
  const invMap = useMemo(() => {
    const map = new Map<string, any>();
    const list = (inventoryApiData?.inventoryItems || []) as any[];
    for (const it of list) map.set(String(it.id), it);
    return map;
  }, [inventoryApiData]);

  const findMenuItemName = (guid?: string) => {
    if (!guid) return '';
    const restaurant = menusData?.indexedMenus;
    const menusArr = restaurant?.menus || [];
    const stack: any[] = [];
    for (const m of menusArr) stack.push(...(m.menuGroups || []));
    while (stack.length) {
      const g = stack.pop();
      for (const it of (g.menuItems || [])) if (it.guid === guid) return it.name || guid;
      if (g.menuGroups) stack.push(...g.menuGroups);
    }
    return guid;
  };

  const findMenuItemNode = (guid?: string) => {
    if (!guid) return null as any;
    const restaurant = menusData?.indexedMenus;
    const menusArr = restaurant?.menus || [];
    const stack: any[] = [];
    for (const m of menusArr) stack.push(...(m.menuGroups || []));
    while (stack.length) {
      const g = stack.pop();
      for (const it of (g.menuItems || [])) if (it.guid === guid) return it;
      if (g.menuGroups) stack.push(...g.menuGroups);
    }
    return null;
  };

  const groupByRefId = useMemo(() => {
    const arr = menusData?.indexedMenus?.modifierGroupReferences || [];
    const map = new Map<number, any>();
    for (const g of arr) map.set(Number(g.referenceId), g);
    return map;
  }, [menusData]);
  const optionByRefId = useMemo(() => {
    const arr = menusData?.indexedMenus?.modifierOptionReferences || [];
    const map = new Map<number, any>();
    for (const o of arr) map.set(Number(o.referenceId), o);
    return map;
  }, [menusData]);
  const optionByGuid = useMemo(() => {
    const arr = menusData?.indexedMenus?.modifierOptionReferences || [];
    const map = new Map<string, any>();
    for (const o of arr) if (o.guid) map.set(String(o.guid), o);
    return map;
  }, [menusData]);

  useEffect(() => {
    if (!selectedRestaurant) return;
    const restaurant = menusData?.indexedMenus;
    const items: MenuItemLite[] = [];
    const menusArr = (restaurant?.menus || []).filter((m: any) => !hiddenMenus.has(m.guid));
    const selectedMenu = selectedMenuGuid ? menusArr.find((mm: any) => mm.guid === selectedMenuGuid) : menusArr[0];
    const rootGroups = selectedMenu?.menuGroups || [];
    // Ensure a group is selected by default
    if (!selectedGroupGuid && rootGroups.length > 0) {
      setSelectedGroupGuid(rootGroups[0].guid);
    }
    const seen = new Map<string, number>();
    const walk = (group: any) => {
      if (!group || hiddenGroups.has(group.guid)) return;
      for (const it of (group.menuItems || [])) {
        const base = `${selectedMenu?.guid || 'menu'}:${group?.guid || 'group'}:${it.guid}`;
        const count = (seen.get(base) || 0) + 1;
        seen.set(base, count);
        const nodeKey = count > 1 ? `${base}::${count}` : base;
        items.push({ guid: it.guid, name: it.name, description: it.description || '', price: it.price ?? null, category: group?.name, nodeKey });
      }
      for (const sub of (group.menuGroups || [])) walk(sub);
    };
    for (const g of rootGroups) walk(g);
    setFlatItems(items);
  }, [menusData, selectedRestaurant, selectedMenuGuid, selectedGroupGuid, hiddenMenus, hiddenGroups]);

  // Items to show in the explorer (only current category)
  const categoryItems = useMemo(() => {
    const items: MenuItemLite[] = [];
    const restaurant = menusData?.indexedMenus;
    const menusArr = restaurant?.menus || [];
    const selectedMenu = selectedMenuGuid ? menusArr.find((mm: any) => mm.guid === selectedMenuGuid) : menusArr[0];
    const groups = selectedMenu?.menuGroups || [];
    const group = groups.find((gg: any) => gg.guid === selectedGroupGuid);
    if (!group || hiddenGroups.has(group.guid)) return items;
    const seen = new Map<string, number>();
    for (const it of (group.menuItems || [])) {
      const base = `${selectedMenu?.guid || 'menu'}:${group?.guid || 'group'}:${it.guid}`;
      const count = (seen.get(base) || 0) + 1; seen.set(base, count);
      const nodeKey = count > 1 ? `${base}::${count}` : base;
      items.push({ guid: it.guid, name: it.name, description: it.description || '', price: it.price ?? null, category: group?.name, nodeKey });
    }
    return items;
  }, [menusData, selectedMenuGuid, selectedGroupGuid, hiddenGroups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categoryItems;
    return categoryItems.filter(i => i.name.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q));
  }, [search, categoryItems]);

  const { data: capacityData } = useMenuItemCapacity(selectedRestaurant || "", selectedItem?.guid || "", 1);
  const capacity = useMemo(() => capacityData?.menuItemCapacity || null, [capacityData]);
  const allGuids = useMemo(() => Array.from(new Set((flatItems || []).map(i => i.guid))), [flatItems]);
  const { data: stockData, refetch: refetchStock } = useMenuItemStock(selectedRestaurant || "", allGuids, undefined);
  const [updateMenuItemStock] = useUpdateMenuItemStock();

  const [upsertMenuMapping] = useUpsertMenuMapping();
  const saveMapping = async () => {
    if (!selectedRestaurant || !selectedItem) return;
    setSaving(true);
    try {
      const cleanComponents = stripTypenameDeep(components);
      const cleanSteps = stripTypenameDeep(recipeSteps);
      await upsertMenuMapping({ variables: { input: {
        restaurantGuid: selectedRestaurant,
        toastItemGuid: selectedItem.guid,
        toastItemName: selectedItem.name,
        components: cleanComponents,
        recipeSteps: cleanSteps,
      } } });
      // Refetch to confirm persistence and refresh UI
      try { await refetchMapping(); } catch {}
    } finally {
      setSaving(false);
    }
  };

  // Load existing mapping when selecting item
  const { data: existingMappingData, refetch: refetchMapping } = useMenuMappings(selectedRestaurant || "", selectedItem?.guid);
  useEffect(() => {
    const doc = existingMappingData?.menuMappings?.[0];
    if (doc) {
      setComponents(stripTypenameDeep(doc.components || []));
      setRecipeSteps(stripTypenameDeep(doc.recipeSteps || []));
    } else {
      setComponents([]);
      setRecipeSteps([]);
    }
    setActiveModifierOptionGuid(null);
  }, [existingMappingData?.menuMappings, selectedItem?.guid]);

  // Helper: ensure overrides for a nested menu component
  const ensureOverridesForNested = async (nestedGuid: string, indexInComponents: number) => {
    if (!selectedRestaurant) return;
    const comp = components[indexInComponents];
    if (!comp || comp.kind !== 'menu') return;
    if (Array.isArray(comp.overrides) && comp.overrides.length > 0) return;
    try {
      const { data } = await apolloClient.query({
        query: GET_MENU_MAPPINGS,
        variables: { restaurantGuid: selectedRestaurant, toastItemGuid: nestedGuid },
        fetchPolicy: 'network-only',
      });
      const base = data?.menuMappings?.[0]?.components || [];
      setComponents((prev) => prev.map((p, i) => i === indexInComponents ? { ...p, overrides: base.map((b: any) => ({ ...b })) } : p));
    } catch {}
  };

  const [recipeSteps, setRecipeSteps] = useState<{ step: number; instruction: string; time?: number; notes?: string }[]>([]);
  const addRecipeStep = () => {
    setRecipeSteps((prev) => [...prev, { step: (prev[prev.length - 1]?.step || 0) + 1, instruction: '' }]);
  };
  const updateRecipeStep = (idx: number, field: 'instruction' | 'time' | 'notes', value: string) => {
    setRecipeSteps((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: field === 'time' ? Number(value || 0) : value } : s));
  };
  const removeRecipeStep = (idx: number) => {
    setRecipeSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i2) => ({ ...s, step: i2 + 1 })));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Menu</h1>
            <p className="text-muted-foreground mt-1">Link Toast menu items to inventory and nested menu items.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedRestaurant || ''} onValueChange={(v) => { setSelectedRestaurant(v); localStorage.setItem('toast-selected-restaurant', v); }}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select restaurant" />
              </SelectTrigger>
              <SelectContent>
                {/* In a full build, populate from /api/toast/restaurants; here read from local storage or expect pre-set */}
                {selectedRestaurant && (<SelectItem value={selectedRestaurant}>{selectedRestaurant}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={async () => { if (!selectedRestaurant) return; setLoading(true); try { await indexMenusMutation({ variables: { restaurantGuid: selectedRestaurant } }); await refetchMenus(); } finally { setLoading(false); } }}
              disabled={loading}
            >
              {menusLoading || loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Indexing</>) : (<><RefreshCw className="mr-2 h-4 w-4" />Index Menus</>)}
            </Button>
            <Button
              variant={trackingData?.orderTrackingStatus?.enabled ? "secondary" : "outline"}
              onClick={async () => { if (!selectedRestaurant) return; await setTracking({ variables: { restaurantGuid: selectedRestaurant, enabled: !trackingData?.orderTrackingStatus?.enabled } }); }}
            >
              {trackingData?.orderTrackingStatus?.enabled ? 'Tracking: On' : 'Tracking: Off'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!selectedRestaurant) return;
                const url = `/api/menu-mappings/export?template=1&restaurantGuid=${encodeURIComponent(selectedRestaurant)}`;
                window.open(url, '_blank');
              }}
            >
              Print Template
            </Button>
          </div>
        </div>

        {/* Top row: smaller height */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Menus */}
          <Card>
            <CardHeader>
              <CardTitle>Menus</CardTitle>
              <CardDescription>Main sections (Food, Beverages, etc.)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[520px] overflow-auto space-y-1">
                {(menusData?.indexedMenus?.menus || []).map((m: any, idx: number) => (
                  <div key={(m.guid || m.name) + '::' + idx} className="flex items-center gap-2">
                    <Button variant={(selectedMenuGuid || (menusData?.indexedMenus?.menus?.[0]?.guid)) === m.guid ? 'secondary' : 'ghost'} className="flex-1 justify-start" onClick={() => { setSelectedMenuGuid(m.guid); setSelectedGroupGuid(null); setSelectedItem(null); }}>
                      {m.name}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      if (!selectedRestaurant) return;
                      const qs = new URLSearchParams({ restaurantGuid: selectedRestaurant, menuGuid: m.guid }).toString();
                      window.open(`/api/menu-mappings/export?${qs}`, '_blank');
                    }}>Export</Button>
                    <Button size="icon" variant="ghost" onClick={() => setHiddenMenus(prev => { const n = new Set(prev); if (n.has(m.guid)) n.delete(m.guid); else n.add(m.guid); return n; })}>
                      {hiddenMenus.has(m.guid) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Browse subcategories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[520px] overflow-auto space-y-1">
                {(() => {
                  const menusArr = menusData?.indexedMenus?.menus || [];
                  const selectedMenu = selectedMenuGuid ? menusArr.find((mm: any) => mm.guid === selectedMenuGuid) : menusArr[0];
                  const groups = selectedMenu?.menuGroups || [];
                  const renderGroup = (g: any, idx: number, depth = 0) => (
                    <div key={(g.guid || g.name) + '::' + idx} className="flex items-center gap-2" style={{ paddingLeft: depth * 8 }}>
                      <Button variant={selectedGroupGuid === g.guid ? 'secondary' : 'ghost'} className="flex-1 justify-start" onClick={() => { setSelectedGroupGuid(g.guid); setSelectedItem(null); }}>
                        {g.name}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        if (!selectedRestaurant || !selectedMenuGuid) return;
                        const qs = new URLSearchParams({ restaurantGuid: selectedRestaurant, menuGuid: selectedMenuGuid, groupGuid: g.guid }).toString();
                        window.open(`/api/menu-mappings/export?${qs}`, '_blank');
                      }}>Export</Button>
                      <Button size="icon" variant="ghost" onClick={() => setHiddenGroups(prev => { const n = new Set(prev); if (n.has(g.guid)) n.delete(g.guid); else n.add(g.guid); return n; })}>
                        {hiddenGroups.has(g.guid) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  );
                  const rows: any[] = [];
                  const walk = (group: any, depth = 0) => {
                    rows.push(renderGroup(group, depth, depth));
                    for (const sub of (group.menuGroups || [])) walk(sub, depth + 1);
                  };
                  if (groups.length > 0) { for (const g of groups) walk(g, 0); return rows; }
                  return <div className="text-sm text-muted-foreground">No categories</div>;
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Items in the selected category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Input placeholder="Search items" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="max-h-[520px] overflow-auto space-y-2">
                {filtered.map((it) => {
                  const stockRow = stockData?.menuItemStock?.find((r: any) => r.guid === it.guid);
                  const is86d = stockRow && String(stockRow.status) === 'OUT_OF_STOCK';
                  return (
                  <div key={it.nodeKey} className="w-full flex items-center justify-between gap-2">
                  <Button variant={selectedItem?.guid === it.guid ? 'secondary' : 'ghost'} className="flex-1 justify-between" onClick={() => setSelectedItem(it)}>
                    <span className="text-left">
                      <span className="block font-medium text-foreground">{it.name}</span>
                      <span className="block text-xs text-muted-foreground">{it.category || 'Uncategorized'}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {is86d && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      <span className="text-sm text-muted-foreground">{it.price != null ? `$${it.price.toFixed(2)}` : '—'}</span>
                    </span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (!selectedRestaurant) return;
                    const next = is86d ? 'IN_STOCK' : 'OUT_OF_STOCK';
                    try {
                      await updateMenuItemStock({ variables: { restaurantGuid: selectedRestaurant, updates: [{ guid: it.guid, status: next }] } });
                      await refetchStock();
                    } catch (e) {
                      alert('Unable to update item stock via Toast API. Check API credentials/permissions.');
                    }
                  }}>{(stockRow?.status === 'OUT_OF_STOCK') ? 'Mark In Stock' : 'Mark 86'}</Button>
                  </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="text-sm text-muted-foreground">No items</div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Bottom row: Mapping panel */}
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapping</CardTitle>
              <CardDescription>Link inventory and nested menu items</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedItem ? (
                <div className="text-sm text-muted-foreground">Select a menu item to configure mapping.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">{selectedItem.name}</div>
                      <div className="text-xs text-muted-foreground">GUID: {selectedItem.guid}</div>
                    </div>
                    <Badge variant="outline">{selectedItem.category || 'Uncategorized'}</Badge>
                  </div>

                  {/* Modifiers */}
                  {(() => {
                    const node = findMenuItemNode(selectedItem.guid);
                    const refs: number[] = Array.isArray(node?.modifierGroupReferences) ? node.modifierGroupReferences : [];
                    if (!refs.length) return null;
                    return (
                      <div className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-foreground">Modifiers</div>
                          {activeModifierOptionGuid && (
                            <Badge variant="secondary">Active: {optionByGuid.get(activeModifierOptionGuid)?.name || activeModifierOptionGuid}</Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          {refs.map((rid, idx) => {
                            const grp = groupByRefId.get(Number(rid));
                            if (!grp) return null;
                            const options: any[] = (grp.modifierOptionReferences || []).map((oid: number) => optionByRefId.get(Number(oid))).filter(Boolean);
                            return (
                              <div key={`grp-${rid}-${idx}`} className="">
                                <div className="text-xs text-muted-foreground mb-1">{grp.name || 'Modifier Group'}</div>
                                <div className="flex flex-wrap gap-1">
                                  {options.map((opt: any) => (
                                    <Button key={opt.guid || opt.referenceId} variant={activeModifierOptionGuid === opt.guid ? 'secondary' : 'outline'} size="sm" onClick={() => setActiveModifierOptionGuid(activeModifierOptionGuid === opt.guid ? null : String(opt.guid))}>
                                      {opt.name}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {components.map((c, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{c.kind === 'inventory' ? 'Inventory' : 'Menu'}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => setComponents((prev) => prev.filter((_, i) => i !== idx))}>Remove</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 items-start">
                          <div className="col-span-2">
                            {c.kind === 'inventory' ? (
                              <div>
                                <div className="text-sm font-medium text-foreground">{invMap.get(String(c.inventoryItem))?.name || c.inventoryItem}</div>
                                <div className="text-xs text-muted-foreground">
                                  {(invMap.get(String(c.inventoryItem))?.category) || ''}
                                  {invMap.get(String(c.inventoryItem)) ? ` · ${invMap.get(String(c.inventoryItem))?.unit || ''} · Stock: ${invMap.get(String(c.inventoryItem))?.currentStock ?? 0}` : ''}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm font-medium text-foreground">{findMenuItemName(c.nestedToastItemGuid)}</div>
                                <div className="text-xs text-muted-foreground">Nested menu item</div>
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground mt-1">ID: {c.kind === 'inventory' ? c.inventoryItem : c.nestedToastItemGuid}</div>
                            {c.modifierOptionGuid && (
                              <div className="mt-1">
                                <Badge variant="outline">Modifier: {optionByGuid.get(String(c.modifierOptionGuid))?.name || c.modifierOptionGuid}</Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Quantity</label>
                            <Input type="number" value={c.quantity} onChange={(e) => setComponents((prev) => prev.map((p, i) => i === idx ? { ...p, quantity: Number(e.target.value || 0) } : p))} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Unit</label>
                            <Input value={c.unit} onChange={(e) => setComponents((prev) => prev.map((p, i) => i === idx ? { ...p, unit: e.target.value } : p))} />
                          </div>
                          <div className="col-span-2 flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Notes</label>
                            <Input placeholder="Optional" value={c.notes || ''} onChange={(e) => setComponents((prev) => prev.map((p, i) => i === idx ? { ...p, notes: e.target.value } : p))} />
                          </div>
                          {c.kind === 'menu' && (
                            <div className="col-span-2 mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <div className="text-sm font-medium text-foreground">Ingredients in {findMenuItemName(c.nestedToastItemGuid)}</div>
                                <Button size="sm" variant="outline" onClick={() => ensureOverridesForNested(String(c.nestedToastItemGuid), idx)}>Load Ingredients</Button>
                              </div>
                              <div className="border rounded-md">
                                <div className="grid grid-cols-12 gap-2 p-2 text-xs text-muted-foreground">
                                  <div className="col-span-6">Ingredient</div>
                                  <div className="col-span-3">Quantity</div>
                                  <div className="col-span-3">Unit</div>
                                </div>
                                <div className="divide-y">
                                  {(c.overrides || []).map((oc, oidx) => (
                                    <div key={oidx} className="grid grid-cols-12 gap-2 p-2 items-center">
                                      <div className="col-span-6">
                                        {oc.kind === 'inventory' ? (
                                          <span className="text-sm">{invMap.get(String(oc.inventoryItem))?.name || oc.inventoryItem}</span>
                                        ) : (
                                          <span className="text-sm">{findMenuItemName(oc.nestedToastItemGuid)}</span>
                                        )}
                                      </div>
                                      <div className="col-span-3">
                                        <Input type="number" value={Number(oc.quantity || 0)} disabled={oc.kind !== 'inventory'} onChange={(e) => setComponents((prev) => prev.map((p, i) => {
                                          if (i !== idx) return p;
                                          const overrides = (p.overrides || []).map((x, j) => j === oidx ? { ...x, quantity: Number(e.target.value || 0) } : x);
                                          return { ...p, overrides };
                                        }))} />
                                      </div>
                                      <div className="col-span-3">
                                        <Input value={oc.unit || ''} disabled={oc.kind !== 'inventory'} onChange={(e) => setComponents((prev) => prev.map((p, i) => {
                                          if (i !== idx) return p;
                                          const overrides = (p.overrides || []).map((x, j) => j === oidx ? { ...x, unit: e.target.value } : x);
                                          return { ...p, overrides };
                                        }))} />
                                      </div>
                                    </div>
                                  ))}
                                  {(!c.overrides || c.overrides.length === 0) && (
                                    <div className="p-2 text-xs text-muted-foreground">No ingredients loaded. Click Load Ingredients.</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => setComponents((prev) => [...prev, { kind: 'inventory', quantity: 1, unit: '' } as any])}><LinkIcon className="mr-2 h-4 w-4" />Add Ingredient</Button>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setComponents([])}>Clear</Button>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Inventory</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Input placeholder="Search inventory" value={invSearch} onChange={(e) => setInvSearch(e.target.value)} />
                    </div>
                    <div className="max-h-[260px] overflow-auto space-y-1">
                      {(() => {
                        const items = (inventoryApiData?.inventoryItems || []) as any[];
                        const q = invSearch.trim().toLowerCase();
                        const filteredInv = q ? items.filter((i: any) => (i.name || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q)) : items;
                        return filteredInv.map((inv: any) => (
                          <Button key={String(inv.id)} variant="ghost" className="w-full justify-between" onClick={() => setComponents((prev) => [...prev, { kind: 'inventory', inventoryItem: String(inv.id), quantity: 1, unit: inv.unit || '' } as any])}>
                            <span className="text-left">
                              <span className="block text-sm text-foreground">{inv.name}</span>
                              <span className="block text-xs text-muted-foreground">{inv.category} · {inv.unit}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">Stock: {inv.currentStock}</span>
                          </Button>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Menu Items</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Input placeholder="Search menu items" value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} />
                    </div>
                    <div className="max-h-[260px] overflow-auto space-y-1">
                      {(() => {
                        const items = flatItems.filter(it => it.guid !== selectedItem?.guid && it.category !== (selectedItem?.category || ''));
                        const q = menuSearch.trim().toLowerCase();
                        const list = q ? items.filter(i => (i.name || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q)) : items;
                        return list.map((mi: any) => (
                          <Button key={mi.nodeKey + '::add'} variant="ghost" className="w-full justify-between" onClick={async () => {
                            const newIdx = components.length;
                            setComponents((prev) => [...prev, { kind: 'menu', nestedToastItemGuid: mi.guid, quantity: 1, unit: 'each', ...(activeModifierOptionGuid ? { modifierOptionGuid: activeModifierOptionGuid } : {}) } as any]);
                            // attempt to load overrides immediately
                            await ensureOverridesForNested(mi.guid, newIdx);
                          }}>
                            <span className="text-left">
                              <span className="block text-sm text-foreground">{mi.name}</span>
                              <span className="block text-xs text-muted-foreground">{mi.category || 'Uncategorized'}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">Add</span>
                          </Button>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="font-medium mb-2">Estimated Capacity</h4>
                    <div className="text-sm text-muted-foreground">
                      {capacity ? (
                        <>
                          <div>Max orders from stock: <span className="font-semibold text-foreground">{capacity.capacity}</span></div>
                          {!capacity.allHaveStock && <div className="text-red-600">Not all ingredients in stock</div>}
                        </>
                      ) : (
                        <div>—</div>
                      )}
                    </div>
                  </div>

                  {/* Recipe steps */}
                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Recipe Steps</h4>
                    <div className="space-y-2">
                      {recipeSteps.map((s, idx) => (
                        <div key={idx} className="grid grid-cols-6 gap-2 items-center">
                          <Input value={String(s.step)} readOnly className="col-span-1" />
                          <Input placeholder="Instruction" value={s.instruction} onChange={(e) => updateRecipeStep(idx, 'instruction', e.target.value)} className="col-span-3" />
                          <Input placeholder="Time (min)" value={String(s.time || '')} onChange={(e) => updateRecipeStep(idx, 'time', e.target.value)} className="col-span-1" />
                          <Button variant="ghost" onClick={() => removeRecipeStep(idx)} className="col-span-1">Remove</Button>
                        </div>
                      ))}
                      <Button variant="outline" onClick={addRecipeStep}>Add Step</Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={saveMapping} disabled={saving || !selectedItem}>{saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving</>) : 'Save Mapping'}</Button>
                    <Button onClick={async () => {
                      if (!selectedRestaurant || !selectedItem) return;
                      const qs = new URLSearchParams({ restaurantGuid: selectedRestaurant, toastItemGuid: selectedItem.guid }).toString();
                      const url = `/api/menu-mappings/export?${qs}`;
                      window.open(url, '_blank');
                    }}>Export This Recipe (PDF)</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}


