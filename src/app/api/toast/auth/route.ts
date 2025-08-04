import { NextRequest, NextResponse } from 'next/server';
import ToastAuthService from '@/lib/services/toast-auth';

export async function POST(request: NextRequest) {
  try {
    const authService = ToastAuthService.getInstance();
    
    // Test authentication
    const token = await authService.getAccessToken();
    
    return NextResponse.json({
      success: true,
      authenticated: true,
      message: 'Toast authentication successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Toast authentication test failed:', error);
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: error instanceof Error ? error.message : 'Authentication failed',
      timestamp: new Date().toISOString(),
    }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authService = ToastAuthService.getInstance();
    
    // Check if currently authenticated
    const isAuthenticated = authService.isAuthenticated();
    
    return NextResponse.json({
      authenticated: isAuthenticated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Toast authentication check failed:', error);
    
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authService = ToastAuthService.getInstance();
    
    // Logout and clear tokens
    authService.logout();
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Toast logout failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}