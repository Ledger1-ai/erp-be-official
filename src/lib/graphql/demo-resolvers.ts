// Minimal demo resolvers that short-circuit live data sources

function computeStatus(currentStock?: number, minThreshold?: number): string {
  const stock = typeof currentStock === 'number' ? currentStock : 0;
  const min = typeof minThreshold === 'number' ? minThreshold : 10;
  if (stock <= 0) return 'out_of_stock';
  if (stock <= min) return 'critical';
  if (stock <= min * 1.5) return 'low';
  return 'normal';
}

function toYMD(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function daysBetween(start?: string | Date, end?: string | Date, fallbackDays = 7): Date[] {
  const now = new Date();
  const s = start ? new Date(start) : new Date(now.getTime() - (fallbackDays - 1) * 86400000);
  const e = end ? new Date(end) : now;
  const out: Date[] = [];
  const cur = new Date(s);
  while (cur <= e) { out.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return out;
}

export const demoResolvers = {
  Query: {
    me: async () => ({
      id: '507f1f77bcf86cd799439011',
      name: 'Richard L.',
      email: 'admin@ledgerone.demo',
      role: 'Super Admin',
      avatar: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),

    users: async () => ([
      { id: '507f1f77bcf86cd799439011', name: 'Richard L.', email: 'admin@ledgerone.demo', role: 'Super Admin', avatar: '', createdAt: new Date(), updatedAt: new Date() },
      { id: '507f1f77bcf86cd799439012', name: 'Demo Manager', email: 'manager@ledgerone.demo', role: 'Manager', avatar: '', createdAt: new Date(), updatedAt: new Date() },
    ]),

    teamMembers: async () => ([
      {
        id: 'tm1',
        name: 'Sarah Johnson',
        email: 'sarah@ledgerone.demo',
        phone: '(555) 123-4567',
        role: 'Head Chef',
        department: 'Kitchen',
        status: 'active',
        joinDate: new Date('2024-06-01'),
        hourlyRate: 28.5,
        availability: 'Full-time',
        skills: ['Kitchen Management', 'Inventory', 'Training'],
        performance: {
          rating: 4.8,
          completedShifts: 156,
          onTimeRate: 98,
          customerRating: 4.7,
          salesGenerated: 125000,
          history: [
            { date: new Date('2024-12-28'), rating: 4.7 },
            { date: new Date('2025-01-04'), rating: 4.9 },
          ],
        },
        toastId: 'TOAST_EMP_001',
      },
      {
        id: 'tm2',
        name: 'Emma Davis',
        email: 'emma@ledgerone.demo',
        phone: '(555) 345-6789',
        role: 'Server',
        department: 'Front of House',
        status: 'active',
        joinDate: new Date('2024-09-10'),
        hourlyRate: 18.5,
        availability: 'Part-time',
        skills: ['Customer Service', 'POS Systems', 'Wine Knowledge'],
        performance: {
          rating: 4.6,
          completedShifts: 128,
          onTimeRate: 97,
          customerRating: 4.9,
          salesGenerated: 78000,
          history: [
            { date: new Date('2024-12-28'), rating: 4.5 },
            { date: new Date('2025-01-04'), rating: 4.7 },
          ],
        },
        toastId: 'TOAST_EMP_003',
      },
    ]),

    shifts: async () => ([
      { id: 's1', date: new Date(), startTime: '14:00', endTime: '22:00', role: 'Head Chef', assignedTo: 'tm1', status: 'scheduled', notes: null, actualStartTime: null, actualEndTime: null, breakTime: 30, teamMember: null },
      { id: 's2', date: new Date(), startTime: '17:00', endTime: '00:00', role: 'Server', assignedTo: 'tm2', status: 'scheduled', notes: null, actualStartTime: null, actualEndTime: null, breakTime: 15, teamMember: null },
    ]),

    inventoryItems: async () => ([
      { id: 'i1', name: 'Chicken Breast', category: 'Proteins', currentStock: 25, minThreshold: 30, parLevel: 40, maxCapacity: 100, unit: 'lbs', costPerUnit: 3.50, supplier: 'Fresh Foods Co.', lastUpdated: new Date(), status: 'low', location: 'Freezer A', barcode: null, qrCode: null, description: 'Boneless, skinless', expiryDate: null, waste: 0, reorderPoint: 30, reorderQuantity: 40, syscoSKU: 'SYS-1001', vendorSKU: 'VEND-1001', casePackSize: 20, vendorCode: 'FFC', syscoCategory: 'Meat', leadTimeDays: 2, minimumOrderQty: 1, minimumOrderUnit: 'case', pricePerCase: 70, lastOrderDate: null, preferredVendor: 'Fresh Foods Co.', alternateVendors: [], averageDailyUsage: 6, seasonalItem: false, notes: '', brand: 'Premium', wasteLogs: [], restockPeriod: 'weekly', restockDays: 7 },
      { id: 'i2', name: 'Organic Tomatoes', category: 'Vegetables', currentStock: 15, minThreshold: 20, parLevel: 30, maxCapacity: 60, unit: 'lbs', costPerUnit: 2.25, supplier: 'Local Farm Market', lastUpdated: new Date(), status: 'low', location: 'Produce', barcode: null, qrCode: null, description: 'Vine-ripened', expiryDate: null, waste: 0, reorderPoint: 20, reorderQuantity: 30, syscoSKU: 'SYS-2001', vendorSKU: 'VEND-2001', casePackSize: 10, vendorCode: 'LFM', syscoCategory: 'Produce', leadTimeDays: 1, minimumOrderQty: 1, minimumOrderUnit: 'case', pricePerCase: 25, lastOrderDate: null, preferredVendor: 'Local Farm Market', alternateVendors: [], averageDailyUsage: 5, seasonalItem: false, notes: '', brand: 'Heirloom', wasteLogs: [], restockPeriod: 'weekly', restockDays: 7 },
    ]),

    invoices: async () => ([
      { id: 'inv1', invoiceNumber: 'INV-2025-0001', clientName: 'Corporate Event Group', clientEmail: 'events@corp.demo', clientPhone: '+1-555-1000', amount: 2500, tax: 200, totalAmount: 2700, dueDate: new Date('2025-02-15'), status: 'pending', issuedDate: new Date('2025-01-18'), paidDate: null, description: 'Catering services for annual meeting', paymentMethod: 'credit_card', notes: '', terms: 'Net 30' },
      { id: 'inv2', invoiceNumber: 'INV-2025-0002', clientName: 'Local Business Association', clientEmail: 'admin@lba.demo', clientPhone: '+1-555-2000', amount: 1800, tax: 144, totalAmount: 1944, dueDate: new Date('2025-02-10'), status: 'paid', issuedDate: new Date('2025-01-15'), paidDate: new Date('2025-01-20'), description: 'Lunch catering for networking event', paymentMethod: 'bank_transfer', notes: '', terms: 'Due on receipt' },
    ]),

    analytics: async (_: any, { period }: { period: string }) => ({
      revenue: period === 'daily' ? 6842 : period === 'weekly' ? 45680 : 195340,
      orders: period === 'daily' ? 142 : period === 'weekly' ? 892 : 3810,
      avgOrderValue: period === 'daily' ? 48.18 : 51.21,
      customerSatisfaction: 4.6,
      tableTurnover: 3.1,
      totalCustomers: period === 'daily' ? 156 : period === 'weekly' ? 1023 : 3210,
      repeatCustomers: period === 'daily' ? 89 : period === 'weekly' ? 567 : 1280,
      averageWaitTime: 12,
      staffUtilization: 84,
      inventoryValue: 12500,
      wastePercentage: 3.2,
      period,
      date: new Date(),
    }),

    revenueAnalytics: async (_: any, { startDate, endDate }: { startDate: string; endDate: string }) => {
      const days = daysBetween(startDate, endDate, 7);
      return days.map((d, i) => ({
        revenue: 5000 + i * 250,
        orders: 100 + i * 5,
        avgOrderValue: 50 + (i % 3),
        customerSatisfaction: 4.5,
        tableTurnover: 3.0,
        totalCustomers: 120 + i * 6,
        repeatCustomers: 50 + i * 4,
        averageWaitTime: 12 - (i % 2),
        staffUtilization: 80 + (i % 4),
        inventoryValue: 12000 - i * 100,
        wastePercentage: 3 + (i % 2) * 0.2,
        period: 'daily',
        date: d,
      }));
    },

    // Add stubs for non-nullable queries
    recipeProfitabilityReport: async () => ([
      { recipeId: 'r1', name: 'Margherita Pizza', foodCost: 4.2, menuPrice: 12, foodCostPct: 35, grossMargin: 7.8, isPopular: true },
      { recipeId: 'r2', name: 'Caesar Salad', foodCost: 2.0, menuPrice: 9, foodCostPct: 22, grossMargin: 7.0, isPopular: false },
    ]),

    menuMappings: async () => ([]),

    purchaseOrders: async () => ([]),

    lowStockItems: async () => ([]),

    vendors: async () => ([
      {
        id: 'v1',
        name: 'Fresh Foods Co.',
        companyName: 'Fresh Foods Co.',
        supplierCode: 'FFC-001',
        type: 'Primary',
        categories: ['Proteins','Vegetables'],
        status: 'Active',
        contacts: [{ name: 'Lena Park', title: 'Account Rep', email: 'lena@ffc.demo', phone: '+1-555-1111', isPrimary: true }],
        address: { street: '100 Market St', city: 'Denver', state: 'CO', zipCode: '80202', country: 'US' },
        paymentTerms: { terms: 'Net 30', creditLimit: 5000, currentBalance: 0, currency: 'USD' },
        deliveryInfo: { deliveryDays: ['Monday','Thursday'], deliveryWindow: '8 AM - 12 PM', minimumOrder: 100, deliveryFee: 0, freeDeliveryThreshold: 500, leadTimeDays: 2 },
        performanceMetrics: { totalOrders: 24, totalSpent: 12000, averageOrderValue: 500, onTimeDeliveryRate: 98, qualityRating: 4.7, responseTime: 4 },
        certifications: ['HACCP'],
        documents: [],
        currentRepresentative: { name: 'Lena Park', title: 'Account Rep', email: 'lena@ffc.demo', phone: '+1-555-1111' },
        representativeHistory: [],
        notes: 'Primary protein supplier',
        isPreferred: true,
      },
    ]),

    inventoryMovement: async (_: any, { period, startDate, endDate }: any) => {
      const days = daysBetween(startDate, endDate, 7);
      return days.map((d, i) => ({
        date: toYMD(d),
        dateKey: toYMD(d),
        received: 80 + (i % 3) * 20,
        usage: 90 + (i % 4) * 10,
        adjustments: (i % 2 === 0 ? -2 : 0),
        totalValue: 8500 + i * 20,
        netMovement: 80 + (i % 3) * 20 - (90 + (i % 4) * 10),
        transactionCount: 15 + i,
        itemsCount: 10 + (i % 5),
      }));
    },

    wasteReport: async (_: any, { startDate, endDate }: any) => {
      return {
        byReason: [
          { reason: 'Spoilage', quantity: 8, cost: 24 },
          { reason: 'Prep Error', quantity: 3, cost: 9 },
        ],
        byItem: [
          { itemId: 'i2', name: 'Organic Tomatoes', quantity: 5, cost: 11.25 },
          { itemId: 'i3', name: 'Heavy Cream', quantity: 2, cost: 9.5 },
        ],
        totalQuantity: 11,
        totalCost: 33.5,
      };
    },

    aiInsights: async () => ([]),

    menuItemStock: async (_: any, { restaurantGuid, guids, multiLocationIds }: any) => {
      const ids = Array.isArray(guids) && guids.length ? guids : ['item-1', 'item-2', 'item-3'];
      return ids.map((g: string, idx: number) => ({
        guid: g,
        multiLocationId: (Array.isArray(multiLocationIds) && multiLocationIds[0]) || 'loc-1',
        status: idx % 2 === 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
        quantity: idx % 2 === 0 ? 10 : 0,
        versionId: 'v1'
      }));
    },

    // Indexed menus for demo (independent of DB)
    indexedMenus: async (_: any, { restaurantGuid }: { restaurantGuid: string }) => ({
      restaurantGuid,
      lastUpdated: new Date().toISOString(),
      menus: [
        {
          guid: 'm-1', name: 'Demo Menu', description: 'Main',
          menuGroups: [
            {
              guid: 'g-1', name: 'Pizzas', description: 'Wood-fired pizzas',
              menuItems: [
                { guid: 'item-1', name: 'Margherita Pizza', description: 'Tomato, mozzarella, basil', price: 12, pricingStrategy: 'base', taxInclusion: 'exclusive', modifierGroupReferences: [101] },
                { guid: 'item-2', name: 'Pepperoni Pizza', description: 'Tomato, mozzarella, pepperoni', price: 14, pricingStrategy: 'base', taxInclusion: 'exclusive', modifierGroupReferences: [101] },
              ],
              menuGroups: []
            },
            {
              guid: 'g-2', name: 'Salads', description: 'Fresh salads',
              menuItems: [
                { guid: 'item-3', name: 'Caesar Salad', description: 'Romaine, parmesan, croutons', price: 9, pricingStrategy: 'base', taxInclusion: 'exclusive', modifierGroupReferences: [] },
              ],
              menuGroups: []
            }
          ]
        }
      ],
      modifierGroupReferences: [
        { referenceId: 101, guid: 'mg-101', name: 'Extras', pricingStrategy: 'add', modifierOptionReferences: [201, 202] }
      ],
      modifierOptionReferences: [
        { referenceId: 201, guid: 'mo-201', name: 'Extra Cheese', price: 2, pricingStrategy: 'add' },
        { referenceId: 202, guid: 'mo-202', name: 'Gluten Free Crust', price: 3, pricingStrategy: 'add' },
      ]
    }),

    // Provide minimal mappings so menu details panels have data
    menuMappings: async (_: any, { restaurantGuid, toastItemGuid }: { restaurantGuid: string; toastItemGuid?: string }) => {
      const all = [
        { id: 'mm-1', restaurantGuid, toastItemGuid: 'item-1', toastItemName: 'Margherita Pizza', toastItemSku: 'SKU-ITEM-1', components: [{ kind: 'inventory', inventoryItem: null, quantity: 0.2, unit: 'lbs' }], recipeSteps: [{ step: 1, instruction: 'Prep dough' }, { step: 2, instruction: 'Bake' }], recipeMeta: { servings: 1, difficulty: 'Easy' } },
        { id: 'mm-2', restaurantGuid, toastItemGuid: 'item-2', toastItemName: 'Pepperoni Pizza', toastItemSku: 'SKU-ITEM-2', components: [{ kind: 'inventory', inventoryItem: null, quantity: 0.2, unit: 'lbs' }], recipeSteps: [{ step: 1, instruction: 'Prep dough' }, { step: 2, instruction: 'Bake' }], recipeMeta: { servings: 1, difficulty: 'Easy' } },
        { id: 'mm-3', restaurantGuid, toastItemGuid: 'item-3', toastItemName: 'Caesar Salad', toastItemSku: 'SKU-ITEM-3', components: [{ kind: 'inventory', inventoryItem: null, quantity: 0.1, unit: 'lbs' }], recipeSteps: [{ step: 1, instruction: 'Toss' }], recipeMeta: { servings: 1, difficulty: 'Easy' } },
      ];
      return toastItemGuid ? all.filter(x => x.toastItemGuid === toastItemGuid) : all;
    },

    // Cost per item (demo values)
    menuItemCost: async (_: any, { restaurantGuid, toastItemGuid }: { restaurantGuid: string; toastItemGuid: string }) => {
      switch (toastItemGuid) {
        case 'item-1': return 4.2;
        case 'item-2': return 5.0;
        case 'item-3': return 3.1;
        default: return 4.0;
      }
    },

    // Capacity based on simple demo requirements and available stock
    menuItemCapacity: async (_: any, { restaurantGuid, toastItemGuid, quantity = 1 }: { restaurantGuid: string; toastItemGuid: string; quantity?: number }) => {
      const baseReqs: Record<string, Array<{ inventoryItem: string; unit: string; quantityPerOrder: number; available: number }>> = {
        'item-1': [
          { inventoryItem: 'i2', unit: 'lbs', quantityPerOrder: 0.2, available: 12 }, // tomatoes
          { inventoryItem: 'i3', unit: 'bottle', quantityPerOrder: 0.05, available: 6 }, // olive oil
        ],
        'item-2': [
          { inventoryItem: 'i2', unit: 'lbs', quantityPerOrder: 0.2, available: 12 },
        ],
        'item-3': [
          { inventoryItem: 'i2', unit: 'lbs', quantityPerOrder: 0.1, available: 12 },
        ],
      };
      const reqs = baseReqs[toastItemGuid] || [ { inventoryItem: 'i2', unit: 'lbs', quantityPerOrder: 0.1, available: 10 } ];
      const perOrder = reqs.map(r => r.quantityPerOrder * Number(quantity || 1));
      const capacities = reqs.map((r, idx) => Math.floor(r.available / (perOrder[idx] || r.quantityPerOrder || 1)) || 0);
      const capacity = capacities.reduce((min, v) => Math.min(min, v), Infinity);
      const allHaveStock = capacity > 0;
      return { capacity: Number.isFinite(capacity) ? capacity : 0, allHaveStock, requirements: reqs };
    },
  },

  Mutation: {
    createInventoryItem: async (_: any, { input }: any) => ({
      id: `i${Date.now()}`,
      name: input?.name || 'New Item',
      category: input?.category || 'Other',
      currentStock: typeof input?.currentStock === 'number' ? input.currentStock : 0,
      minThreshold: typeof input?.minThreshold === 'number' ? input.minThreshold : 10,
      parLevel: typeof input?.parLevel === 'number' ? input.parLevel : null,
      maxCapacity: typeof input?.maxCapacity === 'number' ? input.maxCapacity : 100,
      unit: input?.unit || 'units',
      costPerUnit: typeof input?.costPerUnit === 'number' ? input.costPerUnit : 0,
      supplier: input?.supplier || 'Demo Supplier',
      lastUpdated: new Date(),
      status: computeStatus(input?.currentStock, input?.minThreshold),
      location: input?.location || null,
      barcode: input?.barcode || null,
      qrCode: input?.qrCode || null,
      description: input?.description || null,
      expiryDate: input?.expiryDate || null,
      waste: 0,
      reorderPoint: typeof input?.reorderPoint === 'number' ? input.reorderPoint : 0,
      reorderQuantity: typeof input?.reorderQuantity === 'number' ? input.reorderQuantity : 0,
      averageDailyUsage: typeof input?.averageDailyUsage === 'number' ? input.averageDailyUsage : 0,
      restockPeriod: input?.restockPeriod || null,
      restockDays: typeof input?.restockDays === 'number' ? input.restockDays : null,
    }),
    updateInventoryItem: async (_: any, { id, input }: any) => {
      const currentStock = typeof input?.currentStock === 'number' ? input.currentStock : undefined;
      const minThreshold = typeof input?.minThreshold === 'number' ? input.minThreshold : undefined;
      const maxCapacity = typeof input?.maxCapacity === 'number' ? input.maxCapacity : 100;
      const costPerUnit = typeof input?.costPerUnit === 'number' ? input.costPerUnit : 0;
      return {
        id,
        name: input?.name || 'Item',
        category: input?.category || 'Other',
        currentStock: typeof currentStock === 'number' ? currentStock : 0,
        minThreshold: typeof minThreshold === 'number' ? minThreshold : 10,
        parLevel: typeof input?.parLevel === 'number' ? input.parLevel : null,
        maxCapacity,
        unit: input?.unit || 'units',
        costPerUnit,
        supplier: input?.supplier || 'Demo Supplier',
        lastUpdated: new Date(),
        status: computeStatus(currentStock, minThreshold),
        location: input?.location || null,
        barcode: input?.barcode || null,
        qrCode: input?.qrCode || null,
        description: input?.description || null,
        expiryDate: input?.expiryDate || null,
        waste: typeof input?.waste === 'number' ? input.waste : 0,
        reorderPoint: typeof input?.reorderPoint === 'number' ? input.reorderPoint : 0,
        reorderQuantity: typeof input?.reorderQuantity === 'number' ? input.reorderQuantity : 0,
        averageDailyUsage: typeof input?.averageDailyUsage === 'number' ? input.averageDailyUsage : 0,
        restockPeriod: input?.restockPeriod || null,
        restockDays: typeof input?.restockDays === 'number' ? input.restockDays : null,
      };
    },
    updateStock: async (_: any, { id, quantity }: any) => ({ id, currentStock: quantity, status: computeStatus(quantity, 10) }),
    createTeamMember: async (_: any, { input }: any) => ({ id: `tm${Date.now()}`, ...input, status: 'active', performance: { rating: 4.5, completedShifts: 0, onTimeRate: 100, customerRating: 4.7, salesGenerated: 0, history: [] } }),
    createInvoice: async (_: any, { input }: any) => ({ id: `inv${Date.now()}`, ...input, totalAmount: (input.amount || 0) + (input.tax || 0), status: 'pending', issuedDate: new Date() }),
    syncFromToast: async () => true,

    setMenuVisibility: async (_: any, { restaurantGuid, hiddenMenus, hiddenGroups }: any) => ({
      restaurantGuid,
      hiddenMenus: Array.isArray(hiddenMenus) ? hiddenMenus : [],
      hiddenGroups: Array.isArray(hiddenGroups) ? hiddenGroups : [],
      updatedAt: new Date(),
    }),
  },
};


