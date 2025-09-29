'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSlider } from '@/lib/hooks/useSlider'

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

interface ImageSliderProps {
  content?: SliderContent
  autoRotateInterval?: number
  className?: string
}

export default function ImageSlider({ 
  content, 
  autoRotateInterval = 5000,
  className = '' 
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Fetch slider content from CMS
  const { slider: cmsSlider, loading, error } = useSlider()

  // Default content for development/fallback
  const defaultContent: SliderContent = {
    id: 'default',
    heading: 'Discover Amazing AI Reels',
    subheading: 'Transform your ideas into stunning visual content',
    images: [
      { id: '1', url: '/placeholder-slider-1.svg', order: 1 },
      { id: '2', url: '/placeholder-slider-2.svg', order: 2 },
      { id: '3', url: '/placeholder-slider-3.svg', order: 3 }
    ]
  }

  // Use provided content, CMS content, or default content in that order
  const sliderContent = content || cmsSlider || defaultContent
  const images = sliderContent.images.sort((a, b) => a.order - b.order)
  const totalImages = images.length

  // Auto-rotation logic
  const nextSlide = useCallback(() => {
    if (totalImages > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalImages)
    }
  }, [totalImages])

  const prevSlide = useCallback(() => {
    if (totalImages > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + totalImages) % totalImages)
    }
  }, [totalImages])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoPlaying || totalImages <= 1) return

    const interval = setInterval(nextSlide, autoRotateInterval)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide, autoRotateInterval, totalImages])

  // Touch/swipe handling
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsAutoPlaying(false) // Pause auto-rotation during touch
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }

    // Resume auto-rotation after a delay
    setTimeout(() => setIsAutoPlaying(true), 3000)
  }

  // Handle mouse events for desktop
  const handleMouseEnter = () => {
    setIsAutoPlaying(false)
  }

  const handleMouseLeave = () => {
    setIsAutoPlaying(true)
  }

  // Loading state
  if (loading && !content) {
    return (
      <section className={`py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-card/50 ${className}`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-lg w-3/4 mx-auto mb-4"></div>
            <div className="h-6 bg-muted rounded-lg w-1/2 mx-auto mb-8"></div>
            <div className="h-64 sm:h-80 lg:h-96 bg-muted rounded-2xl"></div>
          </div>
        </div>
      </section>
    )
  }

  // Error state (still show default content)
  if (error && !content) {
    console.warn('Slider error:', error)
  }

  if (totalImages === 0) {
    return (
      <section className={`py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-card/50 ${className}`}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {sliderContent.heading}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {sliderContent.subheading}
          </p>
          <div className="text-muted-foreground">
            No images available
          </div>
        </div>
      </section>
    )
  }

  return (
    <section 
      className={`relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-card/50 overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-7xl mx-auto">
        {/* Content Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {sliderContent.heading}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {sliderContent.subheading}
          </p>
        </div>

        {/* Slider Container */}
        <div className="relative">
          {/* Image Container */}
          <div 
            className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Images */}
            <div 
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {images.map((image, index) => (
                <div key={image.id} className="w-full h-full flex-shrink-0 relative">
                  <Image
                    src={image.url}
                    alt={`Slider image ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 80vw"
                    quality={90}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    unoptimized={false}
                  />
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            {totalImages > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Pagination Indicators */}
          {totalImages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-primary scale-110'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Auto-play indicator */}
          {totalImages > 1 && (
            <div className="absolute top-4 right-4">
              <div className={`w-2 h-2 rounded-full ${isAutoPlaying ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}