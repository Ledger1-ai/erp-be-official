import { NextRequest, NextResponse } from 'next/server';
import { bearCloudGRPC } from '@/lib/services/bear-cloud-grpc';

export async function GET(request: NextRequest) {
  try {
    console.log('📡 API Route: Getting all robots via gRPC');
    
    const robots = await bearCloudGRPC.getAllRobots();
    
    return NextResponse.json({
      success: true,
      data: robots,
      count: robots.length
    });
  } catch (error) {
    console.error('❌ API Route error getting robots:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch robots',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}