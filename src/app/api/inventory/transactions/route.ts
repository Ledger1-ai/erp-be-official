import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { InventoryTransaction } from "@/lib/models/InventoryTransaction";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || 'daily'; // daily, weekly, yearly
    const itemId = searchParams.get('itemId');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Build query
    const query: any = {};
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }
    if (itemId) {
      query.inventoryItem = itemId;
    }

    // Fetch transactions
    const transactions = await InventoryTransaction.find(query)
      .populate('inventoryItem', 'name category unit')
      .sort({ createdAt: 1 });

    // Group transactions by period
    const groupedData = groupTransactionsByPeriod(transactions, period);

    // Calculate movement data
    const movementData = calculateMovementData(groupedData, period);

    return NextResponse.json({
      success: true,
      data: movementData,
      period,
      totalTransactions: transactions.length,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function groupTransactionsByPeriod(transactions: any[], period: string) {
  const groups: { [key: string]: any[] } = {};

  transactions.forEach(transaction => {
    let key = '';
    const date = new Date(transaction.createdAt);

    switch (period) {
      case 'daily':
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'yearly':
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(transaction);
  });

  return groups;
}

function calculateMovementData(groupedData: { [key: string]: any[] }, period: string) {
  const movementData = Object.entries(groupedData).map(([dateKey, transactions]) => {
    const date = new Date(dateKey);
    
    // Calculate totals for different transaction types
    const received = transactions
      .filter(t => ['purchase', 'receiving', 'transfer_in', 'production'].includes(t.transactionType))
      .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

    const usage = transactions
      .filter(t => ['sale', 'consumption', 'waste', 'transfer_out'].includes(t.transactionType))
      .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

    const adjustments = transactions
      .filter(t => ['adjustment', 'count_adjustment'].includes(t.transactionType))
      .reduce((sum, t) => sum + t.quantity, 0);

    const totalValue = transactions.reduce((sum, t) => sum + Math.abs(t.totalCost), 0);

    // Format date based on period
    let displayDate = '';
    switch (period) {
      case 'daily':
        displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        break;
      case 'weekly':
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + 6);
        displayDate = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        break;
      case 'yearly':
        displayDate = date.getFullYear().toString();
        break;
      default:
        displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return {
      date: displayDate,
      dateKey,
      received,
      usage,
      adjustments,
      totalValue,
      netMovement: received - usage + adjustments,
      transactionCount: transactions.length
    };
  });

  // Sort by date
  return movementData.sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());
}