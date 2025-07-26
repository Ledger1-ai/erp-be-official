import mongoose from 'mongoose';

const performanceSchema = new mongoose.Schema({
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  completedShifts: {
    type: Number,
    default: 0
  },
  onTimeRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  customerRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  salesGenerated: {
    type: Number,
    default: 0
  }
});

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Kitchen', 'Front of House', 'Management', 'Support'],
    default: 'Support'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  joinDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  availability: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Seasonal', 'On-call'],
    default: 'Part-time'
  },
  skills: [{
    type: String,
    trim: true
  }],
  performance: {
    type: performanceSchema,
    default: () => ({})
  },
  toastId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String,
    default: ''
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
teamMemberSchema.index({ email: 1 });
teamMemberSchema.index({ department: 1 });
teamMemberSchema.index({ status: 1 });
teamMemberSchema.index({ toastId: 1 });

export const TeamMember = mongoose.models.TeamMember || mongoose.model('TeamMember', teamMemberSchema); 