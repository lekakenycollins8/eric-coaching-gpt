import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Eric GPT Coaching API Server',
    version: '1.0.0',
    documentation: '/api/swagger'
  });
}

export const dynamic = 'force-dynamic';
