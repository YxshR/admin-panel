'use client'

import { useState, useEffect } from 'react'

interface SliderImage {
  id: string
  url: string
  order: number
}

interface SliderContent {
  id: string
  heading: string
  subheading: string
  images: SliderImage[]
}

interface UseSliderReturn {
  slider: SliderContent | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSlider(): UseSliderReturn {
  const [slider, setSlider] = useState<SliderContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSlider = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/public/slider')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch slider content')
      }
      
      if (data.success) {
        setSlider(data.slider)
      } else {
        throw new Error(data.error || 'Failed to fetch slider content')
      }
    } catch (err) {
      console.error('Error fetching slider:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      
      // Set fallback content on error
      setSlider({
        id: 'fallback',
        heading: 'Discover Amazing AI Reels',
        subheading: 'Transform your ideas into stunning visual content',
        images: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlider()
  }, [])

  return {
    slider,
    loading,
    error,
    refetch: fetchSlider
  }
}