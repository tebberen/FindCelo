import { createPublicClient, http, formatEther } from 'viem'
import { celo } from 'viem/chains'
import { CONTRACT_ADDRESS, FIND_CELO_ABI, TABLE_TYPES, TABLE_COSTS } from '@/src/constants'

export const publicClient = createPublicClient({
    chain: celo,
    transport: http()
})

export async function getTableData(tableIndex: number) {
    const tablePlayers = await publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: FIND_CELO_ABI,
        functionName: 'getTablePlayers',
        args: [tableIndex],
    }) as string[]

    const tableInfo = await publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: FIND_CELO_ABI,
        functionName: 'tables',
        args: [tableIndex],
    }) as any

    return {
        tablePlayers,
        seatsFilled: Number(tableInfo.seatsFilled || 0),
    }
}

export async function getLatestWinner() {
    try {
        const logs = await publicClient.getLogs({
            address: CONTRACT_ADDRESS as `0x${string}`,
            event: FIND_CELO_ABI.find((x: any) => x.name === 'TableFilled') as any,
            fromBlock: 'latest',
            strict: true,
        })

        if (logs.length > 0) {
            const lastLog = logs[logs.length - 1] as any
            return {
                address: lastLog.args.winner,
                prize: formatEther(lastLog.args.prize),
                tableType: lastLog.args.tableType === 0 ? 'BRONZE' : lastLog.args.tableType === 1 ? 'SILVER' : 'GOLD',
                land: Number(lastLog.args.winningLand)
            }
        }
    } catch (e) {
        console.error('Error fetching logs:', e)
    }
    return null
}
