import { NextRequest, NextResponse } from 'next/server';
import ToastCompleteAPI from '@/lib/services/toast-complete-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantGuid = searchParams.get('restaurantGuid');

    if (!restaurantGuid) {
      return NextResponse.json({
        error: 'restaurantGuid is required',
      }, { status: 400 });
    }

    const toastAPI = new ToastCompleteAPI();
    const menuItems = await toastAPI.getMenuItems(restaurantGuid);

    return NextResponse.json({
      success: true,
      data: menuItems,
      count: menuItems.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Menus API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Menu fetch failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}