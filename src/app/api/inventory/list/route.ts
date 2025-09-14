import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { InventoryItem } from "@/lib/models/InventoryItem";
import { isDemoMode, isDemoStubsEnabled } from "@/lib/config/demo";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 REST API: Starting inventory list fetch...');
    if (isDemoMode() && isDemoStubsEnabled()) {
      const withStatus = (it: any) => {
        const stock = it.currentStock;
        const min = it.minThreshold;
        let status = 'normal';
        if (stock <= 0) status = 'out_of_stock';
        else if (stock <= min) status = 'critical';
        else if (stock <= min * 1.5) status = 'low';
        return { ...it, status };
      };
      const itemsBase = [
        { id: 'i1', name: 'Chicken Breast', category: 'Proteins', currentStock: 25, minThreshold: 30, unit: 'lbs', costPerUnit: 3.5, supplier: 'Fresh Foods Co.', syscoSKU: 'SYS-1001', vendorSKU: 'VEND-1001', createdAt: new Date(), notes: '' },
        { id: 'i2', name: 'Organic Tomatoes', category: 'Vegetables', currentStock: 15, minThreshold: 20, unit: 'lbs', costPerUnit: 2.25, supplier: 'Local Farm Market', syscoSKU: 'SYS-2001', vendorSKU: 'VEND-2001', createdAt: new Date(), notes: '' },
        { id: 'i3', name: 'Heavy Cream', category: 'Dairy', currentStock: 8, minThreshold: 10, unit: 'quarts', costPerUnit: 4.75, supplier: 'Dairy Delights', syscoSKU: 'SYS-3001', vendorSKU: 'VEND-3001', createdAt: new Date(), notes: '' },
      ];
      const items = itemsBase.map(withStatus);
      const criticalCount = items.filter(i => i.status === 'critical').length;
      return NextResponse.json({ success: true, total: items.length, recentCount: items.length, items, criticalCount });
    }
    await connectDB();
    console.log('✅ REST API: Database connected');
    
    // Get all inventory items
    const items = await InventoryItem.find({}).sort({ createdAt: -1 });
    console.log(`📦 REST API: Found ${items.length} inventory items`);
    
    // Log first few items for debugging
    if (items.length > 0) {
      console.log('🔍 REST API: First 3 items:', items.slice(0, 3).map(item => ({
        id: item._id,
        name: item.name,
        syscoSKU: item.syscoSKU,
        supplier: item.supplier,
        createdAt: item.createdAt
      })));
    }
    
    // Get items created in last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentItems = await InventoryItem.find({
      createdAt: { $gte: yesterday }
    }).sort({ createdAt: -1 });
    
    console.log(`🕐 REST API: ${recentItems.length} items created in last 24 hours`);
    
    return NextResponse.json({
      success: true,
      total: items.length,
      recentCount: recentItems.length,
      items: items.map(item => ({
        id: item._id,
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        minThreshold: item.minThreshold,
        unit: item.unit,
        costPerUnit: item.costPerUnit,
        supplier: item.supplier,
        syscoSKU: item.syscoSKU,
        vendorSKU: item.vendorSKU,
        createdAt: item.createdAt,
        notes: item.notes
      }))
    });
  } catch (error) {
    console.error('❌ REST API: Error fetching inventory items:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 });
  }
}