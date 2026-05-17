'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    onNeynarAuthSuccess?: (data: any) => void;
  }
}

export const NeynarAuthButton = () => {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://neynar-auth_button.s3.amazonaws.com/farcaster-siwn.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div
      className="neynar-signin"
      data-client-id={process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID}
      data-success-callback="onNeynarAuthSuccess"
      data-theme="dark"
    ></div>
  )
}
