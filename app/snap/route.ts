import { NextRequest, NextResponse } from 'next/server'
import { getTableData, getLatestWinner } from '@/src/lib/game'
import { TABLE_TYPES, TABLE_COSTS } from '@/src/constants'

const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const table = searchParams.get('table') || 'BRONZE'
    const tableIndex = (TABLE_TYPES as any)[table.toUpperCase()] || 0
    const tableCost = (TABLE_COSTS as any)[tableIndex]

    const { tablePlayers, seatsFilled } = await getTableData(tableIndex)
    const latestWinner = await getLatestWinner()

    const potSize = Number(tableCost) * seatsFilled

    const snapResponse = {
        version: "2.0",
        theme: { accent: "orange" },
        ui: {
            root: "page",
            elements: {
                "page": {
                    "type": "stack",
                    "props": { "gap": "md", "padding": "md" },
                    "children": ["header", "pot-card", "lands-label", "lands-row1", "lands-row2", "table-selector", "footer"]
                },
                "header": {
                    "type": "text",
                    "props": { "content": "🪎 FINDCELO - 🏝️ Treasure Island", "weight": "bold", "align": "center", "size": "md" }
                },
                "pot-card": {
                    "type": "item",
                    "props": {
                        "title": `Pot: ${potSize} CELO`,
                        "description": `${seatsFilled}/6 players joined. Winner gets ${(Number(tableCost) * 5).toFixed(1)} CELO!`
                    },
                    "children": ["pot-badge"]
                },
                "pot-badge": {
                    "type": "badge",
                    "props": { "label": "💰", "color": "orange" }
                },
                "lands-label": {
                    "type": "text",
                    "props": { "content": "Select a land to join:", "size": "sm", "weight": "bold" }
                },
                "lands-row1": {
                    "type": "stack",
                    "props": { "direction": "horizontal", "gap": "sm" },
                    "children": ["land-1", "land-2", "land-3"]
                },
                "lands-row2": {
                    "type": "stack",
                    "props": { "direction": "horizontal", "gap": "sm" },
                    "children": ["land-4", "land-5", "land-6"]
                },
                ...Object.fromEntries([1, 2, 3, 4, 5, 6].map(i => {
                    const player = tablePlayers[i];
                    const isOccupied = player && player !== '0x0000000000000000000000000000000000000000';
                    return [`land-${i}`, {
                        "type": "button",
                        "props": {
                            "label": `${i} ${isOccupied ? '🚩' : '⛺'}`,
                            "variant": isOccupied ? "secondary" : "primary"
                        },
                        "on": {
                            "press": {
                                "action": "open_mini_app",
                                "params": { "target": `${NEXT_PUBLIC_URL}?table=${table}&land=${i}` }
                            }
                        }
                    }]
                })),
                "table-selector": {
                    "type": "stack",
                    "props": { "direction": "horizontal", "gap": "sm" },
                    "children": ["btn-bronze", "btn-silver", "btn-gold"]
                },
                "btn-bronze": {
                    "type": "button",
                    "props": { "label": "1 CELO", "variant": table === 'BRONZE' ? "primary" : "secondary" },
                    "on": { "press": { "action": "submit", "params": { "target": `${NEXT_PUBLIC_URL}/snap?table=BRONZE` } } }
                },
                "btn-silver": {
                    "type": "button",
                    "props": { "label": "5 CELO", "variant": table === 'SILVER' ? "primary" : "secondary" },
                    "on": { "press": { "action": "submit", "params": { "target": `${NEXT_PUBLIC_URL}/snap?table=SILVER` } } }
                },
                "btn-gold": {
                    "type": "button",
                    "props": { "label": "10 CELO", "variant": table === 'GOLD' ? "primary" : "secondary" },
                    "on": { "press": { "action": "submit", "params": { "target": `${NEXT_PUBLIC_URL}/snap?table=GOLD` } } }
                },
                "footer": {
                    "type": "text",
                    "props": {
                        "content": latestWinner
                            ? `Latest Winner: ${latestWinner.address.slice(0, 4)}...${latestWinner.address.slice(-4)} won ${latestWinner.prize} CELO!`
                            : "No winners yet. Be the first!",
                        "size": "sm",
                        "align": "center"
                    }
                }
            }
        }
    }

    return NextResponse.json(snapResponse, {
        headers: {
            'Content-Type': 'application/vnd.farcaster.snap+json',
        }
    })
}

export async function POST(request: NextRequest) {
    // For now, we just treat POST the same as GET or handle the submit target
    const searchParams = request.nextUrl.searchParams
    const table = searchParams.get('table') || 'BRONZE'

    // In a real scenario, we might parse the JFS body here
    // but for the emulator/demo, we can just return the GET response logic
    return GET(request);
}
