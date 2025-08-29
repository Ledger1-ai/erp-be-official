import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { PurchaseOrder } from "@/lib/models/PurchaseOrder";
import { Supplier } from "@/lib/models/Supplier";
import { InventoryItem } from "@/lib/models/InventoryItem";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const status = searchParams.get('status');

    const query: any = {};
    if (vendorId) query.supplier = vendorId;
    if (status) query.status = status;

    const orders = await PurchaseOrder.find(query)
      .populate('supplier', 'name companyName supplierCode')
      .sort({ createdAt: -1 })
      .lean();

    // Live summary metrics (for dashboard cards)
    const metrics = {
      draft: orders.filter((o: any) => o.status === 'draft').length,
      sent: orders.filter((o: any) => o.status === 'sent').length,
      partially_received: orders.filter((o: any) => o.status === 'partially_received').length,
      received: orders.filter((o: any) => o.status === 'received').length,
      monthTotal: orders
        .filter((o: any) => o.createdAt && new Date(o.createdAt).getMonth() === new Date().getMonth() && new Date(o.createdAt).getFullYear() === new Date().getFullYear())
        .reduce((s: number, o: any) => s + Number(o.total || 0), 0),
      avgTotal: orders.length > 0 ? (orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0) / orders.length) : 0,
    };

    return NextResponse.json({ success: true, data: orders, metrics });
  } catch (error) {
    console.error('GET /api/orders error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { supplierId, supplierName, expectedDeliveryDate, items, notes, status } = body || {};

    if ((!supplierId && !supplierName) || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing supplier or items' }, { status: 400 });
    }

    let supplierRef = null;
    let supplierNameFinal = supplierName || '';
    if (supplierId) {
      const sup = await Supplier.findById(supplierId).lean();
      if (sup) {
        supplierRef = sup._id;
        supplierNameFinal = sup.name || sup.companyName || supplierNameFinal;
      }
    }

    // Generate PO number: PO-YYYYMMDD-HHMM-XXXX
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const hm = `${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const poNumber = `PO-${ymd}-${hm}-${rand}`;

    // Build items
    const mappedItems = [] as any[];
    for (const it of items) {
      // Optionally check inventory item exists
      let inv: any = null;
      if (it.inventoryItem) {
        inv = await InventoryItem.findById(it.inventoryItem).lean();
      }
      mappedItems.push({
        inventoryItem: it.inventoryItem || inv?._id,
        name: it.name || inv?.name,
        sku: it.sku,
        syscoSKU: it.syscoSKU,
        vendorSKU: it.vendorSKU,
        quantityOrdered: Number(it.quantityOrdered || it.orderQuantity || 0),
        quantityReceived: Number(it.quantityReceived || 0),
        unit: it.unit || inv?.unit || 'unit',
        unitCost: Number(it.unitCost || it.costPerUnit || 0),
        totalCost: Number(it.unitCost || it.costPerUnit || 0) * Number(it.quantityOrdered || it.orderQuantity || 0),
        notes: it.notes || ''
      });
    }

    const subtotal = mappedItems.reduce((s, i) => s + Number(i.totalCost || 0), 0);
    const order = await PurchaseOrder.create({
      poNumber,
      supplier: supplierRef,
      supplierName: supplierNameFinal,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      items: mappedItems,
      subtotal,
      total: subtotal,
      status: mapUiStatusToModel(status || 'open'),
      notes: notes || '',
      createdBy: null,
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('POST /api/orders error', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}

function mapUiStatusToModel(ui: string) {
  switch ((ui || '').toLowerCase()) {
    case 'open': return 'draft';
    case 'ordered': return 'sent';
    case 'partial': return 'partially_received';
    case 'received': return 'received';
    case 'cancelled': return 'cancelled';
    default: return 'draft';
  }
}


