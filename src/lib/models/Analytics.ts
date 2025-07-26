import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  date: {
    type: Date,
    required: true
  },
  revenue: {
    type: Number,
    default: 0,
    min: 0
  },
  orders: {
    type: Number,
    default: 0,
    min: 0
  },
  avgOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  customerSatisfaction: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  tableTurnover: {
    type: Number,
    default: 0,
    min: 0
  },
  // Additional metrics
  totalCustomers: {
    type: Number,
    default: 0,
    min: 0
  },
  repeatCustomers: {
    type: Number,
    default: 0,
    min: 0
  },
  averageWaitTime: {
    type: Number,
    default: 0,
    min: 0
  },
  staffUtilization: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  inventoryValue: {
    type: Number,
    default: 0,
    min: 0
  },
  wastePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Category breakdowns
  categorySales: [{
    category: String,
    revenue: Number,
    orders: Number
  }],
  // Staff performance
  staffPerformance: [{
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeamMember'
    },
    shifts: Number,
    sales: Number,
    rating: Number
  }],
  // Peak hours analysis
  peakHours: [{
    hour: Number,
    orders: Number,
    revenue: Number
  }],
  // Weather correlation (if available)
  weather: {
    temperature: Number,
    condition: String,
    impact: String
  },
  // Special events or promotions
  events: [{
    name: String,
    impact: String,
    revenue: Number
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
analyticsSchema.index({ period: 1, date: 1 });
analyticsSchema.index({ date: 1 });
analyticsSchema.index({ period: 1 });

// Compound index for efficient date range queries
analyticsSchema.index({ date: 1, period: 1 });

// Virtual for customer retention rate
analyticsSchema.virtual('customerRetentionRate').get(function() {
  if (this.totalCustomers === 0) return 0;
  return (this.repeatCustomers / this.totalCustomers) * 100;
});

// Static method to get analytics for a date range
analyticsSchema.statics.getAnalyticsForRange = async function(startDate: Date, endDate: Date, period: string) {
  return await this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    },
    period: period
  }).sort({ date: 1 });
};

// Static method to aggregate analytics
analyticsSchema.statics.aggregateAnalytics = async function(startDate: Date, endDate: Date) {
  return await this.aggregate([
    {
      $match: {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$revenue' },
        totalOrders: { $sum: '$orders' },
        avgCustomerSatisfaction: { $avg: '$customerSatisfaction' },
        avgTableTurnover: { $avg: '$tableTurnover' },
        totalCustomers: { $sum: '$totalCustomers' },
        avgWaitTime: { $avg: '$averageWaitTime' }
      }
    }
  ]);
};

export const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema); 