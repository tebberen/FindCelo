import { NextRequest, NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const apiKey = process.env.NEYNAR_API_KEY || '';
const signerUuid = process.env.NEYNAR_SIGNER_UUID || '';

const client = new NeynarAPIClient({
  apiKey: apiKey,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    if (action === 'fetch-user-by-address') {
      const address = searchParams.get('address');
      if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 });

      const response = await client.fetchBulkUsersByEthOrSolAddress({ addresses: [address] });
      return NextResponse.json(response[address.toLowerCase()] || null);
    }

    if (action === 'fetch-bulk-users') {
      const addressesStr = searchParams.get('addresses');
      if (!addressesStr) return NextResponse.json({ error: 'Addresses required' }, { status: 400 });

      const addresses = addressesStr.split(',');
      const response = await client.fetchBulkUsersByEthOrSolAddress({ addresses });
      return NextResponse.json(response);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Neynar API GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'post-cast') {
      const { text, embeds } = body;
      if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });
      if (!signerUuid) return NextResponse.json({ error: 'Signer UUID not configured' }, { status: 500 });

      const response = await client.publishCast({
        signerUuid,
        text,
        embeds: embeds?.map((url: string) => ({ url }))
      });
      return NextResponse.json(response);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Neynar API POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
