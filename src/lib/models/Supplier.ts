import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: String,
  title: String,
  email: String,
  phone: String,
  mobile: String,
  isPrimary: {
    type: Boolean,
    default: false
  }
});

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: {
    type: String,
    default: 'US'
  }
});

const paymentTermsSchema = new mongoose.Schema({
  terms: {
    type: String,
    enum: ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'COD', 'Prepaid', 'Custom'],
    default: 'Net 30'
  },
  customTerms: String,
  creditLimit: Number,
  currentBalance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  }
});

const performanceMetricsSchema = new mongoose.Schema({
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  onTimeDeliveryRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  qualityRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  responseTime: {
    type: Number,
    default: 0 // hours
  },
  lastOrderDate: Date,
  lastDeliveryDate: Date
});

const vendorRepresentativeSchema = new mongoose.Schema({
  name: String,
  title: String,
  email: String,
  phone: String,
  mobile: String,
  startDate: Date,
  notes: String
}, { _id: false });

const representativeHistorySchema = new mongoose.Schema({
  representative: vendorRepresentativeSchema,
  fromDate: Date,
  toDate: Date,
  reason: String,
  changedBy: String,
  changedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  supplierCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Primary', 'Secondary', 'Emergency', 'Specialty'],
    default: 'Primary'
  },
  categories: [{
    type: String,
    enum: ['Proteins', 'Vegetables', 'Dairy', 'Pantry', 'Beverages', 'Spices', 'Equipment', 'Packaging', 'Other']
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending', 'Suspended'],
    default: 'Active'
  },
  contacts: [contactSchema],
  address: addressSchema,
  paymentTerms: paymentTermsSchema,
  deliveryInfo: {
    deliveryDays: [String], // ['Monday', 'Wednesday', 'Friday']
    deliveryWindow: String, // '8 AM - 12 PM'
    minimumOrder: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 0
    },
    leadTimeDays: {
      type: Number,
      default: 1
    }
  },
  performanceMetrics: performanceMetricsSchema,
  certifications: [String], // ['HACCP', 'Organic', 'FDA Approved']
  documents: [{
    name: String,
    type: String, // 'Contract', 'Certificate', 'Insurance'
    url: String,
    uploadDate: Date,
    expiryDate: Date
  }],
  currentRepresentative: vendorRepresentativeSchema,
  representativeHistory: [representativeHistorySchema],
  notes: String,
  isPreferred: {
    type: Boolean,
    default: false
  },
  syscoIntegration: {
    isIntegrated: {
      type: Boolean,
      default: false
    },
    supplierCode: String,
    apiEndpoint: String,
    lastSync: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
supplierSchema.index({ name: 1 });
supplierSchema.index({ companyName: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ type: 1 });
supplierSchema.index({ categories: 1 });
supplierSchema.index({ isPreferred: 1 });
supplierSchema.index({ 'currentRepresentative.name': 1 });

// Virtual for primary contact
supplierSchema.virtual('primaryContact').get(function() {
  return this.contacts.find(contact => contact.isPrimary) || this.contacts[0];
});

export const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);