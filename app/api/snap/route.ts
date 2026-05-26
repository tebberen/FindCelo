import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://find-celo.vercel.app';
const CELO_YELLOW = "#FCFF52";
const LOGO_URL = `${BASE_URL}/images/logo.png?v=5`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accept = request.headers.get('accept') ?? '';

  // Return Snap JSON only if requested
  if (!accept.includes('application/vnd.farcaster.snap+json')) {
    return NextResponse.redirect(BASE_URL);
  }

  const snap = {
    version: "2.0",
    theme: {
      accent: CELO_YELLOW
    },
    ui: {
      root: "main",
      elements: {
        main: {
          type: "stack",
          props: {
            direction: "vertical",
            gap: "md",
            align: "center"
          },
          children: ["banner", "title", "tier_row", "land_label", "land_row_1", "land_row_2"]
        },
        banner: {
          type: "image",
          props: {
            src: LOGO_URL,
            aspectRatio: "1:1"
          }
        },
        title: {
          type: "text",
          props: {
            content: "🏝️ FindCelo Treasure Island",
            weight: "bold",
            size: "lg",
            align: "center"
          }
        },
        tier_row: {
          type: "stack",
          props: {
            direction: "horizontal",
            gap: "sm"
          },
          children: ["btn_tier_0", "btn_tier_1", "btn_tier_2"]
        },
        btn_tier_0: {
          type: "button",
          props: { label: "1 CELO", variant: "primary" },
          on: { press: { action: "open_mini_app", params: { target: `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?tier=0` } } }
        },
        btn_tier_1: {
          type: "button",
          props: { label: "5 CELO", variant: "primary" },
          on: { press: { action: "open_mini_app", params: { target: `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?tier=1` } } }
        },
        btn_tier_2: {
          type: "button",
          props: { label: "10 CELO", variant: "primary" },
          on: { press: { action: "open_mini_app", params: { target: `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?tier=2` } } }
        },
        land_label: {
          type: "text",
          props: {
            content: "Select a Land:",
            weight: "bold",
            size: "md"
          }
        },
        land_row_1: {
          type: "stack",
          props: {
            direction: "horizontal",
            gap: "sm"
          },
          children: ["btn_land_1", "btn_land_2", "btn_land_3"]
        },
        btn_land_1: {
          type: "button",
          props: { label: "LAND 1" },
          on: { press: { action: "open_mini_app", params: { target: `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?land=1` } } }
        },
        btn_land_2: {
          type: "button",
          props: { label: "LAND 2" },
          on: { press: { action: "open_mini_app", params: { target: `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?land=2` } } }
        },
        btn_land_3: {
          type: "button",
          props: { label: "LAND 3" },
          on: { press: { action: "open_mini_app", params: { target: `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?land=3` } } }
        },
        land_row_2: {
          type: "stack",
          props: {
            direction: "horizontal",
            gap: "sm"
          },
          children: ["btn_land_4", "btn_land_5", "btn_land_6"]
        },
        btn_land_4: {
          type: "button",
          props: { label: "LAND 4" },
          on: { press: { action: "open_mini_app", params: { target: `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?land=4` } } }
        },
        btn_land_5: {
          type: "button",
          props: { label: "LAND 5" },
          on: { press: { action: "open_mini_app", params: { target: `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?land=5` } } }
        },
        btn_land_6: {
          type: "button",
          props: { label: "LAND 6" },
          on: { press: { action: "open_mini_app", params: { target: `https://farcaster.xyz/miniapps/11ftF6b53u7y/findcelo?land=6` } } }
        }
      }
    }
  };

  return new NextResponse(JSON.stringify(snap), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.farcaster.snap+json",
      "Cache-Control": "public, max-age=60"
    }
  });
}
