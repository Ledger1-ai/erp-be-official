import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import HostSession from '@/lib/models/HostSession';

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const { serverId, tableId, partySize, advancePointer } = body || {};
  const live = await HostSession.findOne({ status: 'live' });
  if (!live) return NextResponse.json({ success: false, error: 'No live session' }, { status: 404 });
  // Reserve the table
  live.tableOccupied[tableId] = true;
  const seatId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  live.seatings.push({ id: seatId, serverId, tableId, partySize: Number(partySize || 0), startedAt: new Date(), status: 'seated' });
  // Advance rotation pointer if live
  const shouldAdvance = (advancePointer === undefined ? true : Boolean(advancePointer));
  if (shouldAdvance && Array.isArray(live.rotation?.order) && live.rotation.order.length) {
    live.rotation.pointer = (live.rotation.pointer + 1) % live.rotation.order.length;
  }
  await live.save();
  return NextResponse.json({ success: true, data: live });
}


