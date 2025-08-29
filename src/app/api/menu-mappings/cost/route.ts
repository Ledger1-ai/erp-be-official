import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { MenuMapping } from '@/lib/models/MenuMapping';
import { InventoryItem } from '@/lib/models/InventoryItem';

async function computeCost(restaurantGuid: string, toastItemGuid: string, visited = new Set<string>()): Promise<number> {
  if (visited.has(toastItemGuid)) return 0; // prevent cycles
  visited.add(toastItemGuid);

  const mapping = await MenuMapping.findOne({ restaurantGuid, toastItemGuid }).lean();
  if (!mapping) return 0;
  let total = 0;
  for (const c of (mapping.components || [])) {
    if (c.kind === 'inventory' && c.inventoryItem) {
      const inv: any = await InventoryItem.findById(c.inventoryItem).lean();
      const unitCost = Number(inv?.costPerUnit || 0);
      total += unitCost * Number(c.quantity || 0);
    } else if (c.kind === 'menu' && c.nestedToastItemGuid) {
      total += await computeCost(restaurantGuid, c.nestedToastItemGuid, visited);
    }
  }
  return total;
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

    const cost = await computeCost(restaurantGuid, toastItemGuid);
    return NextResponse.json({ success: true, data: { cost } });
  } catch (e) {
    console.error('GET /api/menu-mappings/cost error', e);
    return NextResponse.json({ success: false, error: 'Failed to compute cost' }, { status: 500 });
  }
}


