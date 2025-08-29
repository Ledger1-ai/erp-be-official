import { connectDB } from "@/lib/db/connection";
import { PurchaseOrder } from "@/lib/models/PurchaseOrder";
import { InventoryTransaction } from "@/lib/models/InventoryTransaction";
import { InventoryItem } from "@/lib/models/InventoryItem";
import { User } from "@/lib/models/User";

async function main() {
	console.log("Starting backfill of inventory transactions...");
	await connectDB();
	let createdReceiving = 0;
	let createdWaste = 0;

	// Determine a system user for createdBy
	let systemUser: any = await User.findOne({ email: 'system@varuni.local' }).lean();
	if (!systemUser) {
		systemUser = await User.create({
			name: 'System',
			email: 'system@varuni.local',
			password: 'ChangeMe123!@#',
			role: 'Super Admin',
			permissions: ['admin', 'inventory', 'analytics']
		});
	}

	// 1) Backfill receiving transactions from existing purchase orders (delta-aware)
	const orders = await PurchaseOrder.find({}).lean();
	for (const order of orders) {
		const items = Array.isArray((order as any).items) ? (order as any).items : [];
		for (const it of items) {
			const qtyReceivedPO = Number(it.quantityReceived || 0);
			if (!it.inventoryItem || qtyReceivedPO <= 0) continue;
			const txs = await InventoryTransaction.aggregate([
				{ $match: { transactionType: 'receiving', referenceType: 'PurchaseOrder', referenceId: order._id, inventoryItem: it.inventoryItem } },
				{ $group: { _id: null, total: { $sum: '$quantity' } } }
			]);
			const alreadyTxQty = txs && txs.length ? Number(txs[0].total || 0) : 0;
			const delta = qtyReceivedPO - alreadyTxQty;
			if (delta > 0) {
				await InventoryTransaction.create({
					inventoryItem: it.inventoryItem,
					itemName: it.name,
					transactionType: 'receiving',
					quantity: delta,
					unit: it.unit,
					unitCost: Number(it.unitCost || 0),
					totalCost: delta * Number(it.unitCost || 0),
					balanceBefore: 0,
					balanceAfter: 0,
					location: undefined,
					referenceType: 'PurchaseOrder',
					referenceId: order._id,
					referenceNumber: (order as any).poNumber,
					supplier: (order as any).supplier,
					createdBy: systemUser._id,
					createdAt: (order as any).updatedAt || (order as any).receivedDate || new Date(),
					updatedAt: (order as any).updatedAt || (order as any).receivedDate || new Date(),
				});
				createdReceiving += 1;
			}
		}
	}

	// 2) Backfill waste transactions from item wasteLogs (if missing)
	const itemsWithWaste = await InventoryItem.find({ 'wasteLogs.0': { $exists: true } }).select('name unit costPerUnit wasteLogs').lean();
	for (const it of itemsWithWaste as any[]) {
		const cpu = Number(it.costPerUnit || 0);
		for (const log of (it.wasteLogs || [])) {
			const ref = `WASTE_LOG:${log._id}`;
			const exists = await InventoryTransaction.findOne({
				transactionType: 'waste',
				referenceNumber: ref,
			}).lean();
			if (exists) continue;
			const q = Math.abs(Number(log.quantity || 0));
			await InventoryTransaction.create({
				inventoryItem: it._id,
				itemName: it.name,
				transactionType: 'waste',
				quantity: q,
				unit: it.unit || 'units',
				unitCost: cpu,
				totalCost: q * cpu,
				balanceBefore: 0,
				balanceAfter: 0,
				location: undefined,
				reason: log.reason || 'waste',
				notes: log.notes,
				referenceType: 'Manual',
				referenceNumber: ref,
				createdBy: systemUser._id,
				createdAt: log.date || new Date(),
				updatedAt: log.date || new Date(),
			});
			createdWaste += 1;
		}
	}

	console.log(`Backfill complete. Receiving tx: ${createdReceiving}, Waste tx: ${createdWaste}`);
	process.exit(0);
}

main().catch((e) => {
	console.error('Backfill failed', e);
	process.exit(1);
});


