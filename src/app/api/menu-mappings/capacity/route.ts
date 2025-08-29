import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { MenuMapping } from '@/lib/models/MenuMapping';
import { InventoryItem } from '@/lib/models/InventoryItem';

async function explodeToInventory(
  restaurantGuid: string,
  toastItemGuid: string,
  baseQty: number,
  acc: Map<string, Map<string, number>>,
  visited: Set<string>
): Promise<void> {
  if (visited.has(toastItemGuid)) return;
  visited.add(toastItemGuid);
  const mapping: any = await MenuMapping.findOne({ restaurantGuid, toastItemGuid }).lean();
  if (!mapping) return;
  for (const c of (mapping.components || [])) {
    if (c.kind === 'inventory' && c.inventoryItem) {
      const unit = String(c.unit || 'units');
      const q = Number(c.quantity || 0) * baseQty;
      if (!acc.has(String(c.inventoryItem))) acc.set(String(c.inventoryItem), new Map());
      const byUnit = acc.get(String(c.inventoryItem))!;
      byUnit.set(unit, (byUnit.get(unit) || 0) + q);
    } else if (c.kind === 'menu' && c.nestedToastItemGuid) {
      if (Array.isArray(c.overrides) && c.overrides.length > 0) {
        for (const oc of c.overrides) {
          if (oc.kind === 'inventory' && oc.inventoryItem) {
            const unit = String(oc.unit || 'units');
            const q = Number(oc.quantity || 0) * baseQty * Number(c.quantity || 1);
            if (!acc.has(String(oc.inventoryItem))) acc.set(String(oc.inventoryItem), new Map());
            const byUnit = acc.get(String(oc.inventoryItem))!;
            byUnit.set(unit, (byUnit.get(unit) || 0) + q);
          } else if (oc.kind === 'menu' && oc.nestedToastItemGuid) {
            await explodeToInventory(restaurantGuid, oc.nestedToastItemGuid, baseQty * Number(c.quantity || 1) * Number(oc.quantity || 1), acc, visited);
          }
        }
      } else {
        await explodeToInventory(restaurantGuid, c.nestedToastItemGuid, baseQty * Number(c.quantity || 0), acc, visited);
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const restaurantGuid = searchParams.get('restaurantGuid');
    const toastItemGuid = searchParams.get('toastItemGuid');
    if (!restaurantGuid || !toastItemGuid) {
      return NextResponse.json({ success: false, error: 'restaurantGuid and toastItemGuid required' }, { status: 400 });
    }

    const acc = new Map<string, Map<string, number>>();
    await explodeToInventory(restaurantGuid, toastItemGuid, 1, acc, new Set());

    // Compute capacity by inventory availability
    let capacity = Infinity;
    let allHaveStock = true;
    const requirements: Array<{ inventoryItem: string; unit: string; quantityPerOrder: number; available: number } > = [];
    for (const [invId, byUnit] of acc.entries()) {
      const item: any = await InventoryItem.findById(invId).lean();
      const unitAndQty = Array.from(byUnit.entries());
      for (const [unit, qPer] of unitAndQty) {
        const stock = Number(item?.currentStock || 0);
        const possible = qPer > 0 ? Math.floor(stock / qPer) : 0;
        if (stock <= 0) allHaveStock = false;
        if (qPer > 0) capacity = Math.min(capacity, possible);
        requirements.push({ inventoryItem: String(invId), unit, quantityPerOrder: qPer, available: stock });
      }
    }
    if (capacity === Infinity) capacity = 0;
    if (!allHaveStock) capacity = 0;
    return NextResponse.json({ success: true, data: { capacity, allHaveStock, requirements } });
  } catch (e) {
    console.error('GET /api/menu-mappings/capacity error', e);
    return NextResponse.json({ success: false, error: 'Failed to compute capacity' }, { status: 500 });
  }
}


