import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema({
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  transactionType: {
    type: String,
    enum: [
      'purchase', 'sale', 'waste', 'theft', 'adjustment', 'transfer_in', 'transfer_out',
      'receiving', 'return', 'production', 'consumption', 'count_adjustment', 'expiry'
    ],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  location: String,
  batchNumber: String,
  expiryDate: Date,
  reason: String,
  notes: String,
  referenceType: {
    type: String,
    enum: ['PurchaseOrder', 'Recipe', 'Sale', 'InventoryCount', 'Transfer', 'Manual', 'System'],
    default: 'Manual'
  },
  referenceId: mongoose.Schema.Types.ObjectId,
  referenceNumber: String,
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isReversed: {
    type: Boolean,
    default: false
  },
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reversedDate: Date,
  reversalReason: String
}, {
  timestamps: true
});

// Indexes for performance
inventoryTransactionSchema.index({ inventoryItem: 1, createdAt: -1 });
inventoryTransactionSchema.index({ transactionType: 1 });
inventoryTransactionSchema.index({ createdAt: -1 });
inventoryTransactionSchema.index({ referenceType: 1, referenceId: 1 });
inventoryTransactionSchema.index({ supplier: 1 });
inventoryTransactionSchema.index({ isReversed: 1 });

export const InventoryTransaction = mongoose.models.InventoryTransaction || mongoose.model('InventoryTransaction', inventoryTransactionSchema);