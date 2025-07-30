import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientEmail: {
    type: String,
    trim: true
  },
  clientPhone: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  paidDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'online'],
    default: 'credit_card'
  },
  items: [invoiceItemSchema],
  notes: {
    type: String,
    trim: true
  },
  terms: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamMember'
  }
}, {
  timestamps: true
});

// Indexes for faster queries (invoiceNumber already indexed via unique: true)
invoiceSchema.index({ clientName: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ issuedDate: 1 });

// Pre-save middleware to calculate total amount
invoiceSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    const subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    this.amount = subtotal;
    this.totalAmount = subtotal + (this.tax || 0);
  }
  next();
});

// Static method to generate invoice number
invoiceSchema.statics.generateInvoiceNumber = async function() {
  const lastInvoice = await this.findOne().sort({ invoiceNumber: -1 });
  const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) : 0;
  const year = new Date().getFullYear();
  return `INV-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
};

export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema); 