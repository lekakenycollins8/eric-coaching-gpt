import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export const dynamic = 'force-dynamic';
