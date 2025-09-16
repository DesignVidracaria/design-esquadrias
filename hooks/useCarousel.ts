"use client"

import { useState, useEffect, useCallback } from "react"

interface UseCarouselProps {
  totalSlides: number
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function useCarousel({ totalSlides, autoPlay = false, autoPlayInterval = 5000 }: UseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setCurrentIndex(index)
    },
    [isTransitioning],
  )

  const nextSlide = useCallback(() => {
    if (isTransitioning) return
    setCurrentIndex((prev) => (prev + 1) % totalSlides)
  }, [totalSlides, isTransitioning])

  const prevSlide = useCallback(() => {
    if (isTransitioning) return
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides, isTransitioning])

  useEffect(() => {
    if (!autoPlay) return

    const interval = setInterval(nextSlide, autoPlayInterval)
    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, nextSlide])

  return {
    currentIndex,
    goToSlide,
    nextSlide,
    prevSlide,
    isTransitioning,
    setIsTransitioning,
  }
}
