'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export function FarcasterSDKLoader() {
  useEffect(() => {
    const load = async () => {
      try {
        await sdk.actions.ready()
      } catch (error) {
        console.error('Error loading Farcaster SDK:', error)
      }
    }
    load()
  }, [])

  return null
}
