'use server'

export async function postWinnerCast(winner: string, prize: string, tableType: string) {
  const apiKey = process.env.NEYNAR_API_KEY
  if (!apiKey) {
    console.error('NEYNAR_API_KEY is not set')
    return
  }

  const message = `🪎 We have a winner on FINDCELO! 🏝️\n\nExplorer ${winner.slice(0, 6)}...${winner.slice(-4)} found the treasure on the ${tableType} table and won ${prize} CELO! 🏆\n\nPlay now: ${process.env.NEXT_PUBLIC_URL}`

  try {
    const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': apiKey,
      },
      body: JSON.stringify({
        text: message,
        // In a real app, you would use a signer_uuid from the user or a bot account
        // signer_uuid: process.env.NEYNAR_SIGNER_UUID
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to post cast:', error)
    }
  } catch (error) {
    console.error('Error posting winner cast:', error)
  }
}
