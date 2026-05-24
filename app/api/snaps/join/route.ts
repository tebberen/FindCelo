import { NextRequest, NextResponse } from 'next/server';
import { getAllTablesStatus } from '@/src/lib/game';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://find-celo.vercel.app';
const CELO_YELLOW = "#FCFF52";
const OG_IMAGE_URL = `${BASE_URL}/images/logo.png`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type, Authorization, X-Requested-With',
  'Access-Control-Expose-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const accept = req.headers.get('accept') ?? '';
  if (!accept.includes('application/vnd.farcaster.snap+json')) {
    return NextResponse.redirect(BASE_URL);
  }

  try {
    const tablesStatus = await getAllTablesStatus();
    // We'll show a summary of the most active table as requested by the "e.g. 3/6 players joined"
    const mostFilled = Math.max(tablesStatus.bronze, tablesStatus.silver, tablesStatus.gold);
    const statusText = `${mostFilled}/6 players joined in active lobby`;

    const snapPayload = {
      version: "2.0",
      theme: { accent: CELO_YELLOW },
      ui: {
        root: "main",
        elements: {
          main: {
            type: "stack",
            props: { direction: "vertical", gap: "md" },
            children: ["banner", "title", "status", "table_select", "join_btn", "open_btn"]
          },
          banner: { type: "image", props: { src: OG_IMAGE_URL, aspectRatio: "1.91:1" } },
          title: {
            type: "text",
            props: { content: "FindCelo — Treasure Island 🏝️", weight: "bold", size: "lg" }
          },
          status: {
            type: "text",
            props: { content: statusText, size: "md" }
          },
          table_select: {
            type: "toggle_group",
            props: {
              name: "table",
              options: [
                { label: "1 CELO", value: "1 CELO" },
                { label: "5 CELO", value: "5 CELO" },
                { label: "10 CELO", value: "10 CELO" }
              ],
              defaultValue: "1 CELO"
            }
          },
          join_btn: {
            type: "button",
            props: { label: "Join Game", variant: "primary" },
            on: { press: { action: "submit", params: { target: `${BASE_URL}/api/snaps/join` } } }
          },
          open_btn: {
            type: "button",
            props: { label: "Open App" },
            on: { press: { action: "open_mini_app", params: { target: "https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo" } } }
          }
        }
      }
    };

    return new NextResponse(JSON.stringify(snapPayload), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.farcaster.snap+json',
        'Vary': 'Accept',
      },
    });
  } catch (error) {
    console.error('Join snap error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(req: NextRequest) {
  const accept = req.headers.get('accept') ?? '';
  if (!accept.includes('application/vnd.farcaster.snap+json')) {
    return NextResponse.redirect(BASE_URL);
  }

  try {
    const body = await req.json();
    const selectedTable = body.untrustedData?.fields?.table || "1 CELO";

    // Map "1 CELO" -> 0, "5 CELO" -> 1, "10 CELO" -> 2
    let tier = 0;
    if (selectedTable === "5 CELO") tier = 1;
    if (selectedTable === "10 CELO") tier = 2;

    const snapPayload = {
      version: "2.0",
      theme: { accent: CELO_YELLOW },
      ui: {
        root: "main",
        elements: {
          main: {
            type: "stack",
            props: { direction: "vertical", gap: "md", align: "center" },
            children: ["banner", "success_title", "confirmation_text", "open_app_btn"]
          },
          banner: { type: "image", props: { src: OG_IMAGE_URL, aspectRatio: "1.91:1" } },
          success_title: {
            type: "text",
            props: { content: "Selection Confirmed!", weight: "bold", size: "lg", align: "center" }
          },
          confirmation_text: {
            type: "text",
            props: { content: `You picked the ${selectedTable} table! Open the app to complete your entry.`, align: "center" }
          },
          open_app_btn: {
            type: "button",
            props: { label: "Open FindCelo", variant: "primary" },
            on: { press: { action: "open_mini_app", params: { target: `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?tier=${tier}` } } }
          }
        }
      }
    };

    return new NextResponse(JSON.stringify(snapPayload), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.farcaster.snap+json',
        'Vary': 'Accept',
      },
    });
  } catch (error) {
    console.error('Join snap POST error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
