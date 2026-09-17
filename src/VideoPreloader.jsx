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

  // FIX 1: Cache canvas 2D context — never call getContext on every draw
  const ctxRef = useRef(null)

  // FIX 2: Track last rendered frame index — skip draw if unchanged
  const lastFrameIndexRef = useRef(-1)

  // FIX 5: Store stable drawFrame in a ref so scroll handler never needs it as a dep
  const drawFrameRef = useRef(null)

  // Preload images once — FIX 3: set onload handlers HERE, not inside drawFrame
  useEffect(() => {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image()
      const num = i.toString().padStart(3, '0')
      const index = i - 1

      // FIX 3: onload is set once at load time, not recursively inside drawFrame
      img.onload = () => {
        // Only draw this frame if it's the one currently expected
        if (lastFrameIndexRef.current === index) {
          drawFrameRef.current?.(index)
        }
      }

      img.src = `/frames/${num}.jpg`
      imagesRef.current.push(img)
    }
  }, [])

  // FIX 1 + FIX 2: drawFrame caches ctx and skips same-frame redraws
  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // FIX 1: Cache context once, reuse forever
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext('2d')
    }

    const img = imagesRef.current[index]

    // FIX 2: Skip draw if this frame is already displayed
    if (lastFrameIndexRef.current === index && img?.complete) return
    lastFrameIndexRef.current = index

    if (img && img.complete && img.naturalWidth > 0) {
      if (canvas.width !== img.naturalWidth) {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        // Re-acquire context after canvas resize (resize resets ctx state)
        ctxRef.current = canvas.getContext('2d')
      }
      ctxRef.current.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    // If not loaded yet, the onload handler (set during preload) will draw it
  }, [])

  // FIX 5: Always keep drawFrameRef in sync with the latest drawFrame
  useEffect(() => {
    drawFrameRef.current = drawFrame
  }, [drawFrame])

  // Reset guards when re-activated
  useEffect(() => {
    if (active) {
      hasExitedRef.current = false
      hasScrolledAwayRef.current = false
      lastFrameIndexRef.current = -1
    }
  }, [active])

  // FIX 5: handleScroll uses refs only — no drawFrame/onExit in dep array
  // This means the scroll listener is NEVER re-registered during transitions
  const onExitRef = useRef(onExit)
  useEffect(() => { onExitRef.current = onExit }, [onExit])
  const activeRef = useRef(active)
  useEffect(() => { activeRef.current = active }, [active])

  const handleScroll = useCallback(() => {
    if (!activeRef.current || hasExitedRef.current) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      const scrollY = window.scrollY
      const maxScroll = window.innerHeight * (SCROLL_PAGES - 1)
      const progress = Math.min(scrollY / maxScroll, 1)

      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(progress * FRAME_COUNT)
      )

      // Use ref-stable draw call
      drawFrameRef.current?.(frameIndex)

      if (progress < 0.95) {
        hasScrolledAwayRef.current = true
      }

      // FIX 4: Exit via rAF instead of setTimeout — avoids React reconciler
      // collision with active scroll + CSS transition happening simultaneously
      if (progress >= 0.99 && hasScrolledAwayRef.current) {
        hasExitedRef.current = true
        requestAnimationFrame(() => {
          onExitRef.current?.()
        })
      }
    })
  }, []) // Empty deps — all values read through stable refs

  // Manage scroll spacer and position
  useEffect(() => {
    if (!active) {
      document.body.style.overflow = ''
      return
    }

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    document.body.style.overflow = 'hidden'

    if (!isFirstRunRef.current) {
      drawFrame(FRAME_COUNT - 1)
    } else {
      drawFrame(0)
    }

    const spacer = document.createElement('div')
    spacer.id = 'video-preloader-spacer'
    spacer.style.height = `${SCROLL_PAGES * 100}svh`
    spacer.style.position = 'relative'
    spacer.style.zIndex = '-1'
    document.body.insertBefore(spacer, document.body.firstChild)

    requestAnimationFrame(() => {
      if (isFirstRunRef.current) {
        window.scrollTo(0, 0)
        isFirstRunRef.current = false
      } else {
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

  // Attach scroll listener — FIX 5: handleScroll is now stable (empty deps),
  // so this effect NEVER re-fires during transitions — no listener gap
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
      {active && (
        <div className="video-preloader__hint">
          <img src="/kodu-yathra-logo-clean.webp" alt="Kodu Yaathra" className="video-preloader__logo" />
        </div>
      )}
    </div>
  )
}

export default VideoPreloader
