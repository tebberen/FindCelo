import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received Farcaster Notification Webhook:', body);

    // In a real app, you would save the notification token and URL to a database here
    // body.notificationToken
    // body.url

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Farcaster Webhook:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
