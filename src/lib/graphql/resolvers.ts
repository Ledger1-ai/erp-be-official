import { User } from '../models/User';
import { TeamMember } from '../models/TeamMember';
import { Shift } from '../models/Shift';
import { InventoryItem } from '../models/InventoryItem';
import { Invoice } from '../models/Invoice';
import { Analytics } from '../models/Analytics';
import mongoose from 'mongoose';
import { 
  requireAuth, 
  requirePermission, 
  requireRole, 
  withAuth, 
  withPermission,
  withRole,
  filterByPermissions,
  AuthContext 
} from './auth-guards';

// TypeScript types for resolver parameters
interface ResolverArgs {
  id?: string;
  input?: any;
  startDate?: string;
  endDate?: string;
  period?: string;
  quantity?: number;
}

export const resolvers = {
  Query: {
    // User queries
    me: withAuth(async (_: any, __: any, context: AuthContext) => {
      return await User.findById(context.user!.userId);
    }),
    
    users: withPermission('team', async () => {
      return await User.find({ isActive: true }).select('-password');
    }),

    // Team queries - Allow read access but filter data
    teamMembers: async (_: any, __: any, context: AuthContext) => {
      try {
        const members = await TeamMember.find({}).populate('performance');
        
        // If authenticated and has permission, return all data
        if (context.isAuthenticated && context.hasPermission('team')) {
          return members;
        }
        
        // If not authenticated, return empty array for now
        // In production, you might want to return public team info
        return [];
      } catch (error) {
        console.error('Error fetching team members:', error);
        return [];
      }
    },

    teamMember: async (_: any, { id }: ResolverArgs, context: AuthContext) => {
      try {
        const member = await TeamMember.findById(id).populate('performance');
        if (!member) return null;
        
        // Check permissions
        if (context.isAuthenticated && (
          context.hasPermission('team') || 
          member.userId === context.user?.userId
        )) {
          return member;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching team member:', error);
        return null;
      }
    },

    // Scheduling queries - Allow read access but filter data
    shifts: async (_: any, { startDate, endDate }: ResolverArgs, context: AuthContext) => {
      try {
        const filter: any = {};
        if (startDate && endDate) {
          filter.date = {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string)
          };
        }
        
        const shifts = await Shift.find(filter).populate('teamMember');
        
        // If authenticated and has permission, return all data
        if (context.isAuthenticated && context.hasPermission('scheduling')) {
          return shifts;
        }
        
        // If not authenticated, return empty array
        return [];
      } catch (error) {
        console.error('Error fetching shifts:', error);
        return [];
      }
    },

    shift: async (_: any, { id }: ResolverArgs, context: AuthContext) => {
      try {
        const shift = await Shift.findById(id).populate('teamMember');
        if (!shift) return null;
        
        // Check permissions
        if (context.isAuthenticated && (
          context.hasPermission('scheduling') || 
          shift.assignedTo === context.user?.userId
        )) {
          return shift;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching shift:', error);
        return null;
      }
    },

    // Inventory queries - Allow read access but filter data
    inventoryItems: async () => {
      console.log('*** GraphQL inventoryItems resolver called ***');
      
      try {
        const items = await InventoryItem.find({}).sort({ createdAt: -1 });
        console.log(`*** GraphQL returning ${items.length} items ***`);
        return items;
      } catch (error) {
        console.error('*** GraphQL error:', error);
        return [];
      }
    },

    inventoryItem: async (_: any, { id }: ResolverArgs, context: AuthContext) => {
      try {
        const item = await InventoryItem.findById(id);
        if (!item) return null;
        
        // If authenticated and has permission, return data
        if (context.isAuthenticated && context.hasPermission('inventory')) {
          return item;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching inventory item:', error);
        return null;
      }
    },

    lowStockItems: async (_: any, __: any, context: AuthContext) => {
      try {
        // If authenticated and has permission, return all data
        if (context.isAuthenticated && context.hasPermission('inventory')) {
          return await InventoryItem.find({
            $expr: { $lte: ['$currentStock', '$minThreshold'] }
          });
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching low stock items:', error);
        return [];
      }
    },

    // Invoicing queries
    invoices: async (_: any, __: any, context: AuthContext) => {
      try {
        if (context.isAuthenticated && context.hasPermission('invoicing')) {
          const invoices = await Invoice.find({});
          return filterByPermissions(invoices, context);
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }
    },

    invoice: async (_: any, { id }: ResolverArgs, context: AuthContext) => {
      try {
        const invoice = await Invoice.findById(id);
        if (!invoice) return null;
        
        // Check permissions
        if (context.isAuthenticated && (
          context.hasPermission('invoicing') || 
          invoice.userId === context.user?.userId
        )) {
          return invoice;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching invoice:', error);
        return null;
      }
    },

    // Analytics queries - Allow basic access
    analytics: async (_: any, { period }: ResolverArgs, context: AuthContext) => {
      try {
        // Basic analytics can be viewed by authenticated users
        if (context.isAuthenticated) {
          const analytics = await Analytics.findOne({ period });
          if (!analytics) {
            // Return default analytics if none found
            return {
              revenue: 0,
              orders: 0,
              avgOrderValue: 0,
              customerSatisfaction: 0,
              tableTurnover: 0,
              totalCustomers: 0,
              repeatCustomers: 0,
              averageWaitTime: 0,
              staffUtilization: 0,
              inventoryValue: 0,
              wastePercentage: 0,
              period: period
            };
          }
          return analytics;
        }
        
        // Return basic demo analytics for unauthenticated users
        return {
          revenue: 1250.00,
          orders: 45,
          avgOrderValue: 27.78,
          customerSatisfaction: 4.2,
          tableTurnover: 2.1,
          totalCustomers: 38,
          repeatCustomers: 12,
          averageWaitTime: 8.5,
          staffUtilization: 75.0,
          inventoryValue: 5680.00,
          wastePercentage: 3.2,
          period: period || 'daily'
        };
      } catch (error) {
        console.error('Error fetching analytics:', error);
        return {
          revenue: 0,
          orders: 0,
          avgOrderValue: 0,
          customerSatisfaction: 0,
          tableTurnover: 0,
          totalCustomers: 0,
          repeatCustomers: 0,
          averageWaitTime: 0,
          staffUtilization: 0,
          inventoryValue: 0,
          wastePercentage: 0,
          period: period || 'daily'
        };
      }
    },

    revenueAnalytics: async (_: any, { startDate, endDate }: ResolverArgs, context: AuthContext) => {
      try {
        if (context.isAuthenticated && context.hasPermission('analytics')) {
          return await Analytics.find({
            date: {
              $gte: new Date(startDate as string),
              $lte: new Date(endDate as string)
            }
          }).sort({ date: 1 });
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching revenue analytics:', error);
        return [];
      }
    }
  },

  Mutation: {
    // User mutations
    createUser: withRole(['Super Admin'], async (_: any, { input }: ResolverArgs) => {
      // Don't allow password in input - it should be set separately
      const { password, ...userData } = input;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      const user = new User(userData);
      return await user.save();
    }),

    updateUser: withAuth(async (_: any, { id, input }: ResolverArgs, context: AuthContext) => {
      // Users can update their own profile, admins can update any user
      if (id !== context.user!.userId && !context.hasRole(['Super Admin', 'Manager'])) {
        throw new Error('Access denied');
      }
      
      // Don't allow updating sensitive fields unless admin
      if (!context.hasRole(['Super Admin'])) {
        delete input.role;
        delete input.permissions;
        delete input.isActive;
      }
      
      return await User.findByIdAndUpdate(id, input, { new: true }).select('-password');
    }),

    deleteUser: withRole(['Super Admin'], async (_: any, { id }: ResolverArgs, context: AuthContext) => {
      // Don't allow deleting yourself
      if (id === context.user!.userId) {
        throw new Error('Cannot delete your own account');
      }
      
      await User.findByIdAndUpdate(id, { isActive: false });
      return true;
    }),

    // Team mutations
    createTeamMember: withPermission('team', async (_: any, { input }: ResolverArgs, context: AuthContext) => {
      // Only managers and admins can create team members
      requireRole(context, ['Super Admin', 'Manager']);
      
      const teamMember = new TeamMember({
        ...input,
        createdBy: context.user!.userId
      });
      return await teamMember.save();
    }),

    updateTeamMember: withPermission('team', async (_: any, { id, input }: ResolverArgs, context: AuthContext) => {
      const member = await TeamMember.findById(id);
      if (!member) throw new Error('Team member not found');
      
      // Check permissions
      if (!context.hasRole(['Super Admin', 'Manager']) && member.userId !== context.user!.userId) {
        throw new Error('Access denied');
      }
      
      return await TeamMember.findByIdAndUpdate(id, input, { new: true });
    }),

    deleteTeamMember: withRole(['Super Admin', 'Manager'], async (_: any, { id }: ResolverArgs) => {
      await TeamMember.findByIdAndDelete(id);
      return true;
    }),

    syncFromToast: withRole(['Super Admin', 'Manager'], async () => {
      // TODO: Implement Toast POS integration
      console.log('Syncing from Toast POS...');
      return true;
    }),

    // All other mutations require authentication
    createShift: withPermission('scheduling', async (_: any, { input }: ResolverArgs, context: AuthContext) => {
      const shift = new Shift({
        ...input,
        createdBy: context.user!.userId
      });
      return await shift.save();
    }),

    updateShift: withPermission('scheduling', async (_: any, { id, input }: ResolverArgs, context: AuthContext) => {
      const shift = await Shift.findById(id);
      if (!shift) throw new Error('Shift not found');
      
      // Check permissions
      if (!context.hasRole(['Super Admin', 'Manager']) && 
          shift.assignedTo !== context.user!.userId && 
          shift.createdBy !== context.user!.userId) {
        throw new Error('Access denied');
      }
      
      return await Shift.findByIdAndUpdate(id, input, { new: true });
    }),

    deleteShift: withRole(['Super Admin', 'Manager'], async (_: any, { id }: ResolverArgs) => {
      await Shift.findByIdAndDelete(id);
      return true;
    }),

    // Inventory mutations
    createInventoryItem: withPermission('inventory', async (_: any, { input }: ResolverArgs, context: AuthContext) => {
      const inventoryItem = new InventoryItem({
        ...input,
        createdBy: context.user!.userId
      });
      return await inventoryItem.save();
    }),

    updateInventoryItem: withPermission('inventory', async (_: any, { id, input }: ResolverArgs) => {
      return await InventoryItem.findByIdAndUpdate(id, input, { new: true });
    }),

    deleteInventoryItem: withRole(['Super Admin', 'Manager'], async (_: any, { id }: ResolverArgs) => {
      await InventoryItem.findByIdAndDelete(id);
      return true;
    }),

    updateStock: withPermission('inventory', async (_: any, { id, quantity }: ResolverArgs, context: AuthContext) => {
      const item = await InventoryItem.findById(id);
      if (!item) throw new Error('Inventory item not found');
      
      if (quantity === undefined) throw new Error('Quantity is required');
      
      item.currentStock = quantity;
      item.lastUpdated = new Date();
      item.updatedBy = context.user!.userId;
      
      // Update status based on stock levels
      if (quantity <= item.minThreshold) {
        item.status = 'critical';
      } else if (quantity <= item.minThreshold * 1.5) {
        item.status = 'low';
      } else {
        item.status = 'normal';
      }
      
      return await item.save();
    }),

    // Invoicing mutations
    createInvoice: withPermission('invoicing', async (_: any, { input }: ResolverArgs, context: AuthContext) => {
      const invoice = new Invoice({
        ...input,
        issuedDate: new Date(),
        status: 'pending',
        createdBy: context.user!.userId
      });
      return await invoice.save();
    }),

    updateInvoice: withPermission('invoicing', async (_: any, { id, input }: ResolverArgs, context: AuthContext) => {
      const invoice = await Invoice.findById(id);
      if (!invoice) throw new Error('Invoice not found');
      
      // Check permissions
      if (!context.hasRole(['Super Admin', 'Manager']) && invoice.userId !== context.user!.userId) {
        throw new Error('Access denied');
      }
      
      return await Invoice.findByIdAndUpdate(id, input, { new: true });
    }),

    deleteInvoice: withRole(['Super Admin', 'Manager'], async (_: any, { id }: ResolverArgs) => {
      await Invoice.findByIdAndDelete(id);
      return true;
    }),

    markInvoicePaid: withPermission('invoicing', async (_: any, { id }: ResolverArgs, context: AuthContext) => {
      const invoice = await Invoice.findById(id);
      if (!invoice) throw new Error('Invoice not found');
      
      // Check permissions
      if (!context.hasRole(['Super Admin', 'Manager']) && invoice.userId !== context.user!.userId) {
        throw new Error('Access denied');
      }
      
      return await Invoice.findByIdAndUpdate(
        id, 
        { 
          status: 'paid',
          paidDate: new Date(),
          updatedBy: context.user!.userId
        }, 
        { new: true }
      );
    })
  },

  Subscription: {
    shiftUpdated: {
      subscribe: withAuth(() => {
        // TODO: Implement real-time subscriptions with authentication
        return null;
      })
    },
    inventoryUpdated: {
      subscribe: withPermission('inventory', () => {
        // TODO: Implement real-time subscriptions with authentication
        return null;
      })
    },
    newInvoice: {
      subscribe: withPermission('invoicing', () => {
        // TODO: Implement real-time subscriptions with authentication
        return null;
      })
    },
    teamMemberUpdated: {
      subscribe: withPermission('team', () => {
        // TODO: Implement real-time subscriptions with authentication
        return null;
      })
    }
  }
}; 