import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sku: String,
  syscoSKU: String,
  vendorSKU: String,
  quantityOrdered: {
    type: Number,
    required: true,
    min: 0
  },
  quantityReceived: {
    type: Number,
    default: 0,
    min: 0
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
    required: true,
    min: 0
  },
  notes: String
});

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled'],
    default: 'draft'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  items: [purchaseOrderItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  terms: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: Date,
  sentDate: Date,
  receivedDate: Date
}, {
  timestamps: true
});

// Indexes
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ supplier: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ orderDate: 1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1 });

// Pre-save middleware to calculate totals
purchaseOrderSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalCost, 0);
  this.total = this.subtotal + (this.tax || 0) + (this.shipping || 0);
  next();
});

export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);