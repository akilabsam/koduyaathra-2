import { useMemo, useState, useEffect, useRef } from 'react'
import './App.css'

const bgImage = '/bg.webp'
const portalImage = '/portal-new.webp'
const sinhalaTitle = '/kodu-yathra-sinhala.webp'
const logo = '/kodu-yathra-logo-clean.webp'
const facOfComputingLogo = '/faculty-of-computing.webp'

// Event target date: September 10, 2026 at 6:00 PM IST
const EVENT_DATE = new Date('2026-09-10T18:00:00+05:30')

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
  const detailsRef = useScrollReveal(imagesLoaded)

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
      {/* Loader overlay — fades out when images decoded */}
      <div className={`loader ${imagesLoaded ? 'loader--hidden' : ''}`}>
        <div className="loader__spinner"></div>
      </div>

      {/* Hero section — rendered behind loader, fades in */}
      <div className={`app-content ${imagesLoaded ? 'app-content--visible' : ''}`}>

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
          <img
            className="invitation__sinhala"
            src={sinhalaTitle}
            alt="කොඩුයාත්‍රා"
          />
        </header>



        <footer className="invitation__bottom" id="footer-section">
          <img
            className="invitation__logo"
            src={logo}
            alt="Kodu Yathra Logo"
          />
         
        </footer>


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

        {/* Date card */}
        <div className="info-card reveal" data-delay="2">
          <div className="info-card__divider" />
          <section className="info-section" id="date-section">
            <span className="info-section__label">Date</span>
            <p className="info-section__primary">
              <span className="info-section__primary--gold">10<sup>th</sup></span>{' '}
              <span className="info-section__primary--white">of September</span>
            </p>
            <p className="info-section__secondary">Thursday</p>
          </section>
          <div className="info-card__divider" />
        </div>

        {/* Time card */}
        <div className="info-card reveal" data-delay="3">
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
        </div>

        {/* Venue card */}
        <div className="info-card reveal" data-delay="4">
          <div className="info-card__divider" />
          <section className="info-section" id="venue-section">
            <span className="info-section__label">Venue</span>
            <p className="info-section__primary info-section__primary--gold">
              Dayananda<br />Somasundara<br />Auditorium
            </p>
            <p className="info-section__secondary">SUSL</p>
          </section>
          <div className="info-card__divider" />
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
