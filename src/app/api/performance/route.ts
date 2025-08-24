import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import PerformanceEntry from '@/lib/models/PerformanceEntry';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantGuid = searchParams.get('restaurantGuid');
    const employeeToastGuid = searchParams.get('employeeToastGuid');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!restaurantGuid) return NextResponse.json({ success: false, error: 'restaurantGuid required' }, { status: 400 });

    await connectDB();

    const filter: any = { restaurantGuid };
    if (employeeToastGuid) filter.employeeToastGuid = employeeToastGuid;
    if (start || end) {
      filter.createdAt = {} as any;
      if (start) (filter.createdAt as any).$gte = new Date(start);
      if (end) (filter.createdAt as any).$lte = new Date(end);
    }

    const entries = await PerformanceEntry.find(filter).sort({ createdAt: -1 }).limit(200);

    // Aggregate average rating per employee and flag counts by type
    const matchStage: any = filter;
    const agg = await PerformanceEntry.aggregate([
      { $match: matchStage },
      { $group: { _id: '$employeeToastGuid', avg: { $avg: '$rating' }, count: { $sum: { $cond: [{ $ifNull: ['$rating', false] }, 1, 0] } }, 
        flags: { $sum: { $cond: ['$isFlag', 1, 0] } },
        red: { $sum: { $cond: [ { $and: ['$isFlag', { $eq: ['$flagType', 'red'] }] }, 1, 0 ] } },
        yellow: { $sum: { $cond: [ { $and: ['$isFlag', { $eq: ['$flagType', 'yellow'] }] }, 1, 0 ] } },
        blue: { $sum: { $cond: [ { $and: ['$isFlag', { $eq: ['$flagType', 'blue'] }] }, 1, 0 ] } }
      } },
    ]);

    return NextResponse.json({ success: true, data: { entries, aggregates: agg } });
  } catch (err) {
    console.error('Performance GET error', err);
    return NextResponse.json({ success: false, error: 'Failed to load performance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantGuid, employeeToastGuid, rating, isFlag, flagType, details, createdBy } = body || {};
    if (!restaurantGuid || !employeeToastGuid || (!rating && !isFlag)) {
      return NextResponse.json({ success: false, error: 'restaurantGuid, employeeToastGuid and rating or isFlag required' }, { status: 400 });
    }

    await connectDB();
    const doc = await PerformanceEntry.create({ restaurantGuid, employeeToastGuid, rating, isFlag: !!isFlag, flagType: isFlag ? (flagType || 'blue') : null, details, createdBy });
    return NextResponse.json({ success: true, data: doc });
  } catch (err) {
    console.error('Performance POST error', err);
    return NextResponse.json({ success: false, error: 'Failed to create entry' }, { status: 500 });
  }
}


