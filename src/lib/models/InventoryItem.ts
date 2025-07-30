import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Proteins', 'Vegetables', 'Dairy', 'Pantry', 'Beverages', 'Spices', 'Other'],
    default: 'Other'
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minThreshold: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  maxCapacity: {
    type: Number,
    required: true,
    min: 0,
    default: 100
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    default: 'units'
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  supplierContact: {
    name: String,
    email: String,
    phone: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['normal', 'low', 'critical', 'out_of_stock'],
    default: 'normal'
  },
  location: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  waste: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderPoint: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries (barcode and qrCode already indexed via unique: true)
inventoryItemSchema.index({ name: 1 });
inventoryItemSchema.index({ category: 1 });
inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ supplier: 1 });

// Virtual for total value
inventoryItemSchema.virtual('totalValue').get(function() {
  return this.currentStock * this.costPerUnit;
});

// Pre-save middleware to update status based on stock levels
inventoryItemSchema.pre('save', function(next) {
  if (this.currentStock <= 0) {
    this.status = 'out_of_stock';
  } else if (this.currentStock <= this.minThreshold) {
    this.status = 'critical';
  } else if (this.currentStock <= this.minThreshold * 1.5) {
    this.status = 'low';
  } else {
    this.status = 'normal';
  }
  next();
});

export const InventoryItem = mongoose.models.InventoryItem || mongoose.model('InventoryItem', inventoryItemSchema); 