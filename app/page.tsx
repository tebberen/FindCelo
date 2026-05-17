import dynamic from 'next/dynamic'
import React from 'react'

const HomeContent = dynamic(() => import('@/components/home/HomeContent'), {
  ssr: false,
})

export default function Home() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#3e2722] flex items-center justify-center text-[#f4f4db]">Loading...</div>}>
      <HomeContent />
    </React.Suspense>
  )
}
