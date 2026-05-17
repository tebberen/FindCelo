import { NextRequest, NextResponse } from 'next/server';
import { getAllTablesStatus, getTotalDistributed, getTableData } from '@/src/lib/game';

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
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const user = searchParams.get('user') || '';
  const amount = searchParams.get('amount') || '0';
  const tier = searchParams.get('tier');
  const land = searchParams.get('land');

  let snapResponse;

  try {
    if (type === 'win') {
      snapResponse = renderWinSnap(user, amount);
    } else if (type === 'referral') {
      snapResponse = renderReferralSnap(user);
    } else if (type === 'filling') {
      snapResponse = await renderFillingSnap(tier);
    } else if (type === 'loss') {
      snapResponse = renderLossSnap(land || '?');
    } else if (tier !== null) {
      snapResponse = await renderTierView(Number(tier));
    } else {
      snapResponse = await renderDefaultSnap();
    }

    return new NextResponse(JSON.stringify(snapResponse), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.farcaster.snap+json',
      },
    });
  } catch (error) {
    console.error('Snap error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
}

function renderWinSnap(user: string, amount: string) {
  const userDisplay = user.startsWith('0x') ? `${user.slice(0, 6)}...${user.slice(-4)}` : (user.startsWith('@') ? user : `@${user}`);
  return {
    version: "2.0",
    theme: { accent: CELO_YELLOW },
    ui: {
      root: "main",
      elements: {
        main: {
          type: "stack",
          props: { gap: "md", align: "center" },
          children: ["banner", "icon", "title", "description", "button"],
        },
        banner: { type: "image", props: { src: OG_IMAGE_URL, aspectRatio: "1.91:1" } },
        icon: { type: "text", props: { content: "🏆", size: "lg" } },
        title: { type: "text", props: { content: "New Treasure Winner!", weight: "bold", size: "lg", align: "center" } },
        description: { type: "text", props: { content: `${userDisplay} just won ${amount} CELO on FindCelo!`, align: "center" } },
        button: {
          type: "button",
          props: { label: "🏝️ Play Now", variant: "primary" },
          on: { press: { action: "open_mini_app", params: { target: `${BASE_URL}/?ref=${user}` } } },
        }
      }
    }
  };
}

function renderLossSnap(land: string) {
  return {
    version: "2.0",
    theme: { accent: CELO_YELLOW },
    ui: {
      root: "main",
      elements: {
        main: {
          type: "stack",
          props: { gap: "md", align: "center" },
          children: ["banner", "icon", "title", "description", "button"],
        },
        banner: { type: "image", props: { src: OG_IMAGE_URL, aspectRatio: "1.91:1" } },
        icon: { type: "text", props: { content: "💀", size: "lg" } },
        title: { type: "text", props: { content: "Treasure Found!", weight: "bold", size: "lg", align: "center" } },
        description: { type: "text", props: { content: `The treasure was hidden in Land #${land}. Better luck next time!`, align: "center" } },
        button: {
          type: "button",
          props: { label: "🏝️ Try Again", variant: "primary" },
          on: { press: { action: "open_mini_app", params: { target: `${BASE_URL}` } } },
        }
      }
    }
  };
}

function renderReferralSnap(user: string) {
  const userDisplay = user.startsWith('0x') ? `${user.slice(0, 6)}...${user.slice(-4)}` : (user.startsWith('@') ? user : `@${user}`);
  return {
    version: "2.0",
    theme: { accent: CELO_YELLOW },
    ui: {
      root: "main",
      elements: {
        main: {
          type: "stack",
          props: { gap: "md", align: "center" },
          children: ["banner", "icon", "title", "description", "button"],
        },
        banner: { type: "image", props: { src: OG_IMAGE_URL, aspectRatio: "1.91:1" } },
        icon: { type: "text", props: { content: "🎁", size: "lg" } },
        title: { type: "text", props: { content: "Referral Bonus!", weight: "bold", size: "lg", align: "center" } },
        description: { type: "text", props: { content: `${userDisplay} joined FindCelo using your link! You earned +5 XP.`, align: "center" } },
        button: {
          type: "button",
          props: { label: "🏝️ View Profile", variant: "primary" },
          on: { press: { action: "open_mini_app", params: { target: `${BASE_URL}/profile` } } },
        }
      }
    }
  };
}

async function renderFillingSnap(tierStr: string | null) {
  const tier = tierStr ? parseInt(tierStr) : 0;
  const { seatsFilled } = await getTableData(tier);
  const tierNames = ["1 CELO", "5 CELO", "10 CELO"];
  const name = tierNames[tier] || "1 CELO";
  const remaining = 6 - seatsFilled;

  return {
    version: "2.0",
    theme: { accent: CELO_YELLOW },
    ui: {
      root: "main",
      elements: {
        main: {
          type: "stack",
          props: { gap: "md", align: "center" },
          children: ["banner", "icon", "title", "description", "button"],
        },
        banner: { type: "image", props: { src: OG_IMAGE_URL, aspectRatio: "1.91:1" } },
        icon: { type: "text", props: { content: "🔥", size: "lg" } },
        title: { type: "text", props: { content: "Game is filling up!", weight: "bold", size: "lg", align: "center" } },
        description: { type: "text", props: { content: `The ${name} table has only ${remaining} land${remaining === 1 ? '' : 's'} left! Join now.`, align: "center" } },
        button: {
          type: "button",
          props: { label: "🏝️ Join Game", variant: "primary" },
          on: { press: { action: "open_mini_app", params: { target: `${BASE_URL}/?tier=${tier}` } } },
        }
      }
    }
  };
}

async function renderDefaultSnap() {
  const [tablesStatus, totalDistributed] = await Promise.all([
    getAllTablesStatus(),
    getTotalDistributed(),
  ]);

  return {
    version: "2.0",
    theme: { accent: CELO_YELLOW },
    ui: {
      root: "main",
      elements: {
        main: {
          type: "stack",
          props: { gap: "md" },
          children: ["banner", "title", "stats", "buttons"],
        },
        banner: { type: "image", props: { src: OG_IMAGE_URL, aspectRatio: "1.91:1" } },
        title: { type: "text", props: { content: "🏝️ Find the Celo Treasure", weight: "bold", size: "lg", align: "center" } },
        stats: {
          type: "item_group",
          props: { border: true, separator: true },
          children: ["bronze_stat", "silver_stat", "gold_stat", "total_dist"],
        },
        bronze_stat: { type: "item", props: { title: "1 CELO Table", description: `Lands filled: ${tablesStatus.bronze}/6` } },
        silver_stat: { type: "item", props: { title: "5 CELO Table", description: `Lands filled: ${tablesStatus.silver}/6` } },
        gold_stat: { type: "item", props: { title: "10 CELO Table", description: `Lands filled: ${tablesStatus.gold}/6` } },
        total_dist: { type: "item", props: { title: "Total Prizes", description: `${totalDistributed} CELO distributed` } },
        buttons: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["join_bronze", "join_silver", "join_gold"],
        },
        join_bronze: {
          type: "button",
          props: { label: "1 CELO", variant: "primary" },
          on: { press: { action: "submit", params: { target: `${BASE_URL}/api/snap?tier=0` } } },
        },
        join_silver: {
          type: "button",
          props: { label: "5 CELO", variant: "primary" },
          on: { press: { action: "submit", params: { target: `${BASE_URL}/api/snap?tier=1` } } },
        },
        join_gold: {
          type: "button",
          props: { label: "10 CELO", variant: "primary" },
          on: { press: { action: "submit", params: { target: `${BASE_URL}/api/snap?tier=2` } } },
        },
      }
    }
  };
}

async function renderTierView(tier: number) {
  const tierNames = ["1 CELO", "5 CELO", "10 CELO"];
  const name = tierNames[tier] || "Unknown";
  const { tablePlayers, seatsFilled } = await getTableData(tier);

  const cells = [];
  for (let i = 1; i <= 6; i++) {
    const player = tablePlayers[i - 1];
    const isOccupied = player && player !== '0x0000000000000000000000000000000000000000';
    cells.push({
      row: 0,
      col: i - 1,
      color: isOccupied ? "#6E6A86" : CELO_YELLOW,
      content: i.toString(),
    });
  }

  return {
    version: "2.0",
    theme: { accent: CELO_YELLOW },
    ui: {
      root: "tier_page",
      elements: {
        tier_page: {
          type: "stack",
          props: { gap: "md" },
          children: ["banner", "tier_title", "grid", "play_btn", "back_btn"]
        },
        banner: { type: "image", props: { src: OG_IMAGE_URL, aspectRatio: "1.91:1" } },
        tier_title: { type: "text", props: { content: `🏝️ ${name} Table (${seatsFilled}/6 filled)`, weight: "bold", size: "lg", align: "center" } },
        grid: {
          type: "cell_grid",
          props: { cols: 6, rows: 1, cells: cells, cellAspectRatio: "square", select: "off" },
        },
        play_btn: {
          type: "button",
          props: { label: "Join & Play Now", variant: "primary" },
          on: { press: { action: "open_mini_app", params: { target: `${BASE_URL}/?tier=${tier}` } } }
        },
        back_btn: {
          type: "button",
          props: { label: "← Back to Tiers" },
          on: { press: { action: "submit", params: { target: `${BASE_URL}/api/snap` } } }
        }
      }
    }
  };
}
