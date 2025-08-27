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
    enum: ['Proteins', 'Vegetables', 'Dairy', 'Pantry', 'Beverages', 'Spices', 'Bakery', 'Condiments', 'Packaging', 'Desserts', 'Other'],
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
  barcodeMapping: {
    scannedBarcode: {
      type: String,
      sparse: true
    },
    mappedAt: {
      type: Date
    },
    mappedBy: {
      type: String // User who mapped it
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'high'
    },
    verified: {
      type: Boolean,
      default: false
    }
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
  brand: {
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
  // Restock planning
  restockPeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    default: 'weekly'
  },
  restockDays: {
    type: Number,
    min: 1,
    default: 7
  },
  reorderQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  // Sysco-specific ordering fields
  syscoSKU: {
    type: String,
    trim: true,
    sparse: true
  },
  vendorSKU: {
    type: String,
    trim: true
  },
  casePackSize: {
    type: Number,
    default: 1,
    min: 1
  },
  vendorCode: {
    type: String,
    trim: true
  },
  syscoCategory: {
    type: String,
    trim: true
  },
  leadTimeDays: {
    type: Number,
    default: 1,
    min: 0
  },
  minimumOrderQty: {
    type: Number,
    default: 1,
    min: 1
  },
  pricePerCase: {
    type: Number,
    default: 0,
    min: 0
  },
  lastOrderDate: {
    type: Date
  },
  preferredVendor: {
    type: String,
    trim: true
  },
  alternateVendors: [{
    name: String,
    sku: String,
    price: Number,
    leadTime: Number
  }],
  // Additional tracking fields
  averageDailyUsage: {
    type: Number,
    default: 0,
    min: 0
  },
  seasonalItem: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  wasteLogs: [{
    date: { type: Date, default: Date.now },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
    notes: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
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
inventoryItemSchema.index({ syscoSKU: 1 });
inventoryItemSchema.index({ vendorSKU: 1 });
inventoryItemSchema.index({ syscoCategory: 1 });

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