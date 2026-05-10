import dynamic from 'next/dynamic'

const LeaderboardContent = dynamic(() => import('@/components/leaderboard/LeaderboardContent'), {
  ssr: false,
})

export default function Page() {
  return <LeaderboardContent />
}
