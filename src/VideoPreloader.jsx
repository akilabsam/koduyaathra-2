import { useEffect, useRef, useCallback } from 'react'

// Scroll height multiplier — controls how much scrolling maps to video duration
const SCROLL_PAGES = 2

function VideoPreloader({ active, onExit }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const isFirstRunRef = useRef(true)
  const hasExitedRef = useRef(false)
  const hasScrolledAwayRef = useRef(false)

  // Reset guards when re-activated
  useEffect(() => {
    if (active) {
      hasExitedRef.current = false
      hasScrolledAwayRef.current = false
    }
  }, [active])

  // Seek video based on scroll position
  const handleScroll = useCallback(() => {
    if (!active || hasExitedRef.current) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      const video = videoRef.current
      if (!video || !video.duration) return

      const scrollY = window.scrollY
      // Total scrollable distance = (SCROLL_PAGES - 1) viewports
      const maxScroll = window.innerHeight * (SCROLL_PAGES - 1)
      const progress = Math.min(scrollY / maxScroll, 1)

      // Map scroll progress to video time
      video.currentTime = progress * video.duration

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
  }, [active, onExit])

  // Manage scroll spacer and position
  useEffect(() => {
    if (!active) return

    // On re-entry, set video to end frame immediately
    if (!isFirstRunRef.current && videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = videoRef.current.duration
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
    }
  }, [active])

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
      <video
        ref={videoRef}
        className="video-preloader__video"
        src="/preloading_scroll.mp4"
        muted
        playsInline
        preload="auto"
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
