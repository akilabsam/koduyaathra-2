import { useEffect, useRef, useCallback } from 'react'

// Scroll height multiplier — controls how much scrolling maps to video duration
const SCROLL_PAGES = 2
const FRAME_COUNT = 500

function VideoPreloader({ active, onExit }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const isFirstRunRef = useRef(true)
  const hasExitedRef = useRef(false)
  const hasScrolledAwayRef = useRef(false)
  const imagesRef = useRef([])

  // Preload images once
  useEffect(() => {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image()
      // Use requestIdleCallback or just let browser handle it to not block main thread heavily
      const num = i.toString().padStart(3, '0')
      img.src = `/frames/${num}.jpg`
      imagesRef.current.push(img)
    }
  }, [])

  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const img = imagesRef.current[index]
    
    if (img && img.complete && img.naturalWidth > 0) {
      if (canvas.width !== img.naturalWidth) {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    } else if (img) {
      // If not loaded yet, draw it when it loads
      img.onload = () => {
        // Only draw if we haven't scrolled past this frame index significantly, 
        // but for safety just draw it.
        drawFrame(index)
      }
    }
  }, [])

  // Reset guards when re-activated
  useEffect(() => {
    if (active) {
      hasExitedRef.current = false
      hasScrolledAwayRef.current = false
    }
  }, [active])

  // Draw frame based on scroll position
  const handleScroll = useCallback(() => {
    if (!active || hasExitedRef.current) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      const scrollY = window.scrollY
      // Total scrollable distance = (SCROLL_PAGES - 1) viewports
      const maxScroll = window.innerHeight * (SCROLL_PAGES - 1)
      const progress = Math.min(scrollY / maxScroll, 1)

      // Map scroll progress to frame index
      const frameIndex = Math.min(
        FRAME_COUNT - 1, 
        Math.floor(progress * FRAME_COUNT)
      )
      
      drawFrame(frameIndex)

      // Track when user has scrolled away from end (prevents instant re-exit)
      if (progress < 0.95) {
        hasScrolledAwayRef.current = true
      }

      // Only exit after user has scrolled away from initial position first
      if (progress >= 0.99 && hasScrolledAwayRef.current) {
        hasExitedRef.current = true
        setTimeout(() => onExit?.(), 200)
      }
    })
  }, [active, onExit, drawFrame])

  // Manage scroll spacer and position
  useEffect(() => {
    if (!active) {
      document.body.style.overflow = ''
      return
    }

    if ("scrollRestoration" in history) history.scrollRestoration = "manual"
    window.scrollTo(0, 0)
    document.body.style.overflow = 'hidden'

    // On re-entry, draw end frame immediately
    if (!isFirstRunRef.current) {
      drawFrame(FRAME_COUNT - 1)
    } else {
      drawFrame(0)
    }

    // Create scroll spacer
    const spacer = document.createElement('div')
    spacer.id = 'video-preloader-spacer'
    spacer.style.height = `${SCROLL_PAGES * 100}svh`
    spacer.style.position = 'relative'
    spacer.style.zIndex = '-1'
    document.body.insertBefore(spacer, document.body.firstChild)

    // Set scroll position after spacer is in DOM
    requestAnimationFrame(() => {
      if (isFirstRunRef.current) {
        window.scrollTo(0, 0)
        isFirstRunRef.current = false
      } else {
        // Re-entry: scroll to bottom so video starts at end
        const maxScroll = window.innerHeight * (SCROLL_PAGES - 1)
        window.scrollTo(0, maxScroll)
      }
    })

    return () => {
      const el = document.getElementById('video-preloader-spacer')
      if (el) el.remove()
      window.scrollTo(0, 0)
      document.body.style.overflow = ''
    }
  }, [active, drawFrame])

  // Attach scroll listener
  useEffect(() => {
    if (!active) return
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [active, handleScroll])

  return (
    <div
      ref={containerRef}
      className={`video-preloader ${!active ? 'video-preloader--done' : ''}`}
    >
      <canvas
        ref={canvasRef}
        className="video-preloader__video"
      />
      {/* Scroll hint indicator */}
      {active && (
        <div className="video-preloader__hint">
          <img src="/kodu-yathra-logo-clean.webp" alt="Kodu Yaathra" className="video-preloader__logo" />
        </div>
      )}
    </div>
  )
}

export default VideoPreloader
