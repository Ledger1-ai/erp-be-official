import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { PurchaseOrder } from "@/lib/models/PurchaseOrder";
import { Supplier } from "@/lib/models/Supplier";

export async function GET(_req: NextRequest, { params }: any) {
  try {
    await connectDB();
    const order = await PurchaseOrder.findById(params.id)
      .populate('supplier', 'name companyName supplierCode')
      .lean();
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: order });
  } catch (e) {
    console.error('GET /api/orders/[id] error', e);
    return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: any) {
  try {
    await connectDB();
    const body = await request.json();
    const update: any = {};

    if (body.supplierId) update.supplier = body.supplierId;
    if (body.supplierName) update.supplierName = body.supplierName;
    if (body.expectedDeliveryDate) update.expectedDeliveryDate = new Date(body.expectedDeliveryDate);
    if (body.notes !== undefined) update.notes = body.notes;
    if (Array.isArray(body.items)) {
      update.items = body.items.map((it: any) => ({
        inventoryItem: it.inventoryItem,
        name: it.name,
        sku: it.sku,
        syscoSKU: it.syscoSKU,
        vendorSKU: it.vendorSKU,
        quantityOrdered: Number(it.quantityOrdered || 0),
        quantityReceived: Number(it.quantityReceived || 0),
        unit: it.unit,
        unitCost: Number(it.unitCost || 0),
        totalCost: Number(it.unitCost || 0) * Number(it.quantityOrdered || 0),
        notes: it.notes || ''
      }));
    }
    if (body.status) {
      update.status = mapUiStatusToModel(body.status);
      if (update.status === 'received') {
        update.receivedDate = new Date();
      }
    }

    const order = await PurchaseOrder.findByIdAndUpdate(params.id, update, { new: true });
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: order });
  } catch (e) {
    console.error('PATCH /api/orders/[id] error', e);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
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


