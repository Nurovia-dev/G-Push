import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    available: !!process.env.GITHUB_CLIENT_ID,
  });
}