import { NextRequest, NextResponse } from 'next/server';
import ToastCompleteAPI from '@/lib/services/toast-complete-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantGuid = searchParams.get('restaurantGuid');
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    if (!restaurantGuid) {
      return NextResponse.json({
        error: 'restaurantGuid is required',
      }, { status: 400 });
    }

    const toastAPI = new ToastCompleteAPI();
    const orders = await toastAPI.getOrders(restaurantGuid, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Orders API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Orders fetch failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}