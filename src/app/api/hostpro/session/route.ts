import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import HostSession from '@/lib/models/HostSession';
import { getPreset } from '@/lib/host/presets';

export async function GET() {
  await connectDB();
  const live = await HostSession.findOne({ status: 'live' }).sort({ startedAt: -1 }).lean();
  return NextResponse.json({ success: true, data: live || null });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const { presetSlug, servers } = body || {};
  const preset = getPreset(String(presetSlug || '3-plus-2-bar'));
  if (!preset) return NextResponse.json({ success: false, error: 'Preset not found' }, { status: 400 });
  // End any live session
  await HostSession.updateMany({ status: 'live' }, { $set: { status: 'ended', endedAt: new Date() } });
  const rotation = { isLive: false, order: (servers || []).map((s: any) => String(s.id)), pointer: 0 };
  const doc = await HostSession.create({
    presetSlug: preset.slug,
    presetName: preset.name,
    servers: servers || [],
    assignments: [],
    tableOccupied: {},
    seatings: [],
    startedAt: new Date(),
    status: 'live',
    rotation,
  });
  return NextResponse.json({ success: true, data: doc });
}

export async function PUT(req: NextRequest) {
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const { rotation, assignments, tableOccupied, seatings } = body || {};
  const live = await HostSession.findOne({ status: 'live' });
  if (!live) return NextResponse.json({ success: false, error: 'No live session' }, { status: 404 });
  if (rotation) live.rotation = rotation;
  if (assignments) live.assignments = assignments;
  if (tableOccupied) live.tableOccupied = tableOccupied;
  if (seatings) live.seatings = seatings;
  await live.save();
  return NextResponse.json({ success: true, data: live });
}

export async function DELETE() {
  await connectDB();
  const live = await HostSession.findOne({ status: 'live' });
  if (!live) return NextResponse.json({ success: true, data: null });
  live.status = 'ended';
  live.endedAt = new Date();
  await live.save();
  return NextResponse.json({ success: true, data: live });
}


