import { NextRequest, NextResponse } from 'next/server';
import { saveAddressFidMapping } from '@/src/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const { address, fid } = await req.json();

    if (!address || !fid) {
      return NextResponse.json({ error: 'Missing address or fid' }, { status: 400 });
    }

    saveAddressFidMapping(address, fid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in user registration:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
