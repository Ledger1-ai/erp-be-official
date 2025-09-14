import { loadEnv } from '../config/load-env';
import { connectDB } from './connection';
import { User } from '../models/User';
import { TeamMember } from '../models/TeamMember';
import { InventoryItem } from '../models/InventoryItem';
import { Shift } from '../models/Shift';
import { Invoice } from '../models/Invoice';
import { Analytics } from '../models/Analytics';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { MenuIndex } from '../models/MenuIndex';
import { MenuVisibility } from '../models/MenuVisibility';
import { MenuMapping } from '../models/MenuMapping';
import RoleMapping from '../models/RoleMapping';
import RosterConfiguration from '../models/RosterConfiguration';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { InventoryCount } from '../models/InventoryCount';
import SavedRoster from '../models/SavedRoster';
import AIInsight from '../models/AIInsight';
import { OrderTrackingConfig } from '../models/OrderTrackingConfig';
import PerformanceEntry from '../models/PerformanceEntry';
import { isDemoMode } from '../config/demo';

async function seedDatabase() {
  try {
    loadEnv();
    console.log('🌱 Starting database seeding...');
    
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      TeamMember.deleteMany({}),
      InventoryItem.deleteMany({}),
      Shift.deleteMany({}),
      Invoice.deleteMany({}),
      Analytics.deleteMany({}),
      Supplier.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      MenuIndex.deleteMany({}),
      MenuVisibility.deleteMany({}),
      MenuMapping.deleteMany({}),
      RoleMapping.deleteMany({}),
      RosterConfiguration.deleteMany({}),
      InventoryTransaction.deleteMany({}),
      InventoryCount.deleteMany({}),
      SavedRoster.deleteMany({}),
      AIInsight.deleteMany({}),
      OrderTrackingConfig.deleteMany({}),
    ]);

    console.log('🗑️ Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@ledgerone.demo',
      role: 'Super Admin',
      password: 'hashedpassword123', // In production, use proper hashing
      permissions: ['dashboard', 'scheduling', 'inventory', 'invoicing', 'team', 'analytics', 'settings']
    });

    // Create team members
    const teamMembers = await TeamMember.create([
      {
        name: 'Sarah Johnson',
        email: 'sarah@ledgerone.demo',
        phone: '(555) 123-4567',
        role: 'Head Chef',
        department: 'Kitchen',
        status: 'active',
        joinDate: new Date('2023-01-15'),
        hourlyRate: 28.50,
        availability: 'Full-time',
        skills: ['Kitchen Management', 'Inventory', 'Training', 'Menu Development'],
        performance: {
          rating: 4.9,
          completedShifts: 156,
          onTimeRate: 98,
          customerRating: 4.8,
          salesGenerated: 125000
        },
        toastId: 'TOAST_EMP_001'
      },
      {
        name: 'Mike Chen',
        email: 'mike@ledgerone.demo',
        phone: '(555) 234-5678',
        role: 'Sous Chef',
        department: 'Kitchen',
        status: 'active',
        joinDate: new Date('2023-03-20'),
        hourlyRate: 22.00,
        availability: 'Full-time',
        skills: ['Food Prep', 'Line Cooking', 'Plating', 'Inventory'],
        performance: {
          rating: 4.7,
          completedShifts: 142,
          onTimeRate: 95,
          customerRating: 4.6,
          salesGenerated: 95000
        },
        toastId: 'TOAST_EMP_002'
      },
      {
        name: 'Emma Davis',
        email: 'emma@ledgerone.demo',
        phone: '(555) 345-6789',
        role: 'Server',
        department: 'Front of House',
        status: 'active',
        joinDate: new Date('2023-06-10'),
        hourlyRate: 18.50,
        availability: 'Part-time',
        skills: ['Customer Service', 'POS Systems', 'Wine Knowledge'],
        performance: {
          rating: 4.8,
          completedShifts: 128,
          onTimeRate: 97,
          customerRating: 4.9,
          salesGenerated: 78000
        },
        toastId: 'TOAST_EMP_003'
      }
    ]);

    // Additional team members for a realistic roster
    const additionalTeamMembers = await TeamMember.create([
      { name: 'Luis Martinez', email: 'luis@ledgerone.demo', phone: '(555) 456-7890', role: 'Line Cook', department: 'Kitchen', status: 'active', joinDate: new Date('2023-07-05'), hourlyRate: 19.00, availability: 'Full-time', skills: ['Line Cooking', 'Prep'], performance: { rating: 4.4, completedShifts: 120, onTimeRate: 95, customerRating: 4.5, salesGenerated: 50000 } },
      { name: 'Ava Thompson', email: 'ava@ledgerone.demo', phone: '(555) 567-8901', role: 'Server', department: 'Front of House', status: 'active', joinDate: new Date('2023-08-18'), hourlyRate: 17.50, availability: 'Part-time', skills: ['Customer Service', 'POS'], performance: { rating: 4.6, completedShifts: 110, onTimeRate: 96, customerRating: 4.8, salesGenerated: 60000 } },
      { name: 'Noah Williams', email: 'noah@ledgerone.demo', phone: '(555) 678-9012', role: 'Bartender', department: 'Front of House', status: 'active', joinDate: new Date('2023-09-02'), hourlyRate: 20.00, availability: 'Full-time', skills: ['Mixology', 'Inventory'], performance: { rating: 4.5, completedShifts: 105, onTimeRate: 94, customerRating: 4.6, salesGenerated: 70000 } },
      { name: 'Olivia Brown', email: 'olivia@ledgerone.demo', phone: '(555) 789-0123)', role: 'Host', department: 'Front of House', status: 'active', joinDate: new Date('2023-10-11'), hourlyRate: 16.00, availability: 'Part-time', skills: ['Seating', 'Customer Greeting'], performance: { rating: 4.7, completedShifts: 98, onTimeRate: 97, customerRating: 4.9, salesGenerated: 0 } },
      { name: 'James Anderson', email: 'james@ledgerone.demo', phone: '(555) 890-1234', role: 'Dishwasher', department: 'Kitchen', status: 'active', joinDate: new Date('2023-11-20'), hourlyRate: 15.00, availability: 'Full-time', skills: ['Sanitation'], performance: { rating: 4.3, completedShifts: 130, onTimeRate: 99, customerRating: 0, salesGenerated: 0 } },
      { name: 'Sophia Lee', email: 'sophia@ledgerone.demo', phone: '(555) 901-2345', role: 'Prep Cook', department: 'Kitchen', status: 'active', joinDate: new Date('2024-01-12'), hourlyRate: 17.00, availability: 'Full-time', skills: ['Prep', 'Knife Skills'], performance: { rating: 4.5, completedShifts: 90, onTimeRate: 96, customerRating: 0, salesGenerated: 0 } },
      { name: 'Ethan Garcia', email: 'ethan@ledgerone.demo', phone: '(555) 012-3456', role: 'Server', department: 'Front of House', status: 'active', joinDate: new Date('2024-02-08'), hourlyRate: 18.00, availability: 'Part-time', skills: ['POS', 'Wine Knowledge'], performance: { rating: 4.5, completedShifts: 88, onTimeRate: 95, customerRating: 4.7, salesGenerated: 55000 } },
      { name: 'Mia Patel', email: 'mia@ledgerone.demo', phone: '(555) 222-3344', role: 'Pastry Chef', department: 'Kitchen', status: 'active', joinDate: new Date('2024-03-01'), hourlyRate: 24.00, availability: 'Full-time', skills: ['Desserts'], performance: { rating: 4.8, completedShifts: 70, onTimeRate: 98, customerRating: 4.9, salesGenerated: 40000 } },
      { name: 'Liam Nguyen', email: 'liam@ledgerone.demo', phone: '(555) 333-4455', role: 'Runner', department: 'Front of House', status: 'active', joinDate: new Date('2024-04-18'), hourlyRate: 15.50, availability: 'Part-time', skills: ['Running', 'Customer Service'], performance: { rating: 4.4, completedShifts: 60, onTimeRate: 97, customerRating: 4.6, salesGenerated: 0 } },
      { name: 'Zoe Thakur', email: 'zoe@ledgerone.demo', phone: '(555) 444-5566', role: 'Barback', department: 'Front of House', status: 'active', joinDate: new Date('2024-05-07'), hourlyRate: 16.50, availability: 'Part-time', skills: ['Restocking'], performance: { rating: 4.3, completedShifts: 55, onTimeRate: 97, customerRating: 0, salesGenerated: 0 } },
      { name: 'Jack Wilson', email: 'jack@ledgerone.demo', phone: '(555) 555-6677', role: 'Server', department: 'Front of House', status: 'active', joinDate: new Date('2024-06-15'), hourlyRate: 18.25, availability: 'Full-time', skills: ['POS', 'Customer Service'], performance: { rating: 4.6, completedShifts: 80, onTimeRate: 96, customerRating: 4.8, salesGenerated: 62000 } },
      // Additional FOH bartenders/hosts to showcase HostPro & roster panel
      { name: 'Alex Rivera', email: 'alex.rivera@ledgerone.demo', phone: '(555) 010-0001', role: 'Bartender', department: 'Front of House', status: 'active', joinDate: new Date('2024-07-01'), hourlyRate: 21.00, availability: 'Full-time', skills: ['Mixology','Customer Service','Inventory'], performance: { rating: 4.7, completedShifts: 95, onTimeRate: 96, customerRating: 4.8, salesGenerated: 85000 } },
      { name: 'Bianca Torres', email: 'bianca.torres@ledgerone.demo', phone: '(555) 010-0002', role: 'Bartender', department: 'Front of House', status: 'active', joinDate: new Date('2024-07-15'), hourlyRate: 20.50, availability: 'Part-time', skills: ['Mixology','Beer & Wine'], performance: { rating: 4.6, completedShifts: 80, onTimeRate: 95, customerRating: 4.7, salesGenerated: 60000 } },
      { name: 'Carlos Mendes', email: 'carlos.mendes@ledgerone.demo', phone: '(555) 010-0003', role: 'Barback', department: 'Front of House', status: 'active', joinDate: new Date('2024-08-05'), hourlyRate: 16.75, availability: 'Full-time', skills: ['Restocking','Bar Support'], performance: { rating: 4.4, completedShifts: 70, onTimeRate: 98, customerRating: 0, salesGenerated: 0 } },
      { name: 'Diana Prince', email: 'diana.prince@ledgerone.demo', phone: '(555) 010-0004', role: 'Host', department: 'Front of House', status: 'active', joinDate: new Date('2024-08-12'), hourlyRate: 16.25, availability: 'Part-time', skills: ['Seating','Waitlist Management'], performance: { rating: 4.8, completedShifts: 60, onTimeRate: 99, customerRating: 4.9, salesGenerated: 0 } },
      { name: 'Evan Brooks', email: 'evan.brooks@ledgerone.demo', phone: '(555) 010-0005', role: 'Server', department: 'Front of House', status: 'active', joinDate: new Date('2024-08-20'), hourlyRate: 18.75, availability: 'Full-time', skills: ['Wine Knowledge','POS'], performance: { rating: 4.5, completedShifts: 85, onTimeRate: 96, customerRating: 4.8, salesGenerated: 70000 } },
      { name: 'Farah Khan', email: 'farah.khan@ledgerone.demo', phone: '(555) 010-0006', role: 'Bartender', department: 'Front of House', status: 'active', joinDate: new Date('2024-09-01'), hourlyRate: 21.50, availability: 'Full-time', skills: ['Craft Cocktails','Speed Bartending'], performance: { rating: 4.9, completedShifts: 110, onTimeRate: 97, customerRating: 4.9, salesGenerated: 98000 } },
      { name: 'Gina Rossi', email: 'gina.rossi@ledgerone.demo', phone: '(555) 010-0007', role: 'Bartender', department: 'Front of House', status: 'active', joinDate: new Date('2024-09-10'), hourlyRate: 20.75, availability: 'Part-time', skills: ['Beer','Wine','Mixology'], performance: { rating: 4.6, completedShifts: 75, onTimeRate: 95, customerRating: 4.7, salesGenerated: 62000 } },
      { name: 'Hector Alvarez', email: 'hector.alvarez@ledgerone.demo', phone: '(555) 010-0008', role: 'Server', department: 'Front of House', status: 'active', joinDate: new Date('2024-09-22'), hourlyRate: 18.25, availability: 'Full-time', skills: ['Customer Service','POS'], performance: { rating: 4.4, completedShifts: 65, onTimeRate: 94, customerRating: 4.6, salesGenerated: 58000 } },
      { name: 'Isabella Cruz', email: 'isabella.cruz@ledgerone.demo', phone: '(555) 010-0009', role: 'Host', department: 'Front of House', status: 'active', joinDate: new Date('2024-10-01'), hourlyRate: 16.00, availability: 'Part-time', skills: ['Seating','Phone'], performance: { rating: 4.7, completedShifts: 55, onTimeRate: 99, customerRating: 4.8, salesGenerated: 0 } },
      { name: 'Jon Park', email: 'jon.park@ledgerone.demo', phone: '(555) 010-0010', role: 'Bartender', department: 'Front of House', status: 'active', joinDate: new Date('2024-10-10'), hourlyRate: 21.25, availability: 'Full-time', skills: ['Mixology','Inventory'], performance: { rating: 4.8, completedShifts: 92, onTimeRate: 96, customerRating: 4.9, salesGenerated: 90000 } },
      // Additional Kitchen staff to ensure coverage
      { name: 'Kevin O\'Neil', email: 'kevin.oneil@ledgerone.demo', phone: '(555) 020-1001', role: 'Line Cook', department: 'Kitchen', status: 'active', joinDate: new Date('2024-09-15'), hourlyRate: 19.50, availability: 'Full-time', skills: ['Grill','Saute'], performance: { rating: 4.5, completedShifts: 85, onTimeRate: 96, customerRating: 0, salesGenerated: 0 } },
      { name: 'Laura Chen', email: 'laura.chen@ledgerone.demo', phone: '(555) 020-1002', role: 'Sous Chef', department: 'Kitchen', status: 'active', joinDate: new Date('2024-09-20'), hourlyRate: 23.00, availability: 'Full-time', skills: ['Expediting','Prep'], performance: { rating: 4.7, completedShifts: 90, onTimeRate: 97, customerRating: 0, salesGenerated: 0 } },
      { name: 'Marco Diaz', email: 'marco.diaz@ledgerone.demo', phone: '(555) 020-1003', role: 'Prep Cook', department: 'Kitchen', status: 'active', joinDate: new Date('2024-10-05'), hourlyRate: 17.25, availability: 'Part-time', skills: ['Knife Skills','Batching'], performance: { rating: 4.3, completedShifts: 60, onTimeRate: 95, customerRating: 0, salesGenerated: 0 } },
      { name: 'Nina Patel', email: 'nina.patel@ledgerone.demo', phone: '(555) 020-1004', role: 'Pastry Chef', department: 'Kitchen', status: 'active', joinDate: new Date('2024-10-12'), hourlyRate: 24.50, availability: 'Full-time', skills: ['Desserts','Plating'], performance: { rating: 4.8, completedShifts: 70, onTimeRate: 98, customerRating: 0, salesGenerated: 0 } },
    ]);
    const allTeamMembers = [...teamMembers, ...additionalTeamMembers];

    // Create inventory items (base set)
    const inventoryItems = await InventoryItem.create([
      {
        name: 'Chicken Breast',
        category: 'Proteins',
        currentStock: 25,
        minThreshold: 30,
        maxCapacity: 100,
        unit: 'lbs',
        costPerUnit: 3.50,
        supplier: 'Fresh Foods Co.',
        status: 'low',
        location: 'Walk-in Freezer A',
        createdBy: adminUser._id
      },
      {
        name: 'Organic Tomatoes',
        category: 'Vegetables',
        currentStock: 15,
        minThreshold: 20,
        maxCapacity: 50,
        unit: 'lbs',
        costPerUnit: 2.25,
        supplier: 'Local Farm Market',
        status: 'low',
        location: 'Produce Section',
        createdBy: adminUser._id
      },
      {
        name: 'Heavy Cream',
        category: 'Dairy',
        currentStock: 8,
        minThreshold: 10,
        maxCapacity: 25,
        unit: 'quarts',
        costPerUnit: 4.75,
        supplier: 'Dairy Delights',
        status: 'critical',
        location: 'Walk-in Cooler',
        createdBy: adminUser._id
      },
      {
        name: 'Extra Virgin Olive Oil',
        category: 'Pantry',
        currentStock: 12,
        minThreshold: 8,
        maxCapacity: 30,
        unit: 'bottles',
        costPerUnit: 15.99,
        supplier: 'Mediterranean Imports',
        status: 'normal',
        location: 'Dry Storage',
        createdBy: adminUser._id
      }
    ]);

    // Expand demo inventory substantially across categories
    function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function randFloat(min: number, max: number, decimals = 2) {
      const n = Math.random() * (max - min) + min;
      return Number(n.toFixed(decimals));
    }
    const categories: Array<{ name: string; unit: string; items: string[]; loc: string }> = [
      { name: 'Proteins', unit: 'lbs', loc: 'Freezer A', items: ['Salmon Fillet','Ground Beef','Pork Shoulder','Bacon','Eggs','Tofu'] },
      { name: 'Vegetables', unit: 'lbs', loc: 'Produce Section', items: ['Onions','Bell Peppers','Spinach','Mushrooms','Basil','Garlic'] },
      { name: 'Dairy', unit: 'quarts', loc: 'Walk-in Cooler', items: ['Whole Milk','Parmesan Cheese','Butter','Yogurt','Cheddar Cheese','Ricotta'] },
      { name: 'Pantry', unit: 'units', loc: 'Dry Storage', items: ['Flour','Sugar','Rice','Pasta','Canned Tomatoes','Active Dry Yeast'] },
      { name: 'Beverages', unit: 'bottles', loc: 'Bar Cooler', items: ['Cola Syrup','Lemonade Mix','Coffee Beans','Tea Bags','Sparkling Water','Orange Juice'] },
      { name: 'Spices', unit: 'oz', loc: 'Dry Storage', items: ['Black Pepper','Sea Salt','Oregano','Chili Flakes','Cumin','Paprika'] },
      { name: 'Bakery', unit: 'units', loc: 'Bakery Rack', items: ['Burger Buns','Baguette','Tortillas','Croissants','Sourdough Loaf','Pita Bread'] },
      { name: 'Condiments', unit: 'bottles', loc: 'Dry Storage', items: ['Ketchup','Mustard','Mayonnaise','Hot Sauce','Soy Sauce','BBQ Sauce'] },
      { name: 'Packaging', unit: 'case', loc: 'Back Room', items: ['To-Go Box Small','To-Go Box Large','Napkins','Straws','Paper Cups','Cup Lids'] },
      { name: 'Desserts', unit: 'units', loc: 'Freezer B', items: ['Vanilla Ice Cream','Chocolate Syrup','Brownie Mix','Cheesecake Slice','Whipped Cream','Fruit Compote'] },
    ];
    const suppliersPool = ['Fresh Foods Co.','Local Farm Market','Dairy Delights','Mediterranean Imports','Crescent Packaging','Bartender Supply Co.'];
    const extraInputs: any[] = [];
    for (const cat of categories) {
      for (const nm of cat.items) {
        const maxCap = randInt(30, 200);
        const minTh = randInt(5, Math.max(10, Math.floor(maxCap * 0.3)));
        const current = randInt(0, maxCap);
        extraInputs.push({
          name: nm,
          category: cat.name,
          currentStock: current,
          minThreshold: minTh,
          parLevel: Math.max(minTh, randInt(minTh, Math.max(minTh + 10, Math.floor(maxCap * 0.6)))),
          maxCapacity: maxCap,
          unit: cat.unit,
          costPerUnit: randFloat(0.5, 25),
          supplier: suppliersPool[randInt(0, suppliersPool.length - 1)],
          location: cat.loc,
          brand: ['Premium','Select','House','Organic'][randInt(0, 3)],
          reorderPoint: randInt(0, minTh),
          reorderQuantity: randInt(5, 40),
          averageDailyUsage: randFloat(0.1, 6, 1),
          createdBy: adminUser._id,
        });
      }
    }
    const extraDocs = await InventoryItem.create(extraInputs);
    inventoryItems.push(...extraDocs);

    // Vendors/Suppliers
    const suppliers = await Supplier.create([
      {
        name: 'Fresh Foods Co.',
        companyName: 'Fresh Foods Co.',
        supplierCode: 'FFC-001',
        type: 'Primary',
        categories: ['Proteins', 'Vegetables'],
        status: 'Active',
        contacts: [{ name: 'Lena Park', email: 'lena@ffc.demo', phone: '+1-555-1111', isPrimary: true }],
        address: { street: '100 Market St', city: 'Denver', state: 'CO', zipCode: '80202', country: 'US' },
        paymentTerms: { terms: 'Net 30', creditLimit: 5000, currency: 'USD' },
        deliveryInfo: { deliveryDays: ['Monday','Thursday'], deliveryWindow: '8 AM - 12 PM', minimumOrder: 100, freeDeliveryThreshold: 500, leadTimeDays: 2 },
        performanceMetrics: { totalOrders: 24, totalSpent: 12000, averageOrderValue: 500, onTimeDeliveryRate: 98, qualityRating: 4.7 },
        certifications: ['HACCP'],
        currentRepresentative: { name: 'Lena Park', title: 'Account Rep', email: 'lena@ffc.demo', phone: '+1-555-1111' },
        notes: 'Primary protein supplier',
        isPreferred: true,
        createdBy: adminUser._id,
        updatedBy: adminUser._id,
      },
      {
        name: 'Mediterranean Imports',
        companyName: 'Mediterranean Imports LLC',
        supplierCode: 'MI-100',
        type: 'Secondary',
        categories: ['Pantry'],
        status: 'Active',
        contacts: [{ name: 'Giorgio Rossi', email: 'giorgio@mi.demo', phone: '+1-555-2222', isPrimary: true }],
        address: { street: '5 Olive Way', city: 'Denver', state: 'CO', zipCode: '80202', country: 'US' },
        paymentTerms: { terms: 'Net 15', creditLimit: 2000, currency: 'USD' },
        deliveryInfo: { deliveryDays: ['Tuesday'], deliveryWindow: '9 AM - 11 AM', minimumOrder: 50, freeDeliveryThreshold: 300, leadTimeDays: 1 },
        performanceMetrics: { totalOrders: 12, totalSpent: 2400, averageOrderValue: 200, onTimeDeliveryRate: 96, qualityRating: 4.6 },
        certifications: ['Organic'],
        currentRepresentative: { name: 'Giorgio Rossi', title: 'Sales Manager', email: 'giorgio@mi.demo', phone: '+1-555-2222' },
        notes: 'Olive oil and pantry',
        isPreferred: false,
        createdBy: adminUser._id,
        updatedBy: adminUser._id,
      }
    ]);

    // Create shifts
    const baseDay = new Date();
    const todayY = baseDay.getFullYear();
    const todayM = baseDay.getMonth();
    const todayD = baseDay.getDate();
    const dynamicDate = isDemoMode() ? new Date(todayY, todayM, todayD) : new Date('2025-01-23');
    // Generate a week's worth of shifts across roles
    const roles = [
      { role: 'Head Chef', startTime: '14:00', endTime: '22:00' },
      { role: 'Sous Chef', startTime: '15:00', endTime: '23:00' },
      { role: 'Server', startTime: '17:00', endTime: '00:00' },
      { role: 'Bartender', startTime: '16:00', endTime: '23:00' },
      { role: 'Host', startTime: '16:00', endTime: '22:00' },
    ];
    const staffPool = [
      ...teamMembers.map(t => t._id),
      ...(typeof additionalTeamMembers !== 'undefined' ? additionalTeamMembers.map((t: any) => t._id) : [])
    ];
    const shiftsToCreate: any[] = [];
    for (let offset = -2; offset <= 4; offset++) {
      const date = isDemoMode() ? new Date(todayY, todayM, todayD + offset) : dynamicDate;
      for (const r of roles) {
        const assignedTo = staffPool[Math.floor(Math.random() * staffPool.length)];
        shiftsToCreate.push({ date, startTime: r.startTime, endTime: r.endTime, role: r.role, assignedTo, status: 'scheduled', createdBy: adminUser._id });
      }
      // Add extra FOH + Kitchen coverage on peak days for HostPro demo
      if (offset >= 0) {
        const pick = (title: string) => (allTeamMembers.find((m: any) => String(m.role).toLowerCase().includes(title)) || staffPool[Math.floor(Math.random() * staffPool.length)]);
        const bartender = pick('bartend');
        const host = pick('host');
        const lineCook = pick('line cook');
        const sousChef = pick('sous');
        shiftsToCreate.push({ date, startTime: '17:00', endTime: '23:00', role: 'Bartender', assignedTo: (bartender as any)._id || bartender, status: 'scheduled', createdBy: adminUser._id });
        shiftsToCreate.push({ date, startTime: '17:00', endTime: '22:00', role: 'Host', assignedTo: (host as any)._id || host, status: 'scheduled', createdBy: adminUser._id });
        shiftsToCreate.push({ date, startTime: '16:00', endTime: '23:00', role: 'Line Cook', assignedTo: (lineCook as any)._id || lineCook, status: 'scheduled', createdBy: adminUser._id });
        shiftsToCreate.push({ date, startTime: '15:00', endTime: '22:00', role: 'Sous Chef', assignedTo: (sousChef as any)._id || sousChef, status: 'scheduled', createdBy: adminUser._id });
      }
    }
    const shifts = await Shift.create(shiftsToCreate);

    // Create multiple purchase orders
    function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
    function poNum(n: number) { return `PO-2025-${String(n).padStart(4,'0')}`; }
    const poInputs: any[] = [];
    for (let i = 1; i <= 8; i++) {
      const supplier = randomFrom(suppliers);
      const itemsPick = [randomFrom(inventoryItems), randomFrom(inventoryItems), randomFrom(inventoryItems)].filter((v, idx, a) => a.indexOf(v) === idx);
      const orderDate = isDemoMode() ? new Date(baseDay.getFullYear(), baseDay.getMonth(), baseDay.getDate() - (10 - i)) : new Date('2025-01-21');
      const expectedDeliveryDate = isDemoMode() ? new Date(baseDay.getFullYear(), baseDay.getMonth(), baseDay.getDate() + i % 5) : new Date('2025-01-24');
      const items = itemsPick.map((it: any, idx: number) => ({
        inventoryItem: it._id,
        name: it.name,
        sku: `${String(it.name).slice(0,2).toUpperCase()}-${100 + idx + i}`,
        quantityOrdered: 10 + Math.floor(Math.random() * 50),
        unit: it.unit,
        unitCost: it.costPerUnit,
        totalCost: Number(((10 + Math.floor(Math.random() * 50)) * it.costPerUnit).toFixed(2))
      }));
      poInputs.push({ poNumber: poNum(i), supplier: supplier._id, supplierName: supplier.name, status: 'confirmed', orderDate, expectedDeliveryDate, items, tax: 10, shipping: 5, notes: 'Auto-generated', createdBy: adminUser._id });
    }
    const createdPOs = await PurchaseOrder.create(poInputs);

    // Create invoices (10 with varied statuses)
    const invoiceClients = ['Corporate Event Group','Local Business Association','Neighborhood Council','Startup Hub','Wedding Planner'];
    const invoiceInputs: any[] = [];
    for (let i = 1; i <= 10; i++) {
      const base = 1200 + Math.floor(Math.random() * 3000);
      const tax = Math.round(base * 0.08);
      const issuedDate = isDemoMode() ? new Date(baseDay.getFullYear(), baseDay.getMonth(), baseDay.getDate() - (20 - i)) : new Date('2025-01-15');
      const dueDate = isDemoMode() ? new Date(baseDay.getFullYear(), baseDay.getMonth(), baseDay.getDate() - (10 - i)) : new Date('2025-02-10');
      const isPaid = i % 3 === 0;
      const paidDate = isPaid ? (isDemoMode() ? new Date(baseDay.getFullYear(), baseDay.getMonth(), baseDay.getDate() - (8 - i)) : new Date('2025-01-20')) : undefined;
      invoiceInputs.push({
        invoiceNumber: `INV-2025-${String(i).padStart(4,'0')}`,
        clientName: invoiceClients[i % invoiceClients.length],
        clientEmail: `billing${i}@client.demo`,
        amount: base,
        tax,
        totalAmount: base + tax,
        dueDate,
        issuedDate,
        status: isPaid ? 'paid' : (i % 4 === 0 ? 'overdue' : 'pending'),
        paidDate,
        description: 'Catering services',
        paymentMethod: isPaid ? 'bank_transfer' : 'credit_card',
        createdBy: adminUser._id
      });
    }
    const invoices = await Invoice.create(invoiceInputs);

    // Inventory transactions across last 14 days (receiving, consumption, waste)
    const txInputs: any[] = [];
    function day(n: number) { const d = new Date(baseDay); d.setDate(d.getDate() + n); return d; }
    for (let d = -14; d <= 0; d++) {
      const itemsPick = inventoryItems.slice().sort(() => 0.5 - Math.random()).slice(0, 6);
      for (const it of itemsPick) {
        const receivingQty = 5 + Math.floor(Math.random() * 15);
        const balanceBefore = it.currentStock;
        const afterReceiving = balanceBefore + receivingQty;
        txInputs.push({
          inventoryItem: it._id,
          itemName: it.name,
          transactionType: 'receiving',
          quantity: receivingQty,
          unit: it.unit,
          unitCost: it.costPerUnit,
          totalCost: Number((receivingQty * it.costPerUnit).toFixed(2)),
          balanceBefore,
          balanceAfter: afterReceiving,
          supplier: suppliers[0]._id,
          referenceType: 'PurchaseOrder',
          referenceId: createdPOs[0]._id,
          referenceNumber: createdPOs[0].poNumber,
          createdBy: adminUser._id,
          createdAt: isDemoMode() ? day(d) : undefined,
          updatedAt: isDemoMode() ? day(d) : undefined,
        });
        const useQty = Math.min(5 + Math.floor(Math.random() * 10), afterReceiving);
        const afterUse = Math.max(afterReceiving - useQty, 0);
        txInputs.push({
          inventoryItem: it._id,
          itemName: it.name,
          transactionType: 'consumption',
          quantity: useQty,
          unit: it.unit,
          unitCost: it.costPerUnit,
          totalCost: Number((useQty * it.costPerUnit).toFixed(2)),
          balanceBefore: afterReceiving,
          balanceAfter: afterUse,
          referenceType: 'Recipe',
          createdBy: adminUser._id,
          createdAt: isDemoMode() ? day(d) : undefined,
          updatedAt: isDemoMode() ? day(d) : undefined,
        });
        if (Math.random() < 0.25) {
          const wasteQty = 1 + Math.floor(Math.random() * 3);
          txInputs.push({
            inventoryItem: it._id,
            itemName: it.name,
            transactionType: 'waste',
            quantity: wasteQty,
            unit: it.unit,
            unitCost: it.costPerUnit,
            totalCost: Number((wasteQty * it.costPerUnit).toFixed(2)),
            balanceBefore: afterUse,
            balanceAfter: Math.max(afterUse - wasteQty, 0),
            reason: 'Spoilage',
            createdBy: adminUser._id,
            createdAt: isDemoMode() ? day(d) : undefined,
            updatedAt: isDemoMode() ? day(d) : undefined,
          });
        }
      }
    }
    await InventoryTransaction.insertMany(txInputs);

    // Menu index and visibility with multiple items and modifiers
    await MenuIndex.create({
      restaurantGuid: 'rest-1',
      lastUpdated: new Date().toISOString(),
      menus: [
        {
          name: 'Demo Menu', guid: 'm-1', description: 'Main',
          menuGroups: [
            {
              guid: 'g-1', name: 'Pizzas', description: 'Wood-fired pizzas',
              menuItems: [
                { guid: 'item-1', name: 'Margherita Pizza', description: 'Tomato, mozzarella, basil', price: 12, modifierGroupReferences: [101] },
                { guid: 'item-2', name: 'Pepperoni Pizza', description: 'Tomato, mozzarella, pepperoni', price: 14, modifierGroupReferences: [101] }
              ]
            },
            {
              guid: 'g-2', name: 'Salads', description: 'Fresh salads',
              menuItems: [
                { guid: 'item-3', name: 'Caesar Salad', description: 'Romaine, parmesan, croutons', price: 9, modifierGroupReferences: [] }
              ]
            }
          ]
        }
      ],
      modifierGroupReferences: new Map(Object.entries({
        '101': { referenceId: 101, guid: 'mg-101', name: 'Extras', pricingStrategy: 'add', modifierOptionReferences: [201,202] }
      })),
      modifierOptionReferences: new Map(Object.entries({
        '201': { referenceId: 201, guid: 'mo-201', name: 'Extra Cheese', price: 2, pricingStrategy: 'add' },
        '202': { referenceId: 202, guid: 'mo-202', name: 'Gluten Free Crust', price: 3, pricingStrategy: 'add' }
      })),
    });
    await MenuVisibility.create({ restaurantGuid: 'rest-1', hiddenMenus: [], hiddenGroups: [], updatedBy: adminUser._id });
    await MenuMapping.create({ restaurantGuid: 'rest-1', toastItemGuid: 'item-1', toastItemName: 'Margherita Pizza', components: [{ kind: 'inventory', inventoryItem: inventoryItems[1]._id, quantity: 0.2, unit: 'lbs' }, { kind: 'inventory', inventoryItem: inventoryItems[3]._id, quantity: 0.05, unit: 'bottle' }], recipeSteps: [{ step: 1, instruction: 'Prep dough' }, { step: 2, instruction: 'Bake' }], recipeMeta: { servings: 1, difficulty: 'Easy', prepTime: 10, cookTime: 10, totalTime: 20 } });
    await MenuMapping.create({ restaurantGuid: 'rest-1', toastItemGuid: 'item-2', toastItemName: 'Pepperoni Pizza', components: [{ kind: 'inventory', inventoryItem: inventoryItems[1]._id, quantity: 0.2, unit: 'lbs' }], recipeSteps: [{ step: 1, instruction: 'Prep dough' }, { step: 2, instruction: 'Bake' }], recipeMeta: { servings: 1, difficulty: 'Easy' } });
    await MenuMapping.create({ restaurantGuid: 'rest-1', toastItemGuid: 'item-3', toastItemName: 'Caesar Salad', components: [{ kind: 'inventory', inventoryItem: inventoryItems[1]._id, quantity: 0.1, unit: 'lbs' }], recipeSteps: [{ step: 1, instruction: 'Toss' }], recipeMeta: { servings: 1, difficulty: 'Easy' } });

    // Role mapping and roster configuration
    await RoleMapping.create({ sevenShiftsRoleName: 'Server', standardRoleName: 'Server', department: 'Front of House', stratum: 'FOH' });
    await RoleMapping.create({ sevenShiftsRoleName: 'Head Chef', standardRoleName: 'Head Chef', department: 'Kitchen', stratum: 'BOH' });
    await RosterConfiguration.create({
      name: 'Default Roster',
      description: 'Demo roster config',
      isActive: true,
      nodes: [{ id: 'station-1', name: 'Hot Line', department: 'Kitchen', stratum: 'BOH', capacity: 3, assigned: [{ userId: String(teamMembers[0]._id), source: 'TOAST', displayName: 'Sarah' }] }]
    });

    // Saved roster example
    await (await import('../models/SavedRoster')).default.create({
      name: 'Friday Dinner Roster',
      rosterDate: isDemoMode() ? new Date(baseDay.getFullYear(), baseDay.getMonth(), baseDay.getDate() + 1) : new Date('2025-01-24'),
      shift: 'Dinner',
      notes: 'Weekend service',
      nodes: [{ id: 'station-1', name: 'Hot Line', department: 'Kitchen', stratum: 'BOH', capacity: 3, assigned: [{ userId: String(teamMembers[0]._id), source: 'TOAST', displayName: 'Sarah' }] }],
      aggregateRatings: { overall: 4.6, byDepartment: [{ department: 'Kitchen', rating: 4.7 }, { department: 'Front of House', rating: 4.5 }] }
    });

    // AI insights examples
    await (await import('../models/AIInsight')).default.create([
      { module: 'inventory', title: 'Low stock alert: Chicken Breast', description: 'Order 30 lbs to reach par level', action: 'Create purchase order', urgency: 'medium' },
      { module: 'menu', title: 'High margin item: Margherita Pizza', description: 'Promote as special today', action: 'Feature in specials', urgency: 'low' }
    ]);

    // Order tracking config
    await (await import('../models/OrderTrackingConfig')).OrderTrackingConfig.create({ restaurantGuid: 'rest-1', enabled: true, lastRunAt: new Date(), lastBusinessDate: isDemoMode() ? `${baseDay.getFullYear()}-${String(baseDay.getMonth()+1).padStart(2,'0')}-${String(baseDay.getDate()-1).padStart(2,'0')}` : '2025-01-22' });

    // Create analytics series (daily/weekly/monthly)
    const analyticsDocs: any[] = [];
    for (let i = 0; i < 14; i++) {
      analyticsDocs.push({
        period: 'daily',
        date: isDemoMode() ? new Date(baseDay.getFullYear(), baseDay.getMonth(), baseDay.getDate() - i) : new Date('2025-01-22'),
        revenue: 4500 + Math.floor(Math.random() * 3000),
        orders: 90 + Math.floor(Math.random() * 80),
        avgOrderValue: 45 + Math.random() * 10,
        customerSatisfaction: 4.3 + Math.random() * 0.5,
        tableTurnover: 2.8 + Math.random() * 0.6,
        totalCustomers: 120 + Math.floor(Math.random() * 80),
        repeatCustomers: 40 + Math.floor(Math.random() * 40),
        averageWaitTime: 10 + Math.random() * 5,
        staffUtilization: 78 + Math.random() * 10,
        inventoryValue: 11000 + Math.floor(Math.random() * 2000),
        wastePercentage: 2.5 + Math.random() * 1.5,
      });
    }
    for (let i = 0; i < 8; i++) {
      analyticsDocs.push({
        period: 'weekly',
        date: isDemoMode() ? new Date(baseDay.getFullYear(), baseDay.getMonth(), baseDay.getDate() - (7 * i)) : new Date('2025-01-20'),
        revenue: 40000 + Math.floor(Math.random() * 15000),
        orders: 700 + Math.floor(Math.random() * 400),
        avgOrderValue: 48 + Math.random() * 6,
        customerSatisfaction: 4.4 + Math.random() * 0.4,
        tableTurnover: 3.0 + Math.random() * 0.4,
        totalCustomers: 900 + Math.floor(Math.random() * 400),
        repeatCustomers: 300 + Math.floor(Math.random() * 200),
        averageWaitTime: 11 + Math.random() * 4,
        staffUtilization: 80 + Math.random() * 8,
        inventoryValue: 11500 + Math.floor(Math.random() * 2000),
        wastePercentage: 2.7 + Math.random() * 1.2,
      });
    }
    for (let i = 0; i < 6; i++) {
      analyticsDocs.push({
        period: 'monthly',
        date: isDemoMode() ? new Date(baseDay.getFullYear(), baseDay.getMonth() - i, 1) : new Date('2025-01-01'),
        revenue: 160000 + Math.floor(Math.random() * 60000),
        orders: 3200 + Math.floor(Math.random() * 1200),
        avgOrderValue: 49 + Math.random() * 5,
        customerSatisfaction: 4.3 + Math.random() * 0.5,
        tableTurnover: 3.0 + Math.random() * 0.3,
        totalCustomers: 3000 + Math.floor(Math.random() * 1000),
        repeatCustomers: 1000 + Math.floor(Math.random() * 600),
        averageWaitTime: 12 + Math.random() * 3,
        staffUtilization: 81 + Math.random() * 6,
        inventoryValue: 12000 + Math.floor(Math.random() * 2500),
        wastePercentage: 2.9 + Math.random() * 1.0,
      });
    }
    const analytics = await Analytics.create(analyticsDocs);

    // Seed performance entries for team members (ratings + flags)
    try {
      const restaurantGuid = 'rest-1';
      const allMembers = await TeamMember.find({}).lean();
      const perfDocs: any[] = [];
      const daysBack = 30;
      for (const m of allMembers) {
        const guid = `tm-${String(m._id)}`;
        for (let d = 0; d < daysBack; d++) {
          const dayDate = isDemoMode() ? new Date(todayY, todayM, todayD - d) : new Date('2025-01-01');
          // 60% chance to have a rating that day
          if (Math.random() < 0.6) {
            const rating = 3 + Math.random() * 2; // 3.0 - 5.0
            perfDocs.push({ restaurantGuid, employeeToastGuid: guid, rating: Number(rating.toFixed(1)), isFlag: false, flagType: null, details: '', date: dayDate, createdAt: dayDate, updatedAt: dayDate });
          }
          // occasional flags
          const r = Math.random();
          if (r < 0.05) {
            perfDocs.push({ restaurantGuid, employeeToastGuid: guid, rating: null, isFlag: true, flagType: 'red', details: 'Customer complaint', date: dayDate, createdAt: dayDate, updatedAt: dayDate });
          } else if (r < 0.10) {
            perfDocs.push({ restaurantGuid, employeeToastGuid: guid, rating: null, isFlag: true, flagType: 'yellow', details: 'Late to shift', date: dayDate, createdAt: dayDate, updatedAt: dayDate });
          } else if (r < 0.15) {
            perfDocs.push({ restaurantGuid, employeeToastGuid: guid, rating: null, isFlag: true, flagType: 'blue', details: 'Went above and beyond', date: dayDate, createdAt: dayDate, updatedAt: dayDate });
          }
        }
      }
      if (perfDocs.length) await PerformanceEntry.insertMany(perfDocs);
      console.log(`⭐ Seeded ${perfDocs.length} performance entries`);
    } catch (e) {
      console.warn('Skipping performance seeding:', e);
    }

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Created ${allTeamMembers.length} team members`);
    console.log(`📦 Created ${inventoryItems.length} inventory items`);
    console.log(`📅 Created ${shifts.length} shifts`);
    console.log(`🏭 Created ${suppliers.length} suppliers`);
    console.log(`🧾 Created ${createdPOs.length} purchase orders`);
    console.log(`💰 Created ${invoices.length} invoices`);
    console.log(`📈 Created ${analytics.length} analytics records`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase }; 