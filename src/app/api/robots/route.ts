import { NextRequest, NextResponse } from 'next/server';
import { bearCloudGRPC } from '@/lib/services/bear-cloud-grpc';

export async function GET(request: NextRequest) {
  try {
    console.log('📡 API Route: Getting all robots via gRPC');
    
    // Test if gRPC client can initialize
    const testResult = await bearCloudGRPC.testAuthentication();
    console.log('🔐 gRPC authentication test result:', testResult);
    
    const robots = await bearCloudGRPC.getAllRobots();
    console.log('🤖 Retrieved robots:', robots.length);
    
    return NextResponse.json({
      success: true,
      data: robots,
      count: robots.length,
      authenticated: testResult
    });
  } catch (error) {
    console.error('❌ API Route error getting robots:', error);
    console.error('❌ Full error details:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch robots',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}