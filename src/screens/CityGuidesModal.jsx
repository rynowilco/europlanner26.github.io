import React, { useState, useEffect, useRef } from 'react'
import { CONFIG, marked } from '../config'
import { Icon } from '../components/Icon'

// ─── Hero image URLs (direct from Cloudinary) ─────────────────────────────────

const HERO_IMAGES = {
    'frankfurt':    'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611560/hero_frankfurt_njk6ze.jpg',
    'hinterzarten': 'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611557/hero_hinterzarten_nfqyi5.jpg',
    'iseltwald':    'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611559/hero_iseltwald_z5uyev.jpg',
    'milan':        'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611562/hero_milan_vqyxkn.jpg',
    'riomaggiore':  'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611565/hero_riomaggiore_wu1yuu.jpg',
    'lucca':        'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611561/hero_lucca_amyzzo.jpg',
    'noce':         'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611563/hero_noce_btwsq5.jpg',
    'verona':       'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611566/hero_verona_tpctfp.jpg',
    'dolomites':              'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611554/hero_dolomites_d9bapx.jpg',
    'ortisei':                'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611554/hero_dolomites_d9bapx.jpg',
    'ortisei/st. ulrich':     'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611554/hero_dolomites_d9bapx.jpg',
    'ortisei / st. ulrich':   'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611554/hero_dolomites_d9bapx.jpg',
    'st. ulrich':             'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611554/hero_dolomites_d9bapx.jpg',
    'val gardena':            'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611554/hero_dolomites_d9bapx.jpg',
    'val di funes':           'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611554/hero_dolomites_d9bapx.jpg',
    'innsbruck':    'https://res.cloudinary.com/dxa8sf575/image/upload/v1778611559/hero_innsbruck_iraymb.jpg',
}

const STATUS_CONFIG = {
    current:  { borderColor: '#22c55e', label: '📍 Here Now', color: '#16a34a', bg: '#f0fdf4' },
    visited:  { borderColor: '#60a5fa', label: '✓ Visited',   color: '#2563eb', bg: '#eff6ff' },
    upcoming: { borderColor: '#d1d5db', label: 'Coming Up',   color: '#6b7280', bg: '#f9fafb' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHeroUrl(cityName) {
    return HERO_IMAGES[cityName.toLowerCase()] || null
}

function getCityStatus(city) {
    const today = new Date().toISOString().split('T')[0]
    if (city.startDate <= today && today <= city.endDate) return 'current'
    if (city.endDate < today) return 'visited'
    return 'upcoming'
}

function formatDateRange(startDate, endDate) {
    const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return startDate === endDate ? fmt(startDate) : `${fmt(startDate)} – ${fmt(endDate)}`
}

function getThumbUrl(url, width = 400) {
    if (!url) return null
    if (url.includes('cloudinary.com')) {
        return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`)
    }
    return url
}

async function fetchCitySummary(city, country, activities) {
    try {
        const activityContext = activities.length > 0
            ? ` The family has these activities planned here: ${activities.map(a => a.title).join(', ')}.`
            : ''
        const prompt = `Write a warm, enthusiastic 3-4 sentence travel overview of ${city}, ${country} for a family with kids ages 11 and 14. What makes it special? What's the vibe? One thing they absolutely can't miss. Fun and accessible tone.${activityContext}`
        const res = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CONFIG.CLAUDE_MODEL,
                max_tokens: 300,
                system: 'You write warm, enthusiastic travel summaries for a family trip. Conversational prose only — no bullet points, no lists, no headers. Bold and italic markdown are fine. Keep it to 3-4 sentences.',
                messages: [{ role: 'user', content: prompt }]
            })
        })
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        const blocks = (data?.content || []).filter(b => b.type === 'text')
        return blocks.map(b => b.text).join('') || 'Summary unavailable right now.'
    } catch {
        return 'Summary unavailable right now.'
    }
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────

const PhotoLightbox = ({ photos, startIndex, onClose }) => {
    const [idx, setIdx] = useState(startIndex)
    const [dir, setDir] = useState(0)
    const touchStartX = useRef(null)
    const entry = photos[idx]

    const prev = () => { setDir(-1); setIdx(i => (i - 1 + photos.length) % photos.length) }
    const next = () => { setDir(1);  setIdx(i => (i + 1) % photos.length) }

    const onTouchStart = e => { touchStartX.current = e.touches[0].clientX }
    const onTouchEnd = e => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(dx) > 40) { dx < 0 ? next() : prev() }
        touchStartX.current = null
    }

    useEffect(() => {
        const handler = e => { if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Close */}
            <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                <Icon name="X" size={20} color="white" />
            </button>

            {/* Prev */}
            {photos.length > 1 && (
                <button onClick={prev} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                    <Icon name="ChevronLeft" size={24} color="white" />
                </button>
            )}

            {/* Image */}
            <img
                key={idx}
                src={getThumbUrl(entry.photoUrl, 1600)}
                alt={entry.entryText || ''}
                style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', animation: dir === 0 ? 'fadeIn 0.2s ease-out' : dir > 0 ? 'slideInFromRight 0.25s ease-out' : 'slideInFromLeft 0.25s ease-out' }}
            />

            {/* Next */}
            {photos.length > 1 && (
                <button onClick={next} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                    <Icon name="ChevronRight" size={24} color="white" />
                </button>
            )}

            {/* Caption + counter */}
            <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, textAlign: 'center', padding: '0 60px' }}>
                {entry.entryText && <p style={{ color: 'white', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '6px' }}>{entry.entryText}</p>}
                {photos.length > 1 && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>{idx + 1} / {photos.length}</div>}
            </div>
        </div>
    )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section = ({ title, children }) => (
    <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-md)' }}>{title}</div>
        {children}
    </div>
)

// ─── City Card ────────────────────────────────────────────────────────────────

const CityCard = ({ city, onSelect }) => {
    const heroUrl = getHeroUrl(city.city)
    const [heroSrc, setHeroSrc] = useState(() => heroUrl ? getThumbUrl(heroUrl, 400) : null)
    const [heroFailed, setHeroFailed] = useState(false)
    const status = getCityStatus(city)
    const { borderColor, label, color } = STATUS_CONFIG[status]

    const handleHeroError = () => {
        if (heroSrc !== heroUrl && heroUrl) { setHeroSrc(heroUrl) }
        else { setHeroFailed(true) }
    }

    return (
        <button
            onClick={() => onSelect(city)}
            style={{
                display: 'flex', flexDirection: 'column',
                background: 'white', border: `3px solid ${borderColor}`,
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                textAlign: 'left', padding: 0,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
        >
            <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', position: 'relative', background: 'var(--color-tan)' }}>
                {heroSrc && !heroFailed
                    ? <img src={heroSrc} alt={city.city} onError={handleHeroError} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--color-tan), var(--color-terracotta))', fontSize: '2rem' }}>🌍</div>
                }
                <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(255,255,255,0.95)', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, color, boxShadow: '0 1px 4px rgba(0,0,0,0.15)', backdropFilter: 'blur(4px)' }}>
                    {label}
                </div>
            </div>
            <div style={{ padding: 'var(--space-sm) var(--space-md) var(--space-md)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-navy)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{city.city}</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--color-text-light)', marginTop: '2px' }}>{city.country}</div>
            </div>
        </button>
    )
}

// ─── City Grid ────────────────────────────────────────────────────────────────

const CityGrid = ({ cities, onSelect, onClose }) => (
    <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-lg)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-navy)', margin: 0, lineHeight: 1 }}>Our Cities</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', margin: 0, marginTop: '4px' }}>Tap a city to explore</p>
            </div>
            <button onClick={onClose} style={{ background: 'var(--color-cream)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)' }}>
                <Icon name="X" size={20} />
            </button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-lg)', flexShrink: 0, background: 'white', borderBottom: '1px solid var(--color-border)' }}>
            {Object.entries(STATUS_CONFIG).map(([key, { borderColor, label }]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--color-text-light)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: borderColor, flexShrink: 0 }} />
                    {label}
                </div>
            ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
                {cities.map(city => (
                    <CityCard key={`${city.city}-${city.startDate}`} city={city} onSelect={onSelect} />
                ))}
            </div>
            <div style={{ height: 'var(--space-lg)' }} />
        </div>
    </>
)

// ─── City Detail ──────────────────────────────────────────────────────────────

const CityDetail = ({ city, activities, journalEntries, onBack, onClose, summaryCache }) => {
    const [summary, setSummary] = useState(summaryCache.current[city.city] || null)
    const [summaryLoading, setSummaryLoading] = useState(!summaryCache.current[city.city])
    const [lightbox, setLightbox] = useState(null) // { photos, index }

    const status = getCityStatus(city)
    const { borderColor, label, color, bg } = STATUS_CONFIG[status]
    const heroUrl = getHeroUrl(city.city)
    const [heroSrc, setHeroSrc] = useState(() => heroUrl ? getThumbUrl(heroUrl, 800) : null)
    const [heroFailed, setHeroFailed] = useState(false)

    const handleHeroError = () => {
        if (heroSrc !== heroUrl && heroUrl) { setHeroSrc(heroUrl) }
        else { setHeroFailed(true) }
    }

    const cityActivities = (activities || []).filter(a =>
        a.city?.toLowerCase() === city.city.toLowerCase() &&
        ['submitted', 'approved', 'needs-revision'].includes((a.status || '').toLowerCase())
    )

    const cityPhotos = (journalEntries || []).filter(e =>
        e.entryType === 'photo' && e.photoUrl &&
        e.city?.toLowerCase() === city.city.toLowerCase()
    )

    const phrases = (CONFIG.phrases[city.language] || []).slice(0, 5)

    useEffect(() => {
        if (summaryCache.current[city.city]) return
        setSummaryLoading(true)
        fetchCitySummary(city.city, city.country, cityActivities).then(text => {
            summaryCache.current[city.city] = text
            setSummary(text)
            setSummaryLoading(false)
        })
    }, [city.city])

    return (
        <>
            {lightbox && <PhotoLightbox photos={lightbox.photos} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
                    <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', marginLeft: '-4px' }}>
                        <Icon name="ChevronLeft" size={24} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--color-navy)', margin: 0, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{city.city}</h2>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>{city.country} · {formatDateRange(city.startDate, city.endDate)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ background: bg, color, fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)', border: `1.5px solid ${borderColor}`, whiteSpace: 'nowrap' }}>
                            {label}
                        </span>
                        <button onClick={onClose} style={{ background: 'var(--color-cream)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            <Icon name="X" size={18} color="var(--color-text-light)" />
                        </button>
                    </div>
                </div>

                {/* Scrollable content */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {/* Hero image */}
                    <div style={{ width: '100%', height: '200px', overflow: 'hidden', background: 'var(--color-tan)', flexShrink: 0 }}>
                        {heroSrc && !heroFailed
                            ? <img src={heroSrc} alt={city.city} onError={handleHeroError} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--color-tan), var(--color-terracotta))', fontSize: '3rem' }}>🌍</div>
                        }
                    </div>

                    <div style={{ padding: 'var(--space-lg)' }}>
                        {/* AI Summary */}
                        <Section title="About">
                            {summaryLoading
                                ? <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                                    <div style={{ width: '16px', height: '16px', border: '2px solid var(--color-tan)', borderTopColor: 'var(--color-terracotta)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                                    Generating summary…
                                </div>
                                : <div className="markdown-content" style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-text)' }} dangerouslySetInnerHTML={{ __html: marked.parse(summary || '') }} />
                            }
                        </Section>

                        {/* Family Photos */}
                        {cityPhotos.length > 0 && (
                            <Section title={`📸 Our Photos (${cityPhotos.length})`}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
                                    {cityPhotos.map((e, i) => (
                                        <button
                                            key={e.id}
                                            onClick={() => setLightbox({ photos: cityPhotos, index: i })}
                                            style={{ aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-tan)', border: 'none', padding: 0, cursor: 'pointer' }}
                                        >
                                            <img
                                                src={getThumbUrl(e.photoUrl, 300)}
                                                alt={e.entryText || ''}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* Planned Activities */}
                        {cityActivities.length > 0 && (
                            <Section title="🎯 What's Planned">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {cityActivities.map(a => {
                                        const isApproved = a.status === 'approved'
                                        const isPending = a.status === 'submitted'
                                        return (
                                            <div key={a.id} style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                                                    <div style={{ fontSize: '0.73rem', color: 'var(--color-text-light)', marginTop: '2px' }}>{a.userName || a.kidName}</div>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap', flexShrink: 0,
                                                    background: isApproved ? '#f0fdf4' : isPending ? '#fef9ec' : '#fef2f2',
                                                    color: isApproved ? '#16a34a' : isPending ? '#b45309' : '#dc2626',
                                                    border: `1px solid ${isApproved ? '#86efac' : isPending ? '#fcd34d' : '#fca5a5'}`,
                                                }}>
                                                    {isApproved ? '✓ Approved' : isPending ? 'Pending' : 'Needs Revision'}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </Section>
                        )}

                        {/* Language Phrases */}
                        {phrases.length > 0 && (
                            <Section title={`🗣️ Key ${city.language} Phrases`}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {phrases.map((p, i) => (
                                        <div key={i} style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--color-terracotta)', fontSize: '0.95rem' }}>{p.local}</div>
                                                <div style={{ fontSize: '0.73rem', color: 'var(--color-text-light)', fontStyle: 'italic', whiteSpace: 'nowrap', flexShrink: 0 }}>{p.pronunciation}</div>
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: '2px' }}>{p.english} · <span style={{ opacity: 0.75 }}>{p.when}</span></div>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}

                        <div style={{ height: 'var(--space-xl)' }} />
                    </div>
                </div>
            </div>
        </>
    )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export const CityGuidesModal = ({ onClose, itinerary, activities, journalEntries }) => {
    const [visible, setVisible] = useState(false)
    const [selectedCity, setSelectedCity] = useState(null)
    const [dragY, setDragY] = useState(0)
    const summaryCache = useRef({})
    const touchStartY = useRef(null)
    const isDragging = useRef(false)

    useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

    const handleClose = () => {
        setDragY(0)
        setVisible(false)
        setTimeout(onClose, 300)
    }

    const handleHandleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY
        isDragging.current = true
    }
    const handleHandleTouchMove = (e) => {
        if (!isDragging.current || touchStartY.current === null) return
        const dy = e.touches[0].clientY - touchStartY.current
        if (dy > 0) setDragY(dy)
    }
    const handleHandleTouchEnd = (e) => {
        isDragging.current = false
        const dy = e.changedTouches[0].clientY - (touchStartY.current || 0)
        touchStartY.current = null
        if (dy > 80) { handleClose() } else { setDragY(0) }
    }

    const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
    const seen = new Set()
    const cities = tripItinerary.filter(c => {
        if (c.isTransfer) return false
        if (c.city === 'TBD') return false
        if (c.city === 'Portland') return false
        if (seen.has(c.city)) return false
        seen.add(c.city)
        return true
    })

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div onClick={handleClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }} />
            <div style={{
                position: 'relative', background: 'var(--color-cream)',
                borderRadius: '20px 20px 0 0', height: '90vh',
                display: 'flex', flexDirection: 'column',
                transform: visible ? `translateY(${dragY}px)` : 'translateY(100%)',
                transition: dragY > 0 ? 'none' : 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)', overflow: 'hidden',
            }}>
                <div
                    onTouchStart={handleHandleTouchStart}
                    onTouchMove={handleHandleTouchMove}
                    onTouchEnd={handleHandleTouchEnd}
                    style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-md) 0', flexShrink: 0, cursor: 'grab', touchAction: 'none' }}>
                    <div style={{ width: '36px', height: '4px', background: 'var(--color-border)', borderRadius: '2px' }} />
                </div>
                {selectedCity
                    ? <CityDetail city={selectedCity} activities={activities} journalEntries={journalEntries} onBack={() => setSelectedCity(null)} onClose={handleClose} summaryCache={summaryCache} />
                    : <CityGrid cities={cities} onSelect={setSelectedCity} onClose={handleClose} />
                }
            </div>
        </div>
    )
}
