"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listCompatibleUnits, convertQuantity, getUnitDef, baseUnitFor } from "@/lib/units";
function buildModelsForInventory(invId: string, components: any[], invMap: Map<string, any>) {
  const out: Array<ReturnType<typeof buildDimensionalAnalysisModel>> = [];
  const push = (comp: any) => {
    if (!comp || comp.kind !== 'inventory' || !comp.inventoryItem) return;
    if (String(comp.inventoryItem) !== String(invId)) return;
    const inv = invMap.get(String(comp.inventoryItem));
    const invUnit = String(inv?.unit || 'each');
    const fromUnit = String(comp.unit || invUnit);
    const qty = Number(comp.quantity || 0);
    // Only show analysis if mapping unit differs from primary unit
    if (fromUnit !== invUnit) {
      out.push(buildDimensionalAnalysisModel(qty, fromUnit, invUnit));
    }
  };
  for (const c of (components || [])) {
    if (c.kind === 'inventory') push(c);
    else if (c.kind === 'menu' && Array.isArray(c.overrides) && c.overrides.length > 0) {
      for (const oc of c.overrides) push(oc);
    }
  }
  return out;
}
import { Badge } from "@/components/ui/badge";
import { Loader2, Link as LinkIcon, RefreshCw, EyeOff, Eye, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useIndexedMenus, useIndexMenus, useOrderTrackingStatus, useSetOrderTracking, useInventoryItems, useMenuMappings, useUpsertMenuMapping, useMenuItemCapacity, useMenuItemStock, useUpdateMenuItemStock, useMenuVisibility, useSetMenuVisibility, useMenuItemCost, useGenerateRecipeDraft } from "@/lib/hooks/use-graphql";
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
  const [showHiddenContainer, setShowHiddenContainer] = useState(false);
  const { data: visibilityData, refetch: refetchVisibility } = useMenuVisibility(selectedRestaurant || "");
  const [setMenuVisibility] = useSetMenuVisibility();

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

  // Sync hidden sets with server
  useEffect(() => {
    const vm = visibilityData?.menuVisibility;
    if (vm) {
      setHiddenMenus(new Set(vm.hiddenMenus || []));
      setHiddenGroups(new Set(vm.hiddenGroups || []));
    } else {
      setHiddenMenus(new Set());
      setHiddenGroups(new Set());
    }
  }, [visibilityData?.menuVisibility?.restaurantGuid]);

  useEffect(() => {
    const run = async () => {
      if (!selectedRestaurant) return;
      try {
        await setMenuVisibility({ variables: { restaurantGuid: selectedRestaurant, hiddenMenus: Array.from(hiddenMenus), hiddenGroups: Array.from(hiddenGroups) } });
        try { await refetchVisibility(); } catch {}
      } catch {}
    };
    run();
  }, [hiddenMenus, hiddenGroups, selectedRestaurant]);

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

  // Visible menus (excluding hidden)
  const visibleMenus = useMemo(() => {
    const menusArr = menusData?.indexedMenus?.menus || [];
    return menusArr.filter((m: any) => !hiddenMenus.has(m.guid));
  }, [menusData, hiddenMenus]);

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

  const { data: capacityData } = useMenuItemCapacity(selectedRestaurant || "", selectedItem?.guid || "", 1, activeModifierOptionGuid || undefined);
  const capacity = useMemo(() => capacityData?.menuItemCapacity || null, [capacityData]);
  const { data: costData, loading: costLoading } = useMenuItemCost(selectedRestaurant || "", selectedItem?.guid || "");
  const foodCost = useMemo(() => {
    const c = Number(costData?.menuItemCost ?? NaN);
    return Number.isFinite(c) ? c : null;
  }, [costData?.menuItemCost]);

  // Live, client-side COGS & capacity derived from current mapping edits (no save required)
  const live = useMemo(() => {
    try {
      const perInv = new Map<string, { qtyInItemUnit: number; unit: string }>();
      const addInventoryUsage = (invId: string, qty: number, unit: string) => {
        const inv = invMap.get(String(invId));
        if (!inv) return;
        const itemUnit = String(inv.unit || 'each');
        const q = convertQuantity(Number(qty || 0), String(unit || itemUnit), itemUnit);
        const prev = perInv.get(String(invId)) || { qtyInItemUnit: 0, unit: itemUnit };
        prev.qtyInItemUnit += q;
        perInv.set(String(invId), prev);
      };

      const walk = (comp: any, multiplier: number) => {
        if (!comp) return;
        // Respect modifier filter: include base components always; include modifier-tagged only if active matches
        if (comp.modifierOptionGuid && activeModifierOptionGuid && String(comp.modifierOptionGuid) !== String(activeModifierOptionGuid)) return;
        if (comp.modifierOptionGuid && !activeModifierOptionGuid) return; // hide modifier-specific when none active
        if (comp.kind === 'inventory' && comp.inventoryItem) {
          const qty = Number(comp.quantity || 0) * multiplier;
          addInventoryUsage(String(comp.inventoryItem), qty, String(comp.unit || 'each'));
        } else if (comp.kind === 'menu') {
          const factor = Number(comp.quantity || 1) * multiplier;
          if (Array.isArray(comp.overrides) && comp.overrides.length > 0) {
            for (const oc of comp.overrides) walk(oc, factor);
          }
          // If no overrides loaded, skip to avoid stale server dependence
        }
      };
      for (const c of (components || [])) walk(c, 1);

      const requirements = Array.from(perInv.entries()).map(([invId, v]) => {
        const inv = invMap.get(String(invId));
        const stock = Number(inv?.currentStock || 0);
        return { inventoryItem: String(invId), unit: v.unit, quantityPerOrder: v.qtyInItemUnit, available: stock };
      });
      let capacityVal = Infinity; let allHaveStock = true;
      for (const r of requirements) {
        const possible = r.quantityPerOrder > 0 ? Math.floor(Number(r.available || 0) / r.quantityPerOrder) : 0;
        if (Number(r.available || 0) <= 0) allHaveStock = false;
        if (r.quantityPerOrder > 0) capacityVal = Math.min(capacityVal, possible);
      }
      if (capacityVal === Infinity) capacityVal = 0;
      if (!allHaveStock) capacityVal = 0;

      // Live COGS per order
      const totalCost = requirements.reduce((s, r) => {
        const inv = invMap.get(String(r.inventoryItem));
        const cpu = Number(inv?.costPerUnit || 0);
        return s + Number(r.quantityPerOrder || 0) * cpu;
      }, 0);

      return { requirements, capacity: capacityVal, allHaveStock, totalCost };
    } catch {
      return { requirements: [] as any[], capacity: 0, allHaveStock: false, totalCost: null as number | null };
    }
  }, [components, invMap, activeModifierOptionGuid]);
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
      const cleanMeta = stripTypenameDeep(recipeMeta);
      await upsertMenuMapping({ variables: { input: {
        restaurantGuid: selectedRestaurant,
        toastItemGuid: selectedItem.guid,
        toastItemName: selectedItem.name,
        components: cleanComponents,
        recipeSteps: cleanSteps,
        recipeMeta: cleanMeta,
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
      setRecipeMeta(stripTypenameDeep((doc as any).recipeMeta || {}));
    } else {
      setComponents([]);
      setRecipeSteps([]);
      setRecipeMeta({});
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
  const [recipeMeta, setRecipeMeta] = useState<{ servings?: number; difficulty?: string; prepTime?: number; cookTime?: number; totalTime?: number; equipment?: string[]; miseEnPlace?: string[]; plating?: string; allergens?: string[]; tasteProfile?: string[]; priceyness?: number; cuisinePreset?: string; atmospherePreset?: string; notes?: string }>({});
  const [draftPriceyness, setDraftPriceyness] = useState<number>(2);
  const [draftCuisine, setDraftCuisine] = useState<string>('chef_standard');
  const [draftAtmosphere, setDraftAtmosphere] = useState<string>('casual_modern');
  const [generateRecipeDraft, { loading: drafting }] = useGenerateRecipeDraft();
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
                {visibleMenus.map((m: any, idx: number) => {
                  const fallbackGuid = visibleMenus?.[0]?.guid;
                  const isSelected = (selectedMenuGuid || fallbackGuid) === m.guid;
                  return (
                    <div key={(m.guid || m.name) + '::' + idx} className="flex items-center gap-2">
                      <Button variant={isSelected ? 'secondary' : 'ghost'} className="flex-1 justify-start" onClick={() => { setSelectedMenuGuid(m.guid); setSelectedGroupGuid(null); setSelectedItem(null); }}>
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
                  );
                })}
                {visibleMenus.length === 0 && (
                  <div className="text-sm text-muted-foreground">No visible menus. Use the panel below to unhide.</div>
                )}
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
                  const menusArr = visibleMenus;
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
                    if (hiddenGroups.has(group.guid)) return; // skip hidden categories from list
                    rows.push(renderGroup(group, depth, depth));
                    for (const sub of (group.menuGroups || [])) walk(sub, depth + 1);
                  };
                  if (groups.length > 0) { for (const g of groups) walk(g, 0); return rows.length ? rows : <div className="text-sm text-muted-foreground">All categories are hidden. Use the panel below to unhide.</div>; }
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
                    {components
                      .map((c, originalIndex) => ({ c, originalIndex }))
                      .filter(({ c }) => {
                        if (activeModifierOptionGuid) return c.modifierOptionGuid && String(c.modifierOptionGuid) === String(activeModifierOptionGuid);
                        return !c.modifierOptionGuid;
                      })
                      .map(({ c, originalIndex }) => (
                      (() => { const idx = originalIndex; return (
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
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="outline">{activeModifierOptionGuid ? `Modifier: ${optionByGuid.get(String(activeModifierOptionGuid))?.name || activeModifierOptionGuid}` : 'Base'}</Badge>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Quantity</label>
                            <Input type="number" value={c.quantity} onChange={(e) => setComponents((prev) => prev.map((p, i) => i === idx ? { ...p, quantity: Number(e.target.value || 0) } : p))} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Unit</label>
                            {c.kind === 'inventory' ? (
                              (() => {
                                const inv = invMap.get(String(c.inventoryItem));
                                const invUnit = String(inv?.unit || 'each');
                                const options = listCompatibleUnits(invUnit);
                                const value = options.includes(String(c.unit)) ? String(c.unit) : invUnit;
                                return (
                                  <Select value={value} onValueChange={(v) => setComponents((prev) => prev.map((p, i) => i === idx ? { ...p, unit: v } : p))}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {options.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                                    </SelectContent>
                                  </Select>
                                );
                              })()
                            ) : (
                              <Input value={c.unit} onChange={(e) => setComponents((prev) => prev.map((p, i) => i === idx ? { ...p, unit: e.target.value } : p))} />
                            )}
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
                                        {oc.kind === 'inventory' ? (
                                          (() => {
                                            const inv = invMap.get(String(oc.inventoryItem));
                                            const invUnit = String(inv?.unit || 'each');
                                            const options = listCompatibleUnits(invUnit);
                                            const value = options.includes(String(oc.unit || '')) ? String(oc.unit) : invUnit;
                                            return (
                                              <Select value={value} onValueChange={(v) => setComponents((prev) => prev.map((p, i) => {
                                                if (i !== idx) return p;
                                                const overrides = (p.overrides || []).map((x, j) => j === oidx ? { ...x, unit: v } : x);
                                                return { ...p, overrides };
                                              }))}>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select unit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {options.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                                                </SelectContent>
                                              </Select>
                                            );
                                          })()
                                        ) : (
                                          <Input value={oc.unit || ''} disabled onChange={() => {}} />
                                        )}
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
                      ); })()
                    ))}
                    <Button variant="outline" onClick={() => setComponents((prev) => [...prev, { kind: 'inventory', quantity: 1, unit: '', ...(activeModifierOptionGuid ? { modifierOptionGuid: activeModifierOptionGuid } : {}) } as any])}><LinkIcon className="mr-2 h-4 w-4" />Add Ingredient</Button>
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
                          <Button key={String(inv.id)} variant="ghost" className="w-full justify-between" onClick={() => setComponents((prev) => [...prev, { kind: 'inventory', inventoryItem: String(inv.id), quantity: 1, unit: inv.unit || '', ...(activeModifierOptionGuid ? { modifierOptionGuid: activeModifierOptionGuid } : {}) } as any])}>
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
                    <h4 className="font-medium mb-2">COGS & Capacity</h4>
                    <div className="text-sm text-muted-foreground">
                      {selectedItem ? (
                        <>
                          <div>Max orders from stock: <span className="font-semibold text-foreground">{live.capacity}</span></div>
                          {!live.allHaveStock && <div className="text-red-600">Not all ingredients in stock</div>}
                          {/* Requirement breakdown */}
                          <div className="mt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Food COGS per order:</span>
                              <span className="ml-2 font-semibold text-foreground">{live.totalCost != null ? `$${live.totalCost.toFixed(2)}` : '—'}</span>
                              {live.totalCost != null && selectedItem?.price != null && Number(selectedItem.price) > 0 && (
                                <span className="ml-3 text-muted-foreground">Food Cost %: <span className="font-semibold text-foreground">{((live.totalCost / Number(selectedItem.price)) * 100).toFixed(1)}%</span></span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            {(() => {
                              const reqs = (live.requirements || []).map((r: any) => {
                                const inv = invMap.get(String(r.inventoryItem));
                                const name = inv?.name || String(r.inventoryItem);
                                const unit = String(r.unit || inv?.unit || 'each');
                                const perOrder = Number(r.quantityPerOrder || 0);
                                const stock = Number(r.available || 0);
                                const possible = perOrder > 0 ? Math.floor(stock / perOrder) : 0;
                                const costPerUnit = Number(inv?.costPerUnit || 0);
                                const cost = perOrder * costPerUnit;
                                const onlyForActiveModifier = (arr: any[]) => arr.filter((comp: any) => {
                                  if (!comp) return false;
                                  if (comp.modifierOptionGuid) {
                                    if (!activeModifierOptionGuid) return false;
                                    return String(comp.modifierOptionGuid) === String(activeModifierOptionGuid);
                                  }
                                  return true;
                                });
                                const models = buildModelsForInventory(String(r.inventoryItem), onlyForActiveModifier(components) as any, invMap);
                                return { id: String(r.inventoryItem), name, unit, perOrder, stock, possible, costPerUnit, cost, models };
                              });
                              const totalCost = reqs.reduce((s: number, row: { cost: number }) => s + row.cost, 0);
                              return (
                                <>
                                  {reqs.map((row: { id: string; name: string; unit: string; perOrder: number; stock: number; possible: number; costPerUnit: number; cost: number; models: Array<ReturnType<typeof buildDimensionalAnalysisModel>> }, idx: number) => (
                                    <div key={row.id + ':' + idx} className="border rounded-md p-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <div>
                                          <div className="text-foreground text-sm font-medium">{row.name}</div>
                                          <div className="text-[10px] text-muted-foreground">ID: {row.id}</div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                          <div><span className="text-muted-foreground">Per order:</span> <span className="text-foreground font-medium">{row.perOrder.toFixed(4)} {row.unit}</span></div>
                                          <div><span className="text-muted-foreground">Stock:</span> <span className="text-foreground font-medium">{row.stock.toFixed(2)} {row.unit}</span></div>
                                          <div><span className="text-muted-foreground">Possible:</span> <span className="text-foreground font-medium">{row.possible}</span></div>
                                          <div><span className="text-muted-foreground">Cost:</span> <span className="text-foreground font-semibold">${row.cost.toFixed(2)}</span></div>
                                        </div>
                                      </div>
                                      <div className="text-[10px] text-muted-foreground">Unit cost: ${row.costPerUnit.toFixed(4)} / {row.unit}</div>
                                      {row.models.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          {row.models.map((m: ReturnType<typeof buildDimensionalAnalysisModel>, mi: number) => (
                                            <DimensionalChain key={mi} model={m} />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {reqs.length > 0 && (
                                    <div className="border rounded-md p-3 bg-secondary/10">
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">Σ Ingredient COGS</div>
                                        <div className="text-foreground font-semibold">${totalCost.toFixed(2)}
                                          {selectedItem?.price != null && Number(selectedItem.price) > 0 && (
                                            <span className="ml-2 text-[10px] text-muted-foreground">Food Cost % = {(totalCost / Number(selectedItem.price) * 100).toFixed(1)}%</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                            {(!live.requirements || live.requirements.length === 0) && (
                              <div className="p-2 text-xs text-muted-foreground">No ingredient requirements found.</div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div>—</div>
                      )}
                    </div>
                  </div>

                  {/* Recipe steps */}
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Recipe & Steps</h4>
                      <div className="flex items-center gap-2">
                        <Select value={String(draftPriceyness)} onValueChange={(v) => setDraftPriceyness(Number(v))}>
                          <SelectTrigger className="w-28"><SelectValue placeholder="Priceyness" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">$ (1)</SelectItem>
                            <SelectItem value="2">$$ (2)</SelectItem>
                            <SelectItem value="3">$$$ (3)</SelectItem>
                            <SelectItem value="4">$$$$ (4)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input className="w-40" placeholder="Cuisine preset" value={draftCuisine} onChange={(e) => setDraftCuisine(e.target.value)} />
                        <Input className="w-48" placeholder="Atmosphere preset" value={draftAtmosphere} onChange={(e) => setDraftAtmosphere(e.target.value)} />
                        <Button variant="outline" disabled={!selectedRestaurant || !selectedItem || drafting} onClick={async () => {
                          if (!selectedRestaurant || !selectedItem) return;
                          try {
                            const { data } = await generateRecipeDraft({ variables: { restaurantGuid: selectedRestaurant, toastItemGuid: selectedItem.guid, priceyness: draftPriceyness, cuisinePreset: draftCuisine, atmospherePreset: draftAtmosphere } });
                            const draft = data?.generateRecipeDraft;
                            if (draft) {
                              const steps = Array.isArray(draft.recipeSteps) ? draft.recipeSteps : [];
                              setRecipeSteps(steps.map((s: any, idx: number) => ({ step: s.step ?? (idx + 1), instruction: String(s.instruction || ''), time: s.time != null ? Number(s.time) : undefined, notes: s.notes ? String(s.notes) : undefined })));
                              setRecipeMeta({ ...(draft.recipeMeta || {}), priceyness: draft.recipeMeta?.priceyness ?? draftPriceyness, cuisinePreset: draft.recipeMeta?.cuisinePreset ?? draftCuisine, atmospherePreset: draft.recipeMeta?.atmospherePreset ?? draftAtmosphere });
                            }
                          } catch {}
                        }}>{drafting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Drafting</>) : 'Generate Draft'}</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
                      <Input placeholder="Servings" value={String(recipeMeta.servings ?? '')} onChange={(e) => setRecipeMeta((m) => ({ ...m, servings: e.target.value ? Number(e.target.value) : undefined }))} />
                      <Input placeholder="Difficulty (Easy/Medium/Hard)" value={String(recipeMeta.difficulty || '')} onChange={(e) => setRecipeMeta((m) => ({ ...m, difficulty: e.target.value }))} />
                      <Input placeholder="Prep Time (min)" value={String(recipeMeta.prepTime ?? '')} onChange={(e) => setRecipeMeta((m) => ({ ...m, prepTime: e.target.value ? Number(e.target.value) : undefined }))} />
                      <Input placeholder="Cook Time (min)" value={String(recipeMeta.cookTime ?? '')} onChange={(e) => setRecipeMeta((m) => ({ ...m, cookTime: e.target.value ? Number(e.target.value) : undefined }))} />
                      <Input placeholder="Total Time (min)" value={String(recipeMeta.totalTime ?? '')} onChange={(e) => setRecipeMeta((m) => ({ ...m, totalTime: e.target.value ? Number(e.target.value) : undefined }))} />
                      <Input placeholder="Equipment (comma-separated)" value={(recipeMeta.equipment || []).join(', ')} onChange={(e) => setRecipeMeta((m) => ({ ...m, equipment: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] }))} />
                      <Input placeholder="Mise en place (comma-separated)" value={(recipeMeta.miseEnPlace || []).join(', ')} onChange={(e) => setRecipeMeta((m) => ({ ...m, miseEnPlace: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] }))} />
                      <Input placeholder="Allergens (comma-separated)" value={(recipeMeta.allergens || []).join(', ')} onChange={(e) => setRecipeMeta((m) => ({ ...m, allergens: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] }))} />
                      <Input placeholder="Taste profile (comma-separated)" value={(recipeMeta.tasteProfile || []).join(', ')} onChange={(e) => setRecipeMeta((m) => ({ ...m, tasteProfile: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] }))} />
                      <Input placeholder="Plating notes" value={String(recipeMeta.plating || '')} onChange={(e) => setRecipeMeta((m) => ({ ...m, plating: e.target.value }))} />
                      <Input placeholder="Recipe notes" value={String(recipeMeta.notes || '')} onChange={(e) => setRecipeMeta((m) => ({ ...m, notes: e.target.value }))} />
                    </div>
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
          {/* Hidden items accordion */}
          <Card>
            <CardHeader>
              <CardTitle>Hidden Menus & Categories</CardTitle>
              <CardDescription>Review and unhide menus or categories you have hidden</CardDescription>
              <CardAction>
                <Button variant="ghost" onClick={() => setShowHiddenContainer(v => !v)}>
                  {showHiddenContainer ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                  {showHiddenContainer ? 'Collapse' : 'Expand'}
                </Button>
              </CardAction>
            </CardHeader>
            {showHiddenContainer && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hidden Menus Pane */}
                  <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-foreground">Hidden Menus</div>
                      {(() => {
                        const hiddenMenuList = (menusData?.indexedMenus?.menus || []).filter((m: any) => hiddenMenus.has(m.guid));
                        return hiddenMenuList.length > 0 ? (
                          <Button size="sm" variant="outline" onClick={() => setHiddenMenus(new Set())}>Unhide All</Button>
                        ) : null;
                      })()}
                    </div>
                    <div className="max-h-[300px] overflow-auto space-y-1">
                      {(() => {
                        const list = (menusData?.indexedMenus?.menus || []).filter((m: any) => hiddenMenus.has(m.guid));
                        if (list.length === 0) return <div className="text-sm text-muted-foreground">No hidden menus</div>;
                        return list.map((m: any) => (
                          <div key={m.guid} className="w-full flex items-center justify-between gap-2">
                            <Button variant="ghost" className="flex-1 justify-start">
                              {m.name}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setHiddenMenus(prev => { const n = new Set(prev); n.delete(m.guid); return n; })}>
                              <Eye className="mr-2 h-4 w-4" /> Unhide
                            </Button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Hidden Categories Pane */}
                  <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-foreground">Hidden Categories</div>
                      {(() => {
                        const hasAny = hiddenGroups.size > 0;
                        return hasAny ? (
                          <Button size="sm" variant="outline" onClick={() => setHiddenGroups(new Set())}>Unhide All</Button>
                        ) : null;
                      })()}
                    </div>
                    <div className="max-h-[300px] overflow-auto space-y-1">
                      {(() => {
                        const menusArr = menusData?.indexedMenus?.menus || [];
                        const rows: { guid: string; name: string; menuName: string; path: string[] }[] = [];
                        const visit = (g: any, menuName: string, path: string[]) => {
                          if (hiddenGroups.has(g.guid)) rows.push({ guid: g.guid, name: g.name, menuName, path: [...path, g.name] });
                          for (const sub of (g.menuGroups || [])) visit(sub, menuName, [...path, g.name]);
                        };
                        for (const m of menusArr) {
                          for (const g of (m.menuGroups || [])) visit(g, m.name, []);
                        }
                        if (rows.length === 0) return <div className="text-sm text-muted-foreground">No hidden categories</div>;
                        return rows.map((row) => (
                          <div key={row.guid} className="w-full flex items-center justify-between gap-2">
                            <Button variant="ghost" className="flex-1 justify-start text-left">
                              <span className="block text-sm text-foreground">{row.name}</span>
                              <span className="block text-xs text-muted-foreground">Menu: {row.menuName} · Path: {row.path.join(' / ')}</span>
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setHiddenGroups(prev => { const n = new Set(prev); n.delete(row.guid); return n; })}>
                              <Eye className="mr-2 h-4 w-4" /> Unhide
                            </Button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}


function DimensionalAnalysis({ components, invMap }: { components: any[]; invMap: Map<string, any> }) {
  // Build models for inventory components (including overrides for nested menu components)
  const lines = useMemo(() => {
    const out: Array<{ name: string; model: ReturnType<typeof buildDimensionalAnalysisModel> }> = [];
    const pushLine = (comp: any) => {
      if (!comp || comp.kind !== 'inventory' || !comp.inventoryItem) return;
      const inv = invMap.get(String(comp.inventoryItem));
      const name = inv?.name || String(comp.inventoryItem);
      const invUnit = String(inv?.unit || 'each');
      const fromUnit = String(comp.unit || invUnit);
      const qty = Number(comp.quantity || 0);
      const model = buildDimensionalAnalysisModel(qty, fromUnit, invUnit);
      out.push({ name, model });
    };
    for (const c of (components || [])) {
      if (c.kind === 'inventory') pushLine(c);
      else if (c.kind === 'menu' && Array.isArray(c.overrides) && c.overrides.length > 0) {
        for (const oc of c.overrides) pushLine(oc);
      }
    }
    return out;
  }, [components, invMap]);

  if (!lines.length) return null;

  return (
    <div className="mt-4">
      <div className="space-y-1">
        {lines.map((l, idx) => (
          <DimensionalChain key={idx} model={l.model} />
        ))}
      </div>
    </div>
  );
}

function DimensionalChain({ model }: { model: ReturnType<typeof buildDimensionalAnalysisModel> }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">
        <span>{formatNum(model.initial.qty)} </span>
        <UnitWithCancel text={model.initial.unit} cancelled={!!model.initial.strike} />
      </span>
      {model.factors.map((f: { numQty: number; numUnit: string; denQty: number; denUnit: string; strikeNum?: boolean; strikeDen?: boolean }, i: number) => (
        <span key={i} className="inline-flex items-center gap-2">
          <span>×</span>
          <Fraction
            num={{ qty: f.numQty, unit: f.numUnit, strike: f.strikeNum }}
            den={{ qty: f.denQty, unit: f.denUnit, strike: f.strikeDen }}
          />
        </span>
      ))}
      <span>=</span>
      <span className="text-foreground font-medium">
        {formatNum(model.result.qty)} {model.result.unit}
      </span>
    </div>
  );
}

function Fraction({ num, den }: { num: { qty: number; unit: string; strike?: boolean }; den: { qty: number; unit: string; strike?: boolean } }) {
  return (
    <span className="inline-grid grid-cols-1 justify-items-center">
      <span>
        <span>{formatNum(num.qty)} </span>
        <UnitWithCancel text={num.unit} cancelled={!!num.strike} />
      </span>
      <span className="block w-full border-t border-muted-foreground" />
      <span>
        <span>{formatNum(den.qty)} </span>
        <UnitWithCancel text={den.unit} cancelled={!!den.strike} />
      </span>
    </span>
  );
}

function UnitWithCancel({ text, cancelled }: { text: string; cancelled?: boolean }) {
  return (
    <span className="relative inline-block">
      <span>{text}</span>
      {cancelled && (
        <span className="absolute inset-0 pointer-events-none" aria-hidden>
          <span
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              height: 2,
              backgroundColor: 'rgb(234 88 12)', // orange
              transform: 'rotate(-20deg) translateY(-50%)',
              transformOrigin: 'center',
            }}
          />
        </span>
      )}
    </span>
  );
}

function buildDimensionalAnalysisModel(quantity: number, fromUnit: string, toUnit: string) {
  const fDef = getUnitDef(fromUnit);
  const tDef = getUnitDef(toUnit);
  const from = fDef ? fDef.key : String(fromUnit);
  const to = tDef ? tDef.key : String(toUnit);
  const model: any = { initial: { qty: quantity, unit: from, strike: false }, factors: [] as any[], result: { qty: 0, unit: to } };
  if (!fDef || !tDef) {
    const result = convertQuantity(quantity, from, to);
    model.result.qty = result;
    return model;
  }
  const sameKind = fDef.kind === tDef.kind;
  const baseFrom = baseUnitFor(from);
  const baseTo = baseUnitFor(to);
  const FL_OZ_TO_ML = 29.5735295625;

  let currentQty = quantity;
  let lastNumUnit: string | null = null;
  const addFactor = (numQty: number, numUnit: string, denQty: number, denUnit: string) => {
    const factor: any = { numQty, numUnit, denQty, denUnit, strikeNum: false, strikeDen: false };
    // Strike denominator if it cancels with previous numerator or initial
    if (lastNumUnit && lastNumUnit === denUnit) {
      // strike previous numerator unit
      const prev = model.factors[model.factors.length - 1];
      if (prev) prev.strikeNum = true;
      else model.initial.strike = true;
      factor.strikeDen = true;
    } else if (!lastNumUnit && model.initial.unit === denUnit) {
      model.initial.strike = true;
      factor.strikeDen = true;
    }
    model.factors.push(factor);
    lastNumUnit = numUnit;
    currentQty = currentQty * (numQty / denQty);
  };

  // Step 1: to base of from-kind if needed
  if (from !== baseFrom) {
    addFactor(fDef.toBase, baseFrom, 1, from);
  } else {
    // if already at baseFrom, the first next factor will cancel this
    lastNumUnit = baseFrom;
  }

  if (sameKind) {
    // Step 2: from base to target unit
    if (to !== baseFrom) {
      const denom = getUnitDef(to)!.toBase;
      addFactor(1, to, denom, baseFrom);
    }
  } else {
    // Cross-family bridge for volumes (US <-> metric)
    if ((fDef.kind === 'volume_us' && tDef.kind === 'volume_metric')) {
      addFactor(FL_OZ_TO_ML, 'ml', 1, 'fl_oz');
      if (to !== baseTo) {
        const denom = getUnitDef(to)!.toBase;
        addFactor(1, to, denom, baseTo);
      }
    } else if ((fDef.kind === 'volume_metric' && tDef.kind === 'volume_us')) {
      addFactor(1, 'fl_oz', FL_OZ_TO_ML, 'ml');
      if (to !== baseTo) {
        const denom = getUnitDef(to)!.toBase;
        addFactor(1, to, denom, baseTo);
      }
    } else {
      // Incompatible families (e.g., mass <-> volume)
      currentQty = convertQuantity(quantity, from, to);
      model.factors = [];
    }
  }

  model.result.qty = currentQty;
  model.result.unit = to;
  return model as { initial: { qty: number; unit: string; strike: boolean }; factors: Array<{ numQty: number; numUnit: string; denQty: number; denUnit: string; strikeNum?: boolean; strikeDen?: boolean }>; result: { qty: number; unit: string } };
}

function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n);
  if (Math.abs(n - rounded) < 1e-9) return String(rounded);
  const s = Math.abs(n) >= 1 ? n.toFixed(4) : n.toFixed(6);
  return s.replace(/0+$/,'').replace(/\.$/,'');
}


