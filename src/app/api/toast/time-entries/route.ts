import { NextRequest, NextResponse } from 'next/server';
import ToastAPIClient from '@/lib/services/toast-api-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantGuid = searchParams.get('restaurantGuid');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!restaurantGuid || !startDate || !endDate) {
    return NextResponse.json({
      error: 'restaurantGuid, startDate, and endDate are required',
    }, { status: 400 });
  }

  try {
    const toastClient = new ToastAPIClient();
    const timeEntries = await toastClient.getTimeEntries(restaurantGuid, startDate, endDate);
    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error('Failed to get time entries:', error);
    return NextResponse.json({
      error: 'Failed to retrieve time entries',
    }, { status: 500 });
  }
}
