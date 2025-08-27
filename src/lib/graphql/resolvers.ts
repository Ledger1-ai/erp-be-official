import { User } from '../models/User';
import { TeamMember, ITeamMember } from '../models/TeamMember';
import { Shift } from '../models/Shift';
import { InventoryItem } from '../models/InventoryItem';
import { Invoice } from '../models/Invoice';
import { Supplier } from '../models/Supplier';
import { Analytics } from '../models/Analytics';
import ToastEmployee from '../models/ToastEmployee';
import { 
  withAuth, 
  withPermission,
  withRole,
  filterByPermissions,
  AuthContext 
} from './auth-guards';
import mongoose from 'mongoose';

// TypeScript types for resolver parameters
interface ResolverArgs {
  id?: string;
  input?: unknown;
  startDate?: string;
  endDate?: string;
  period?: string;
  quantity?: number;
}

interface TeamMemberWithPerformance {
  performance?: {
    rating?: number;
  };
  [key: string]: any;
}

export const resolvers = {
  Query: {
    // User queries
    me: withAuth(async (_: unknown, __: unknown, context: AuthContext) => {
      return await User.findById(context.user!.userId);
    }),
    
    users: withPermission('team', async () => {
      return await User.find({ isActive: true }).select('-password');
    }),

    // Team queries - Allow read access but filter data
    teamMembers: async (_: unknown, { timeWindow }: { timeWindow: string }, context: AuthContext) => {
      try {
        const members = await TeamMember.find({}).populate('performance');
        
        // In a real app, you would filter performance data based on the timeWindow
        // For now, we'll just return all data and let the frontend handle it

        if (context.isAuthenticated && context.hasPermission('team')) {
          return members.map(member => {
            // Here you would fetch and calculate historical data
            const history = [
              { date: new Date('2023-01-01'), rating: 4.2 },
              { date: new Date('2023-01-02'), rating: 4.5 },
            ];
            return {
              ...member.toObject(),
              id: member._id, // Ensure id is included
              performance: {
                ...member.performance.toObject(),
                history,
              }
            };
          });
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching team members:', error);
        return [];
      }
    },

    teamMember: async (_: unknown, { id }: ResolverArgs, context: AuthContext) => {
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
    shifts: async (_: unknown, { startDate, endDate }: ResolverArgs, context: AuthContext) => {
      try {
        const filter: { date?: { $gte: Date; $lte: Date } } = {};
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

    shift: async (_: unknown, { id }: ResolverArgs, context: AuthContext) => {
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

    inventoryItem: async (_: unknown, { id }: ResolverArgs, context: AuthContext) => {
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

    lowStockItems: async (_: unknown, __: unknown, context: AuthContext) => {
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

    // Vendor queries
    vendors: async (_: unknown, __: unknown, context: AuthContext) => {
      try {
        if (context.isAuthenticated && context.hasPermission('inventory')) {
          return await Supplier.find({}).sort({ isPreferred: -1, name: 1 });
        }
        return [];
      } catch (error) {
        console.error('Error fetching vendors:', error);
        return [];
      }
    },
    vendor: async (_: unknown, { id }: ResolverArgs, context: AuthContext) => {
      try {
        const vendor = await Supplier.findById(id);
        if (!vendor) return null;
        if (context.isAuthenticated && context.hasPermission('inventory')) {
          return vendor;
        }
        return null;
      } catch (error) {
        console.error('Error fetching vendor:', error);
        return null;
      }
    },

    // Invoicing queries
    invoices: async (_: unknown, __: unknown, context: AuthContext) => {
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

    invoice: async (_: unknown, { id }: ResolverArgs, context: AuthContext) => {
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
    analytics: async (_: unknown, { period }: ResolverArgs, context: AuthContext) => {
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

    revenueAnalytics: async (_: unknown, { startDate, endDate }: ResolverArgs, context: AuthContext) => {
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
    },

    // Roster queries
    rosterConfigurations: async () => {
      const RosterConfiguration = (await import('@/lib/models/RosterConfiguration')).default;
      return RosterConfiguration.find({}).sort({ isActive: -1, updatedAt: -1 });
    },
    rosterConfiguration: async (_: unknown, { name }: { name: string }) => {
      const RosterConfiguration = (await import('@/lib/models/RosterConfiguration')).default;
      return RosterConfiguration.findOne({ name });
    },
    activeRosterConfiguration: async () => {
      const RosterConfiguration = (await import('@/lib/models/RosterConfiguration')).default;
      return RosterConfiguration.findOne({ isActive: true });
    },
    roleMappings: withPermission('roster', async () => {
      const RoleMapping = (await import('@/lib/models/RoleMapping')).default;
      return RoleMapping.find({});
    }),
    savedRosters: withPermission('roster', async (_: unknown, { startDate, endDate }: { startDate: Date, endDate: Date }) => {
      const SavedRoster = (await import('@/lib/models/SavedRoster')).default;
      return SavedRoster.find({ rosterDate: { $gte: startDate, $lte: endDate } }).sort({ rosterDate: -1, shift: 1 });
    }),
    savedRoster: withPermission('roster', async (_: unknown, { id }: { id: string }) => {
      const SavedRoster = (await import('@/lib/models/SavedRoster')).default;
      return SavedRoster.findById(id);
    }),
    rosterCandidates: async (_: unknown, { includeToastOnly = false, onlySevenShiftsActive = true }: { includeToastOnly?: boolean; onlySevenShiftsActive?: boolean }) => {
      try {
        console.log('Fetching roster candidates...');
        
        // 1. Fetch all active Toast employees efficiently
        const toastEmployees = await ToastEmployee.find({ 
          isLocallyDeleted: { $ne: true } 
        }).lean();
        console.log(`Found ${toastEmployees.length} active Toast employees.`);

        // 2. Collect all emails to fetch linked TeamMembers in one query
        const emails = toastEmployees
          .map(emp => emp.email)
          .filter((email): email is string => !!email);
          
        const linkedTeamMembers = await TeamMember.find({ 
          email: { $in: emails } 
        }).populate('performance').lean();
        
        // 3. Create a lookup map for efficient access
        const teamMemberMap = new Map(
          linkedTeamMembers.map(tm => [tm.email, tm])
        );

        // 4. Map the results in memory
        const candidates = toastEmployees.map(emp => {
          console.log('Processing employee:', emp.firstName, emp.lastName, 'Job Titles:', emp.jobTitles);
          const name = `${emp.firstName} ${emp.lastName}`.trim();
          const sevenShiftsEnrolled = typeof emp.sevenShiftsId === 'number' && !Number.isNaN(emp.sevenShiftsId);
          const toastEnrolled = emp.isActive === true;
          
          let rating = 0;
          const linkedTeamMember = emp.email ? teamMemberMap.get(emp.email) : undefined;
          if (linkedTeamMember && linkedTeamMember.performance) {
            rating = (linkedTeamMember.performance as any).rating || 0;
          }

          return {
            id: emp.toastGuid,
            name,
            email: emp.email || '',
            role: Array.isArray(emp.jobTitles) && emp.jobTitles.length ? emp.jobTitles[0].title : 'N/A',
            roles: Array.isArray(emp.jobTitles) ? emp.jobTitles.map(j => j.title) : [],
            department: linkedTeamMember?.department || '',
            toastEnrolled,
            sevenShiftsEnrolled,
            rating,
          };
        });
        
        let filtered = candidates;
        if (onlySevenShiftsActive) {
          filtered = filtered.filter(c => c.sevenShiftsEnrolled);
        } else if (!includeToastOnly) {
          filtered = filtered.filter(c => c.sevenShiftsEnrolled || c.toastEnrolled);
        }
        
        console.log(`Returning ${filtered.length} roster candidates.`);
        return filtered;
      } catch (e) {
        console.error('rosterCandidates resolver error:', e);
        return [];
      }
    }
  },
  
  Mutation: {
    // User mutations
    createUser: withRole(['Super Admin'], async (_: unknown, { input }: ResolverArgs) => {
      // Don't allow password in input - it should be set separately
      const { password, ...userData } = input as { password?: string; email: string };
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      const user = new User(userData);
      return await user.save();
    }),

    updateUser: withAuth(async (_: unknown, { id, input }: ResolverArgs, context: AuthContext) => {
      // Users can update their own profile, admins can update any user
      if (id !== context.user!.userId && !context.hasRole(['Super Admin', 'Manager'])) {
        throw new Error('Access denied');
      }
      
      const updateInput = input as { role?: string; permissions?: string[]; isActive?: boolean };
      // Don't allow updating sensitive fields unless admin
      if (!context.hasRole(['Super Admin'])) {
        delete updateInput.role;
        delete updateInput.permissions;
        delete updateInput.isActive;
      }
      
      return await User.findByIdAndUpdate(id, updateInput, { new: true }).select('-password');
    }),

    deleteUser: withRole(['Super Admin'], async (_: unknown, { id }: ResolverArgs, context: AuthContext) => {
      // Don't allow deleting yourself
      if (id === context.user!.userId) {
        throw new Error('Cannot delete your own account');
      }
      
      await User.findByIdAndUpdate(id, { isActive: false });
      return true;
    }),

    // Team mutations
    createTeamMember: withPermission('team', async (_: unknown, { input }: ResolverArgs, context: AuthContext) => {
      const teamMemberData = {
        ...input as object,
        createdBy: context.user!.userId,
        department: (input as any).department || 'Support', // Ensure department has a default
      };
      const teamMember = new TeamMember(teamMemberData);
      return await teamMember.save();
    }),

    updateTeamMember: withPermission('team', async (_: unknown, { id, input }: ResolverArgs, context: AuthContext) => {
      const member = await TeamMember.findById(id);
      if (!member) throw new Error('Team member not found');
      
      // Check permissions
      if (!context.hasRole(['Super Admin', 'Manager']) && member.userId !== context.user!.userId) {
        throw new Error('Access denied');
      }
      
      return await TeamMember.findByIdAndUpdate(id, input as any, { new: true });
    }),

    deleteTeamMember: withRole(['Super Admin', 'Manager'], async (_: unknown, { id }: ResolverArgs) => {
      await TeamMember.findByIdAndDelete(id);
      return true;
    }),

    syncFromToast: withRole(['Super Admin', 'Manager'], async () => {
      // TODO: Implement Toast POS integration
      console.log('Syncing from Toast POS...');
      return true;
    }),

    // All other mutations require authentication
    createShift: withPermission('scheduling', async (_: unknown, { input }: ResolverArgs, context: AuthContext) => {
      const shift = new Shift({
        ...input as object,
        createdBy: context.user!.userId
      });
      return await shift.save();
    }),

    updateShift: withPermission('scheduling', async (_: unknown, { id, input }: ResolverArgs, context: AuthContext) => {
      const shift = await Shift.findById(id);
      if (!shift) throw new Error('Shift not found');
      
      // Check permissions
      if (!context.hasRole(['Super Admin', 'Manager']) && 
          shift.assignedTo !== context.user!.userId && 
          shift.createdBy !== context.user!.userId) {
        throw new Error('Access denied');
      }
      
      return await Shift.findByIdAndUpdate(id, input as any, { new: true });
    }),

    deleteShift: withRole(['Super Admin', 'Manager'], async (_: unknown, { id }: ResolverArgs) => {
      await Shift.findByIdAndDelete(id);
      return true;
    }),

    // Inventory mutations
    createInventoryItem: withPermission('inventory', async (_: unknown, { input }: ResolverArgs, context: AuthContext) => {
      const body = { ...(input as Record<string, any>) };
      const initialStock = Number(body.currentStock ?? 0);
      const minThreshold = Number(body.minThreshold ?? 0);
      if (initialStock <= 0) {
        body.status = 'out_of_stock';
      } else if (initialStock <= minThreshold) {
        body.status = 'critical';
      } else if (initialStock <= minThreshold * 1.5) {
        body.status = 'low';
      } else {
        body.status = 'normal';
      }
      const inventoryItem = new InventoryItem({
        ...body,
        createdBy: context.user!.userId
      });
      const saved = await inventoryItem.save();
      // Auto-assign QR code to the item's ID if not provided
      if (!saved.qrCode) {
        saved.qrCode = saved._id.toString();
        await saved.save();
      }
      return saved;
    }),

    updateInventoryItem: withPermission('inventory', async (_: unknown, { id, input }: ResolverArgs) => {
      try {
        const existing = await InventoryItem.findById(id);
        if (!existing) throw new Error('Inventory item not found');
        const payload = { ...(input as Record<string, any>) };
        // Sanitize unique/sparse fields to avoid duplicate empty strings
        if (typeof payload.barcode === 'string' && !payload.barcode.trim()) {
          delete payload.barcode;
        }
        if (typeof payload.qrCode === 'string' && !payload.qrCode.trim()) {
          delete payload.qrCode;
        }
        const affectsStatus = Object.prototype.hasOwnProperty.call(payload, 'currentStock') || Object.prototype.hasOwnProperty.call(payload, 'minThreshold');
        if (affectsStatus) {
          const nextStock = Number(Object.prototype.hasOwnProperty.call(payload, 'currentStock') ? payload.currentStock : existing.currentStock);
          const nextMin = Number(Object.prototype.hasOwnProperty.call(payload, 'minThreshold') ? payload.minThreshold : existing.minThreshold);
          if (nextStock <= 0) {
            payload.status = 'out_of_stock';
          } else if (nextStock <= nextMin) {
            payload.status = 'critical';
          } else if (nextStock <= nextMin * 1.5) {
            payload.status = 'low';
          } else {
            payload.status = 'normal';
          }
        }
        return await InventoryItem.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
      } catch (e: any) {
        if (e && (e.code === 11000 || e.name === 'MongoServerError')) {
          const field = e?.keyPattern ? Object.keys(e.keyPattern)[0] : 'field';
          const value = e?.keyValue ? Object.values(e.keyValue)[0] : '';
          throw new Error(`Duplicate value for ${field}${value ? `: ${value}` : ''}`);
        }
        throw e;
      }
    }),

    deleteInventoryItem: withRole(['Super Admin', 'Manager'], async (_: unknown, { id }: ResolverArgs) => {
      await InventoryItem.findByIdAndDelete(id);
      return true;
    }),

    updateStock: withPermission('inventory', async (_: unknown, { id, quantity }: ResolverArgs, context: AuthContext) => {
      const item = await InventoryItem.findById(id);
      if (!item) throw new Error('Inventory item not found');
      
      if (quantity === undefined) throw new Error('Quantity is required');
      
      item.currentStock = quantity;
      item.lastUpdated = new Date();
      item.updatedBy = context.user!.userId;
      
      // Update status based on stock levels
      if (quantity <= 0) {
        item.status = 'out_of_stock';
      } else if (quantity <= item.minThreshold) {
        item.status = 'critical';
      } else if (quantity <= item.minThreshold * 1.5) {
        item.status = 'low';
      } else {
        item.status = 'normal';
      }
      
      return await item.save();
    }),

    recordWaste: withPermission('inventory', async (_: unknown, { itemId, quantity, reason, notes }: { itemId: string; quantity: number; reason: string; notes?: string }, context: AuthContext) => {
      const item = await InventoryItem.findById(itemId);
      if (!item) throw new Error('Inventory item not found');

      if (!item.wasteLogs) {
        item.wasteLogs = [];
      }

      const newWasteLog = {
        _id: new mongoose.Types.ObjectId(),
        date: new Date(),
        quantity,
        reason,
        notes,
        recordedBy: context.user!.userId,
      };

      item.wasteLogs.push(newWasteLog);

      item.currentStock -= quantity;
      if (item.currentStock <= 0) {
        item.currentStock = 0;
        item.status = 'out_of_stock';
      } else if (item.currentStock <= item.minThreshold) {
        item.status = 'critical';
      } else if (item.currentStock <= item.minThreshold * 1.5) {
        item.status = 'low';
      } else {
        item.status = 'normal';
      }
      
      item.markModified('wasteLogs');
      return await item.save();
    }),

    // Vendor mutations
    createVendor: withPermission('inventory', async (_: unknown, { input }: ResolverArgs, context: AuthContext) => {
      const vendor = new Supplier({
        ...(input as object),
        createdBy: context.user!.userId
      });
      return await vendor.save();
    }),
    updateVendor: withPermission('inventory', async (_: unknown, { id, input }: ResolverArgs) => {
      return await Supplier.findByIdAndUpdate(id, input as any, { new: true });
    }),
    deleteVendor: withRole(['Super Admin', 'Manager'], async (_: unknown, { id }: ResolverArgs) => {
      await Supplier.findByIdAndDelete(id);
      return true;
    }),

    updateVendorRepresentative: withPermission('inventory', async (_: unknown, { id, input }: any, context: AuthContext) => {
      const vendor = await Supplier.findById(id);
      if (!vendor) throw new Error('Vendor not found');

      const now = new Date();
      // Close out existing representative into history if present
      if (vendor.currentRepresentative && Object.keys(vendor.currentRepresentative.toObject ? vendor.currentRepresentative.toObject() : vendor.currentRepresentative).length) {
        vendor.representativeHistory = vendor.representativeHistory || [];
        vendor.representativeHistory.push({
          representative: vendor.currentRepresentative,
          fromDate: vendor.currentRepresentative.startDate || undefined,
          toDate: now,
          reason: input.reason,
          changedBy: context.user?.userId,
          changedAt: now,
        });
      }

      // Set new current representative
      vendor.currentRepresentative = {
        ...input.representative
      };

      await vendor.save();
      return vendor;
    }),

    // Invoicing mutations
    createInvoice: withPermission('invoicing', async (_: unknown, { input }: ResolverArgs, context: AuthContext) => {
      const invoice = new Invoice({
        ...input as object,
        issuedDate: new Date(),
        status: 'pending',
        createdBy: context.user!.userId
      });
      return await invoice.save();
    }),

    updateInvoice: withPermission('invoicing', async (_: unknown, { id, input }: ResolverArgs, context: AuthContext) => {
      const invoice = await Invoice.findById(id);
      if (!invoice) throw new Error('Invoice not found');
      
      // Check permissions
      if (!context.hasRole(['Super Admin', 'Manager']) && invoice.userId !== context.user!.userId) {
        throw new Error('Access denied');
      }
      
      return await Invoice.findByIdAndUpdate(id, input as any, { new: true });
    }),

    deleteInvoice: withRole(['Super Admin', 'Manager'], async (_: unknown, { id }: ResolverArgs) => {
      await Invoice.findByIdAndDelete(id);
      return true;
    }),

    markInvoicePaid: withPermission('invoicing', async (_: unknown, { id }: ResolverArgs, context: AuthContext) => {
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
    }),

    // Roster mutations
    createRosterConfiguration: withRole(['Super Admin', 'Manager'], async (_: unknown, { input }: any) => {
      const RosterConfiguration = (await import('@/lib/models/RosterConfiguration')).default;
      const created = await RosterConfiguration.create({
        name: input.name,
        description: input.description,
        nodes: input.nodes || [],
        isActive: false,
      });
      return created;
    }),
    updateRosterConfiguration: withRole(['Super Admin', 'Manager'], async (_: unknown, { id, input }: any) => {
      const RosterConfiguration = (await import('@/lib/models/RosterConfiguration')).default;
      const updated = await RosterConfiguration.findByIdAndUpdate(
        id,
        {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.nodes !== undefined ? { nodes: input.nodes } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        { new: true }
      );
      return updated;
    }),
    deleteRosterConfiguration: withRole(['Super Admin', 'Manager'], async (_: unknown, { id }: any) => {
      const RosterConfiguration = (await import('@/lib/models/RosterConfiguration')).default;
      await RosterConfiguration.findByIdAndDelete(id);
      return true;
    }),
    setActiveRosterConfiguration: withRole(['Super Admin', 'Manager'], async (_: unknown, { id }: any) => {
      const RosterConfiguration = (await import('@/lib/models/RosterConfiguration')).default;
      await RosterConfiguration.updateMany({}, { $set: { isActive: false } });
      const updated = await RosterConfiguration.findByIdAndUpdate(id, { isActive: true }, { new: true });
      return updated;
    }),

    updateRoleMapping: withPermission('roster', async (_: unknown, { id, input }: any) => {
      const RoleMapping = (await import('@/lib/models/RoleMapping')).default;
      return RoleMapping.findByIdAndUpdate(id, input, { new: true });
    }),
    
    // Saved Roster Mutations
    saveRoster: withPermission('roster', async (_: unknown, { input }: any) => {
      const SavedRoster = (await import('@/lib/models/SavedRoster')).default;
      const newRoster = new SavedRoster(input);
      await newRoster.save();
      return newRoster;
    }),
    updateSavedRoster: withPermission('roster', async (_: unknown, { id, input }: any) => {
      const SavedRoster = (await import('@/lib/models/SavedRoster')).default;
      return SavedRoster.findByIdAndUpdate(id, input, { new: true });
    }),
    deleteSavedRoster: withPermission('roster', async (_: unknown, { id }: any) => {
      const SavedRoster = (await import('@/lib/models/SavedRoster')).default;
      await SavedRoster.findByIdAndDelete(id);
      return true;
    }),
  },

  WasteLog: {
    id: (wasteLog: { _id: { toString: () => any; }; }) => wasteLog._id.toString(),
    recordedBy: async (wasteLog: { recordedBy: any; }) => {
      if (!wasteLog.recordedBy) return null;
      return await User.findById(wasteLog.recordedBy);
    }
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