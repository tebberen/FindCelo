import { NextRequest, NextResponse } from 'next/server';
import { saveFidTokenMapping } from '@/src/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received Farcaster Notification Webhook:', body);

    const { fid, notificationToken, url } = body;

    if (fid && notificationToken && url) {
      saveFidTokenMapping(fid, notificationToken, url);
      console.log(`Stored notification token for FID ${fid}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Farcaster Webhook:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
