import { User } from '../models/User';
import { TeamMember } from '../models/TeamMember';
import { Shift } from '../models/Shift';
import { InventoryItem } from '../models/InventoryItem';
import { Invoice } from '../models/Invoice';
import { Analytics } from '../models/Analytics';

// TypeScript types for resolver parameters
interface Context {
  user: any;
  req: any;
}

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
    me: async (_: any, __: any, { user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      return await User.findById(user.id);
    },
    
    users: async () => {
      return await User.find({});
    },

    // Team queries
    teamMembers: async () => {
      return await TeamMember.find({}).populate('performance');
    },

    teamMember: async (_: any, { id }: ResolverArgs) => {
      return await TeamMember.findById(id).populate('performance');
    },

    // Scheduling queries
    shifts: async (_: any, { startDate, endDate }: ResolverArgs) => {
      const filter: any = {};
      if (startDate && endDate) {
        filter.date = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }
      return await Shift.find(filter).populate('teamMember');
    },

    shift: async (_: any, { id }: ResolverArgs) => {
      return await Shift.findById(id).populate('teamMember');
    },

    // Inventory queries
    inventoryItems: async () => {
      return await InventoryItem.find({});
    },

    inventoryItem: async (_: any, { id }: ResolverArgs) => {
      return await InventoryItem.findById(id);
    },

    lowStockItems: async () => {
      return await InventoryItem.find({
        $expr: { $lte: ['$currentStock', '$minThreshold'] }
      });
    },

    // Invoicing queries
    invoices: async () => {
      return await Invoice.find({});
    },

    invoice: async (_: any, { id }: ResolverArgs) => {
      return await Invoice.findById(id);
    },

    // Analytics queries
    analytics: async (_: any, { period }: ResolverArgs) => {
      const analytics = await Analytics.findOne({ period });
      if (!analytics) {
        // Return default analytics if none found
        return {
          revenue: 0,
          orders: 0,
          avgOrderValue: 0,
          customerSatisfaction: 0,
          tableTurnover: 0
        };
      }
      return analytics;
    },

    revenueAnalytics: async (_: any, { startDate, endDate }: ResolverArgs) => {
      return await Analytics.find({
        date: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        }
      }).sort({ date: 1 });
    }
  },

  Mutation: {
    // User mutations
    createUser: async (_: any, { input }: ResolverArgs) => {
      const user = new User(input);
      return await user.save();
    },

    updateUser: async (_: any, { id, input }: ResolverArgs) => {
      return await User.findByIdAndUpdate(id, input, { new: true });
    },

    deleteUser: async (_: any, { id }: ResolverArgs) => {
      await User.findByIdAndDelete(id);
      return true;
    },

    // Team mutations
    createTeamMember: async (_: any, { input }: ResolverArgs) => {
      const teamMember = new TeamMember(input);
      return await teamMember.save();
    },

    updateTeamMember: async (_: any, { id, input }: ResolverArgs) => {
      return await TeamMember.findByIdAndUpdate(id, input, { new: true });
    },

    deleteTeamMember: async (_: any, { id }: ResolverArgs) => {
      await TeamMember.findByIdAndDelete(id);
      return true;
    },

    syncFromToast: async () => {
      // TODO: Implement Toast POS integration
      console.log('Syncing from Toast POS...');
      return true;
    },

    // Scheduling mutations
    createShift: async (_: any, { input }: ResolverArgs) => {
      const shift = new Shift(input);
      return await shift.save();
    },

    updateShift: async (_: any, { id, input }: ResolverArgs) => {
      return await Shift.findByIdAndUpdate(id, input, { new: true });
    },

    deleteShift: async (_: any, { id }: ResolverArgs) => {
      await Shift.findByIdAndDelete(id);
      return true;
    },

    // Inventory mutations
    createInventoryItem: async (_: any, { input }: ResolverArgs) => {
      const inventoryItem = new InventoryItem(input);
      return await inventoryItem.save();
    },

    updateInventoryItem: async (_: any, { id, input }: ResolverArgs) => {
      return await InventoryItem.findByIdAndUpdate(id, input, { new: true });
    },

    deleteInventoryItem: async (_: any, { id }: ResolverArgs) => {
      await InventoryItem.findByIdAndDelete(id);
      return true;
    },

    updateStock: async (_: any, { id, quantity }: ResolverArgs) => {
      const item = await InventoryItem.findById(id);
      if (!item) throw new Error('Inventory item not found');
      
      if (quantity === undefined) throw new Error('Quantity is required');
      
      item.currentStock = quantity;
      item.lastUpdated = new Date();
      
      // Update status based on stock levels
      if (quantity <= item.minThreshold) {
        item.status = 'critical';
      } else if (quantity <= item.minThreshold * 1.5) {
        item.status = 'low';
      } else {
        item.status = 'normal';
      }
      
      return await item.save();
    },

    // Invoicing mutations
    createInvoice: async (_: any, { input }: ResolverArgs) => {
      const invoice = new Invoice({
        ...input,
        issuedDate: new Date(),
        status: 'pending'
      });
      return await invoice.save();
    },

    updateInvoice: async (_: any, { id, input }: ResolverArgs) => {
      return await Invoice.findByIdAndUpdate(id, input, { new: true });
    },

    deleteInvoice: async (_: any, { id }: ResolverArgs) => {
      await Invoice.findByIdAndDelete(id);
      return true;
    },

    markInvoicePaid: async (_: any, { id }: ResolverArgs) => {
      return await Invoice.findByIdAndUpdate(
        id, 
        { status: 'paid' }, 
        { new: true }
      );
    }
  },

  Subscription: {
    shiftUpdated: {
      subscribe: () => {
        // TODO: Implement real-time subscriptions
        return null;
      }
    },
    inventoryUpdated: {
      subscribe: () => {
        // TODO: Implement real-time subscriptions
        return null;
      }
    },
    newInvoice: {
      subscribe: () => {
        // TODO: Implement real-time subscriptions
        return null;
      }
    },
    teamMemberUpdated: {
      subscribe: () => {
        // TODO: Implement real-time subscriptions
        return null;
      }
    }
  }
}; 