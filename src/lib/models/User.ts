import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
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
  role: {
    type: String,
    required: true,
    enum: ['Super Admin', 'Manager', 'Shift Supervisor', 'Staff'],
    default: 'Staff'
  },
  avatar: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  permissions: [{
    type: String,
    enum: ['dashboard', 'scheduling', 'inventory', 'invoicing', 'team', 'analytics', 'settings']
  }]
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema); 