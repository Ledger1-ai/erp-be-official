import { connectDB } from './connection';
import { User } from '../models/User';
import { TeamMember } from '../models/TeamMember';
import { InventoryItem } from '../models/InventoryItem';
import { Shift } from '../models/Shift';
import { Invoice } from '../models/Invoice';
import { Analytics } from '../models/Analytics';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await TeamMember.deleteMany({});
    await InventoryItem.deleteMany({});
    await Shift.deleteMany({});
    await Invoice.deleteMany({});
    await Analytics.deleteMany({});

    console.log('🗑️ Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@thegraineledger.com',
      role: 'Super Admin',
      password: 'hashedpassword123', // In production, use proper hashing
      permissions: ['dashboard', 'scheduling', 'inventory', 'invoicing', 'team', 'analytics', 'settings']
    });

    // Create team members
    const teamMembers = await TeamMember.create([
      {
        name: 'Sarah Johnson',
        email: 'sarah@thegraineledger.com',
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
        email: 'mike@thegraineledger.com',
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
        email: 'emma@thegraineledger.com',
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

    // Create inventory items
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

    // Create shifts
    const shifts = await Shift.create([
      {
        date: new Date('2025-01-23'),
        startTime: '14:00',
        endTime: '22:00',
        role: 'Head Chef',
        assignedTo: teamMembers[0]._id,
        status: 'scheduled',
        createdBy: adminUser._id
      },
      {
        date: new Date('2025-01-23'),
        startTime: '15:00',
        endTime: '23:00',
        role: 'Sous Chef',
        assignedTo: teamMembers[1]._id,
        status: 'scheduled',
        createdBy: adminUser._id
      },
      {
        date: new Date('2025-01-23'),
        startTime: '17:00',
        endTime: '00:00',
        role: 'Server',
        assignedTo: teamMembers[2]._id,
        status: 'scheduled',
        createdBy: adminUser._id
      }
    ]);

    // Create invoices
    const invoices = await Invoice.create([
      {
        invoiceNumber: 'INV-2025-0001',
        clientName: 'Corporate Event Group',
        clientEmail: 'events@corporate.com',
        amount: 2500.00,
        tax: 200.00,
        totalAmount: 2700.00,
        dueDate: new Date('2025-02-15'),
        status: 'pending',
        description: 'Catering services for annual meeting',
        paymentMethod: 'credit_card',
        createdBy: adminUser._id
      },
      {
        invoiceNumber: 'INV-2025-0002',
        clientName: 'Local Business Association',
        clientEmail: 'admin@lba.org',
        amount: 1800.00,
        tax: 144.00,
        totalAmount: 1944.00,
        dueDate: new Date('2025-02-10'),
        status: 'paid',
        paidDate: new Date('2025-01-20'),
        description: 'Lunch catering for networking event',
        paymentMethod: 'bank_transfer',
        createdBy: adminUser._id
      }
    ]);

    // Create analytics
    const analytics = await Analytics.create([
      {
        period: 'daily',
        date: new Date('2025-01-22'),
        revenue: 6842.00,
        orders: 142,
        avgOrderValue: 48.18,
        customerSatisfaction: 4.7,
        tableTurnover: 3.2,
        totalCustomers: 156,
        repeatCustomers: 89,
        averageWaitTime: 12,
        staffUtilization: 85,
        inventoryValue: 12500.00,
        wastePercentage: 3.5
      },
      {
        period: 'weekly',
        date: new Date('2025-01-20'),
        revenue: 45680.00,
        orders: 892,
        avgOrderValue: 51.21,
        customerSatisfaction: 4.6,
        tableTurnover: 3.1,
        totalCustomers: 1023,
        repeatCustomers: 567,
        averageWaitTime: 14,
        staffUtilization: 82,
        inventoryValue: 11800.00,
        wastePercentage: 3.2
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Created ${teamMembers.length} team members`);
    console.log(`📦 Created ${inventoryItems.length} inventory items`);
    console.log(`📅 Created ${shifts.length} shifts`);
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