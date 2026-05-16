import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { registerSnapHandler } from '@farcaster/snap-hono';
import { getAllTablesStatus, getTotalDistributed, getLatestWinner, getTableData } from '@/src/lib/game';
import { CONTRACT_ADDRESS } from '@/src/constants';

const app = new Hono().basePath('/api/snap');

const BASE_URL = process.env.SNAP_PUBLIC_BASE_URL || 'https://find-celo.vercel.app';
const CELO_YELLOW = "#FCFF52";
const OG_IMAGE_URL = `${BASE_URL}/og-image.png`;

function getUrgencyText(filled: number) {
  if (filled === 5) return " 🔥 1 Land Left";
  if (filled >= 4) return " 🔥 Almost Full";
  return "";
}

registerSnapHandler(app, async (ctx) => {
  const url = new URL(ctx.request.url);
  const tier = url.searchParams.get('tier');

  if (tier !== null) {
    return renderTierView(Number(tier), BASE_URL);
  }

  // Initial View
  const [tablesStatus, totalDistributed, lastWinner] = await Promise.all([
    getAllTablesStatus(),
    getTotalDistributed(),
    getLatestWinner(),
  ]);

  const shortenedContract = `${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}`;
  const lastWinnerDisplay = lastWinner
    ? `${lastWinner.address.slice(0, 6)}...${lastWinner.address.slice(-4)} won ${lastWinner.prize} CELO`
    : 'No winners yet';

  return {
    version: "2.0" as const,
    theme: { accent: CELO_YELLOW as any },
    ui: {
      root: "main",
      elements: {
        main: {
          type: "stack",
          props: { gap: "md" },
          children: ["banner", "title", "subtitle", "stats", "buttons", "footer"],
        },
        banner: {
          type: "image",
          props: { src: OG_IMAGE_URL, aspectRatio: "1.91:1" }
        },
        title: {
          type: "text",
          props: { content: "🏝️ Find the Celo Treasure", weight: "bold", size: "lg" },
        },
        subtitle: {
          type: "text",
          props: { content: "Onchain game on Celo Mainnet", size: "sm" },
        },
        stats: {
          type: "item_group",
          props: { border: true, separator: true },
          children: ["bronze_stat", "silver_stat", "gold_stat", "total_dist", "last_winner"],
        },
        bronze_stat: {
          type: "item",
          props: { title: "1 CELO", description: `Win 5 CELO - Lands filled: ${tablesStatus.bronze}/6${getUrgencyText(tablesStatus.bronze)}` },
        },
        silver_stat: {
          type: "item",
          props: { title: "5 CELO", description: `Win 25 CELO - Lands filled: ${tablesStatus.silver}/6${getUrgencyText(tablesStatus.silver)}` },
        },
        gold_stat: {
          type: "item",
          props: { title: "10 CELO", description: `Win 50 CELO - Lands filled: ${tablesStatus.gold}/6${getUrgencyText(tablesStatus.gold)}` },
        },
        total_dist: {
          type: "item",
          props: { title: "Total Distributed", description: `${totalDistributed} CELO` },
        },
        last_winner: {
          type: "item",
          props: { title: "Last Winner", description: lastWinnerDisplay },
        },
        buttons: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["join_bronze", "join_silver", "join_gold"],
        },
        join_bronze: {
          type: "button",
          props: { label: "Join 1 CELO", variant: "primary" },
          on: { press: { action: "submit", params: { target: `${BASE_URL}/api/snap?tier=0` } } },
        },
        join_silver: {
          type: "button",
          props: { label: "Join 5 CELO", variant: "primary" },
          on: { press: { action: "submit", params: { target: `${BASE_URL}/api/snap?tier=1` } } },
        },
        join_gold: {
          type: "button",
          props: { label: "Join 10 CELO", variant: "primary" },
          on: { press: { action: "submit", params: { target: `${BASE_URL}/api/snap?tier=2` } } },
        },
        footer: {
          type: "text",
          props: { content: `Contract: ${shortenedContract}`, size: "sm", align: "center" },
        }
      },
    },
  };
});

async function renderTierView(tier: number, baseUrl: string) {
    const tierNames = ["1 CELO", "5 CELO", "10 CELO"];
    const tierCosts = ["1", "5", "10"];
    const name = tierNames[tier];
    const cost = tierCosts[tier];

    const { tablePlayers, seatsFilled } = await getTableData(tier);
    const remaining = 6 - seatsFilled;

    const cells = [];
    for (let i = 1; i <= 6; i++) {
        const isOccupied = tablePlayers[i] !== '0x0000000000000000000000000000000000000000';
        cells.push({
            row: 0,
            col: i - 1,
            color: isOccupied ? "#6E6A86" : CELO_YELLOW, // gray if occupied, yellow if free
            content: i.toString(),
            value: i.toString()
        });
    }

    return {
        version: "2.0" as const,
        theme: { accent: CELO_YELLOW as any },
        ui: {
            root: "tier_page",
            elements: {
                tier_page: {
                    type: "stack",
                    props: { gap: "md" },
                    children: ["banner", "tier_title", "status_row", "grid", "actions", "back_btn"]
                },
                banner: {
                  type: "image",
                  props: { src: OG_IMAGE_URL, aspectRatio: "1.91:1" }
                },
                tier_title: {
                    type: "text",
                    props: { content: `🏝️ ${name} Table`, weight: "bold", size: "lg" }
                },
                status_row: {
                    type: "stack",
                    props: { direction: "horizontal", justify: "between" },
                    children: ["filled_text", "remaining_text"]
                },
                filled_text: {
                    type: "text",
                    props: { content: `Filled: ${seatsFilled}/6`, size: "sm" }
                },
                remaining_text: {
                    type: "text",
                    props: { content: `Remaining: ${remaining}`, size: "sm" }
                },
                grid: {
                    type: "cell_grid",
                    props: {
                        cols: 6,
                        rows: 1,
                        cells: cells,
                        cellAspectRatio: "square",
                        select: "off"
                    },
                    on: {
                        press: { action: "open_url", params: { target: `${baseUrl}/?tier=${tier}` } }
                    }
                },
                actions: {
                    type: "stack",
                    props: { direction: "horizontal", gap: "sm" },
                    children: ["quick_pick", "play_onchain", "share"]
                },
                quick_pick: {
                    type: "button",
                    props: { label: "Quick Pick", icon: "refresh-cw" },
                    on: { press: { action: "open_url", params: { target: `${baseUrl}/?tier=${tier}&random=true` } } }
                },
                play_onchain: {
                    type: "button",
                    props: { label: "Play Onchain", variant: "primary" },
                    on: { press: { action: "open_mini_app", params: { target: `${baseUrl}/?tier=${tier}` } } }
                },
                share: {
                    type: "button",
                    props: { label: "Share", icon: "share" },
                    on: {
                        press: {
                            action: "compose_cast",
                            params: { text: "I’m hunting treasure on Celo 🏝️ 5x upside if I win.", embeds: [baseUrl] }
                        }
                    }
                },
                back_btn: {
                    type: "button",
                    props: { label: "← Back to Tiers" },
                    on: { press: { action: "submit", params: { target: `${baseUrl}/api/snap` } } }
                }
            }
        }
    };
}

export const GET = handle(app);
export const POST = handle(app);
