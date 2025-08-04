import { NextRequest, NextResponse } from 'next/server';
import ToastAPIClient from '@/lib/services/toast-api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantGuid = searchParams.get('restaurantGuid');

    const toastClient = new ToastAPIClient();

    if (restaurantGuid) {
      // Get specific restaurant
      const restaurant = await toastClient.getRestaurant(restaurantGuid);
      
      return NextResponse.json({
        success: true,
        data: restaurant,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Get all connected restaurants
      const restaurants = await toastClient.getConnectedRestaurants();
      
      return NextResponse.json({
        success: true,
        data: restaurants.data,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Toast restaurants API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch restaurants',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}