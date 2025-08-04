import { NextRequest, NextResponse } from 'next/server';
import ToastCompleteAPI from '@/lib/services/toast-complete-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantGuid = searchParams.get('restaurantGuid');
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    if (!restaurantGuid) {
      return NextResponse.json({
        error: 'restaurantGuid is required',
      }, { status: 400 });
    }

    const toastAPI = new ToastCompleteAPI();
    const analytics = await toastAPI.getAnalytics(restaurantGuid, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Analytics failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}