import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { InventoryItem } from "@/lib/models/InventoryItem";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 REST API: Starting inventory list fetch...');
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