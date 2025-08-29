import { connectDB } from "@/lib/db/connection";
import { PurchaseOrder } from "@/lib/models/PurchaseOrder";
import { InventoryTransaction } from "@/lib/models/InventoryTransaction";
import { InventoryItem } from "@/lib/models/InventoryItem";
import { User } from "@/lib/models/User";

async function ensureSystemUser() {
	let sys: any = await User.findOne({ email: 'system@varuni.local' }).lean();
	if (!sys) sys = await User.create({ name: 'System', email: 'system@varuni.local', password: 'ChangeMe123!@#', role: 'Super Admin', permissions: ['admin','inventory','analytics'] });
	return sys._id as string;
}

async function addReceivingDelta(order: any, line: any, delta: number, createdBy: string) {
	const itemDoc: any = await InventoryItem.findById(line.inventoryItem);
	if (itemDoc) {
		const before = Number(itemDoc.currentStock || 0);
		const after = before + delta;
		itemDoc.currentStock = after;
		itemDoc.lastUpdated = new Date();
		if (after <= 0) itemDoc.status = 'out_of_stock';
		else if (after <= itemDoc.minThreshold) itemDoc.status = 'critical';
		else if (after <= itemDoc.minThreshold * 1.5) itemDoc.status = 'low';
		else itemDoc.status = 'normal';
		await itemDoc.save();
	}
	await InventoryTransaction.create({
		inventoryItem: line.inventoryItem,
		itemName: line.name,
		transactionType: 'receiving',
		quantity: delta,
		unit: line.unit,
		unitCost: Number(line.unitCost || 0),
		totalCost: delta * Number(line.unitCost || 0),
		balanceBefore: 0,
		balanceAfter: 0,
		location: undefined,
		referenceType: 'PurchaseOrder',
		referenceId: order._id,
		referenceNumber: order.poNumber,
		supplier: order.supplier,
		createdBy,
		createdAt: order.receivedDate || order.updatedAt || new Date(),
		updatedAt: order.receivedDate || order.updatedAt || new Date(),
	});
}

async function reverseReceivingForOrder(orderId: string, createdBy: string) {
	const rx = await InventoryTransaction.find({ referenceType: 'PurchaseOrder', referenceId: orderId, transactionType: 'receiving', isReversed: { $ne: true } }).lean();
	for (const t of rx) {
		const item: any = await InventoryItem.findById(t.inventoryItem);
		if (item) {
			const before = Number(item.currentStock || 0);
			const after = Math.max(0, before - Math.abs(Number(t.quantity || 0)));
			item.currentStock = after;
			if (after <= 0) item.status = 'out_of_stock';
			else if (after <= item.minThreshold) item.status = 'critical';
			else if (after <= item.minThreshold * 1.5) item.status = 'low';
			else item.status = 'normal';
			await item.save();
		}
		await InventoryTransaction.updateOne({ _id: t._id }, { $set: { isReversed: true, reversedDate: new Date(), reversalReason: 'Repair: PO not in received/partial' } });
		await InventoryTransaction.create({
			inventoryItem: t.inventoryItem,
			itemName: (t as any).itemName,
			transactionType: 'adjustment',
			quantity: -Math.abs(Number(t.quantity || 0)),
			unit: (t as any).unit,
			unitCost: Number((t as any).unitCost || 0),
			totalCost: Math.abs(Number(t.quantity || 0)) * Number((t as any).unitCost || 0),
			balanceBefore: 0,
			balanceAfter: 0,
			location: (t as any).location,
			referenceType: 'PurchaseOrder',
			referenceId: (t as any).referenceId,
			referenceNumber: (t as any).referenceNumber,
			supplier: (t as any).supplier,
			createdBy,
		});
	}
}

async function main() {
	console.log('Starting PO receipts repair...');
	await connectDB();
	const createdBy = await ensureSystemUser();

	// 1) For POs in received/partial, ensure receiving transactions and update stocks
	const goodPOs = await PurchaseOrder.find({ status: { $in: ['received','partially_received'] } }).lean();
	let created = 0;
	for (const o of goodPOs as any[]) {
		for (const it of (o.items || [])) {
			if (!it.inventoryItem) continue;
			const qtyRec = Number(it.quantityReceived || 0);
			if (qtyRec <= 0) continue;
			const agg = await InventoryTransaction.aggregate([
				{ $match: { referenceType: 'PurchaseOrder', referenceId: o._id, transactionType: 'receiving', inventoryItem: it.inventoryItem } },
				{ $group: { _id: null, total: { $sum: '$quantity' } } }
			]);
			const existingQty = agg && agg.length ? Number(agg[0].total || 0) : 0;
			const delta = qtyRec - existingQty;
			if (delta > 0) {
				await addReceivingDelta(o, it, delta, createdBy);
				created += 1;
			}
		}
	}

	// 2) For POs NOT in received/partial, reverse any prior receiving still active
	const badPOs = await PurchaseOrder.find({ status: { $nin: ['received','partially_received'] } }).lean();
	let reversedFromBad = 0;
	for (const o of badPOs as any[]) {
		const rxCount = await InventoryTransaction.countDocuments({ referenceType: 'PurchaseOrder', referenceId: o._id, transactionType: 'receiving', isReversed: { $ne: true } });
		if (rxCount > 0) {
			await reverseReceivingForOrder(String(o._id), createdBy);
			reversedFromBad += rxCount;
		}
	}

	console.log(`Repair complete. Receiving created: ${created}, Receiving reversed (non-received POs): ${reversedFromBad}`);
	process.exit(0);
}

main().catch((e) => {
	console.error('Repair failed', e);
	process.exit(1);
});


