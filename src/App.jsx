import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import VideoPreloader from './VideoPreloader'
import './VideoPreloader.css'

const bgImage = '/bg.webp'
const portalImage = '/portal-new.webp'
const sinhalaTitle = '/kodu-yathra-sinhala.webp'
const logo = '/kodu-yathra-logo-clean.webp'
const facOfComputingLogo = '/faculty-of-computing.webp'

// Event target date: September 22, 2026 at 6:00 PM IST
const EVENT_DATE = new Date('2026-09-22T18:00:00+05:30')

// Generates randomized floating particle data
function generateParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    duration: `${8 + Math.random() * 12}s`,
    delay: `${Math.random() * 10}s`,
    drift: `${(Math.random() - 0.5) * 40}px`,
    size: `${1 + Math.random() * 2}px`,
  }))
}

// Calculates remaining time until the event
function getTimeLeft() {
  const diff = Math.max(0, EVENT_DATE - Date.now())
  return {
    days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0'),
    hours: String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
    minutes: String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0'),
    seconds: String(Math.floor((diff / 1000) % 60)).padStart(2, '0'),
  }
}

// Scroll-reveal hook using IntersectionObserver
function useScrollReveal(isReady = true) {
  const ref = useRef(null)

  useEffect(() => {
    if (!isReady) return;
    const container = ref.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
          }
        })
      },
      { threshold: 0.15 }
    )

    const elements = container.querySelectorAll('.reveal')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [isReady])

  return ref
}

function App() {
  const particles = useMemo(() => generateParticles(20), [])
  const [time, setTime] = useState(getTimeLeft)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [preloaderActive, setPreloaderActive] = useState(true)
  const [preloaderEverDone, setPreloaderEverDone] = useState(false)
  const siteReady = imagesLoaded && preloaderEverDone
  const detailsRef = useScrollReveal(siteReady)
  const [dimOpacity, setDimOpacity] = useState(0)

  // Handle preloader exit
  const handlePreloaderExit = useCallback(() => {
    setPreloaderActive(false)
    setPreloaderEverDone(true)
    setExitTime(Date.now())
  }, [])

  // Track scroll to dim the hero section (only after preloader done)
  const handleScroll = useCallback(() => {
    if (preloaderActive) return
    const scrollY = window.scrollY
    const windowH = window.innerHeight
    const opacity = Math.min(scrollY / (windowH * 0.6), 0.6)
    setDimOpacity(opacity)
  }, [preloaderActive])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Reset dim overlay when preloader re-enters
  useEffect(() => {
    if (preloaderActive) setDimOpacity(0)
  }, [preloaderActive])

  // Re-enter preloader on scroll-up at top (desktop)
  useEffect(() => {
    if (preloaderActive) return

    const handleWheel = (e) => {
      if (window.scrollY < 1 && e.deltaY < 0) {
        e.preventDefault()
        setPreloaderActive(true)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [preloaderActive])

  // Re-enter preloader on pull-down at top (mobile)
  useEffect(() => {
    if (preloaderActive) return

    let touchStartY = 0

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e) => {
      if (window.scrollY < 1) {
        const deltaY = e.touches[0].clientY - touchStartY
        if (deltaY > 50) {
          e.preventDefault()
          setPreloaderActive(true)
        }
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [preloaderActive])

  // Update countdown every second
  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  // Preload critical images
  useEffect(() => {
    const imagesToLoad = [bgImage, portalImage, sinhalaTitle, logo]
    let loadedCount = 0

    imagesToLoad.forEach((src) => {
      const img = new Image()
      img.onload = () => {
        loadedCount++
        if (loadedCount === imagesToLoad.length) setImagesLoaded(true)
      }
      img.onerror = () => {
        loadedCount++
        if (loadedCount === imagesToLoad.length) setImagesLoaded(true)
      }
      img.src = src
    })
  }, [])

    return (
    <>
      {/* Scroll-driven video preloader — always mounted for re-entry */}
      <VideoPreloader active={preloaderActive} onExit={handlePreloaderExit} />

      {/* Spinner fallback while images still loading after preloader */}
      {preloaderEverDone && !imagesLoaded && (
        <div className="loader">
          <div className="loader__spinner"></div>
        </div>
      )}

      {/* Main site — revealed after preloader + images ready */}
      <div className={`app-content ${siteReady ? 'app-content--visible' : ''}`}>

      {/* Hero section — unchanged layout */}
      <div className="invitation" id="invitation-page">
        <div className="invitation__portal">
          <img src={portalImage} alt="Portal" />
        </div>
        <div className="invitation__bg">
          <img src={bgImage} alt="Koduyaathra background" />
        </div>
        <div className="invitation__overlay" />
        <div className="invitation__overlay-bottom" />
        <div className="invitation__vignette" />

        <div className="invitation__particles">
          {particles.map((p) => (
            <span
              key={p.id}
              className="particle"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                '--duration': p.duration,
                '--delay': p.delay,
                '--drift': p.drift,
              }}
            />
          ))}
        </div>

        <header className="invitation__top" id="header-section">
          <p className="invitation__subtitle">We Cordially</p>
          <h1 className="invitation__title">Invite You To</h1>
          {/* <img
            className="invitation__sinhala"
            src={sinhalaTitle}
            alt="කොඩුයාත්‍රා"
          /> */}
          <img
            className="invitation__logo"
            src={logo}
            alt="Kodu Yathra Logo"
          />
        </header>

        <footer className="invitation__bottom" id="footer-section">
          
        </footer>

        {/* Scroll-driven dimming overlay */}
        <div
          className="invitation__dim"
          style={{ opacity: dimOpacity }}
        />
      </div>

      {/* Details sections — revealed on scroll */}
      <div className="details" ref={detailsRef} id="details-section">



        {/* Tagline above countdown */}
        <p className="details__countdown-tagline reveal" data-delay="0">Every Second Counts</p>

        {/* Countdown timer */}
        <div className="countdown reveal" data-delay="1">
          <div className="countdown__unit">
            <span className="countdown__number">{time.days}</span>
            <span className="countdown__label">Days</span>
          </div>
          <span className="countdown__separator">:</span>
          <div className="countdown__unit">
            <span className="countdown__number">{time.hours}</span>
            <span className="countdown__label">Hours</span>
          </div>
          <span className="countdown__separator">:</span>
          <div className="countdown__unit">
            <span className="countdown__number">{time.minutes}</span>
            <span className="countdown__label">Minutes</span>
          </div>
          <span className="countdown__separator">:</span>
          <div className="countdown__unit">
            <span className="countdown__number">{time.seconds}</span>
            <span className="countdown__label">Seconds</span>
          </div>
        </div>

        {/* Event Details Card */}
        <div className="info-card reveal" data-delay="2">
          <img src="/mask.jpg" alt="" className="info-card__mask" />
          <section className="info-section" id="date-section">
            <span className="info-section__label">Date</span>
            <p className="info-section__primary">
              <span className="info-section__primary--gold">22<sup>nd</sup></span>
              <span className="info-section__primary--white">of September</span>
            </p>
            <p className="info-section__secondary">Tuesday</p>
          </section>

          <div className="info-card__divider" />

          <section className="info-section" id="time-section">
            <span className="info-section__label">Time</span>
            <p className="info-section__primary">
              <span className="info-section__primary--gold">6 PM</span>{' '}
              <span className="info-section__primary--white">Onwards</span>
            </p>
            <p className="info-section__secondary">Doors Open At 5:30</p>
          </section>

          <div className="info-card__divider" />

          <section className="info-section" id="venue-section">
            <span className="info-section__label">Venue</span>
            <p className="info-section__primary info-section__primary--gold">
              Prof.<br />J.W. Dayananda Somasundara<br />Auditorium
            </p>
            <p className="info-section__secondary">SUSL</p>
          </section>
          <img src="/guitar.png" alt="" className="info-card__music" />
        </div>

        {/* Faculty of Computing footer */}
        <footer className="details__footer reveal" data-delay="5">
          <img src={facOfComputingLogo} alt="Faculty of Computing" className="details__footer-logo" />
        </footer>
      </div>
      </div>
    </>
  )
}

export default App
