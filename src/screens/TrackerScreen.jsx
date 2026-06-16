import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import { CONFIG, marked } from '../config'
import { Icon } from '../components/Icon'
import { SlideshowScreen } from './SlideshowScreen'
import { CommentSection, isFamilyCommenter } from '../components/CommentSection'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fetchCitySummary = async (prompt) => {
    try {
        const response = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CONFIG.CLAUDE_MODEL,
                max_tokens: 1024,
                system: 'You write warm, concise travel summaries for a family trip. Respond in 2-3 sentences only. Conversational text — no bullet points, no lists, no headers. Bold and italic markdown are allowed.',
                messages: [{ role: 'user', content: prompt }]
            })
        })
        if (!response.ok) throw new Error('API error ' + response.status)
        const data = await response.json()
        if (!data?.content || !Array.isArray(data.content)) return 'Summary unavailable right now.'
        const textBlocks = data.content.filter(b => b.type === 'text')
        if (textBlocks.length === 0) return 'Summary unavailable right now.'
        return textBlocks.map(b => b.text).join('')
    } catch (e) {
        return 'Summary unavailable right now.'
    }
}

const getThumbUrl = (url, width = 400) => {
    if (!url) return null
    if (url.includes('cloudinary.com')) {
        return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`)
    }
    const match = url.match(/[?&]id=([^&]+)/)
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w${width}` : url
}

const formatDay = (dateStr) => {
    if (!dateStr) return 'Unknown Date'
    const dt = new Date(dateStr + 'T00:00:00')
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// ── Module-level style constants ──────────────────────────────────────────────

const trackerCardStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '28px 16px', background: 'white', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'center',
    boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s', width: '100%',
}

// ── Module-level sub-components ───────────────────────────────────────────────

const PhotoThumb = ({ photo, index, onOpen }) => {
    const [loaded, setLoaded] = useState(false)
    return (
        <div onClick={() => onOpen(index)} style={{ flexShrink: 0, width: '90px', height: '90px', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer', background: 'var(--color-tan)', border: '2px solid white', boxShadow: 'var(--shadow-sm)', position: 'relative' }}>
            {!loaded && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'rgba(255,255,255,0.9)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
            )}
            <img
                src={getThumbUrl(photo.photoUrl, 200)}
                alt={photo.entryText || ''}
                onLoad={() => setLoaded(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: loaded ? 1 : 0, transition: 'opacity 0.2s ease' }}
            />
        </div>
    )
}

const SubHeader = ({ title, subtitle, onBack }) => (
    <header style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-md)', paddingTop: 'calc(var(--space-md) + env(safe-area-inset-top, 0px))', background: 'white', boxShadow: 'var(--shadow-sm)', flexShrink: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 'var(--space-sm)', cursor: 'pointer', marginRight: 'var(--space-sm)' }}>
            <Icon name="ArrowLeft" size={20} />
        </button>
        <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.2 }}>{title}</h1>
            {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{subtitle}</p>}
        </div>
    </header>
)

const Lightbox = ({ photos, initialIndex, onClose, comments, onAddComment, commenterName, onSetCommenterName }) => {
    const [idx, setIdx] = useState(initialIndex)
    const [dir, setDir] = useState(0)
    const [imgLoaded, setImgLoaded] = useState(false)
    const touchStartX = useRef(null)
    const entry = photos[idx]

    useEffect(() => { setImgLoaded(false) }, [idx])

    const prev = (e) => { e.stopPropagation(); setDir(-1); setIdx(i => (i - 1 + photos.length) % photos.length) }
    const next = (e) => { e.stopPropagation(); setDir(1); setIdx(i => (i + 1) % photos.length) }
    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
    const onTouchEnd = (e) => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(dx) > 50) {
            if (dx < 0) { setDir(1); setIdx(i => (i + 1) % photos.length) }
            else { setDir(-1); setIdx(i => (i - 1 + photos.length) % photos.length) }
        }
        touchStartX.current = null
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}
            onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <style>{`
                @keyframes slideInFromRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes slideInFromLeft  { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
            `}</style>
            <button onClick={onClose} style={{ position: 'absolute', top: 'calc(var(--space-xl) + env(safe-area-inset-top, 0px))', right: '16px', zIndex: 10, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name="X" size={20} color="white" />
            </button>
            {photos.length > 1 && (
                <button onClick={prev} style={{ position: 'absolute', left: '16px', top: '35%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Icon name="ChevronLeft" size={24} color="white" />
                </button>
            )}
            <div onClick={onClose} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 'calc(48px + env(safe-area-inset-top, 0px))', paddingBottom: 'var(--space-md)', paddingLeft: '60px', paddingRight: '60px' }}>
                <div style={{ position: 'relative', width: '100%', minHeight: imgLoaded ? 0 : '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!imgLoaded && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '28px', height: '28px', border: '2.5px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.85)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                    )}
                    <img key={idx} src={getThumbUrl(entry.photoUrl, 1600)} alt={entry.entryText || 'Photo'} onClick={e => e.stopPropagation()}
                        onLoad={() => setImgLoaded(true)}
                        style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', display: 'block',
                            opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.2s ease',
                            animation: imgLoaded ? (dir === 0 ? 'fadeIn 0.2s ease-out' : dir > 0 ? 'slideInFromRight 0.25s ease-out' : 'slideInFromLeft 0.25s ease-out') : 'none' }} />
                </div>
                {entry.entryText && <p onClick={e => e.stopPropagation()} style={{ color: 'white', marginTop: 'var(--space-sm)', fontSize: '0.9rem', lineHeight: 1.5, textAlign: 'center', maxWidth: '400px' }}>{entry.entryText}</p>}
                <div onClick={e => e.stopPropagation()} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginTop: '4px' }}>
                    {entry.userName} · {entry.city}{photos.length > 1 ? ` · ${idx + 1} / ${photos.length}` : ''}
                </div>
            </div>
            {photos.length > 1 && (
                <button onClick={next} style={{ position: 'absolute', right: '16px', top: '35%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Icon name="ChevronRight" size={24} color="white" />
                </button>
            )}
            <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ padding: 'var(--space-md) var(--space-lg) var(--space-xl)' }} onClick={e => e.stopPropagation()}>
                    <CommentSection entryId={entry.id} entryType="photo" comments={comments} onAddComment={onAddComment} commenterName={commenterName} onSetCommenterName={onSetCommenterName} dark={true} />
                </div>
            </div>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

export const TrackerScreen = ({ onBack, activities, itinerary, journalEntries, onHeartEntry, comments, onAddComment, journalDigest, userProfiles, onOpenCityGuides }) => {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)

    // 'home' | 'familyFeed' | 'dailyStories' | 'map' | 'slideshow'
    const [trackerView, setTrackerView] = useState('home')
    const [selectedCity, setSelectedCity] = useState(null)
    const [aiSummary, setAiSummary] = useState(null)
    const [loadingSummary, setLoadingSummary] = useState(false)
    const [lightbox, setLightbox] = useState(null)
    const [expandedStory, setExpandedStory] = useState(null)
    const [expandedComments, setExpandedComments] = useState(() => {
        const ids = (comments || []).map(c => c.entryId)
        return new Set(ids)
    })
    const [commenterName, setCommenterName] = useState(() => localStorage.getItem('euroPlanner_commenterName') || '')

    const handleSetCommenterName = (name) => {
        setCommenterName(name)
        localStorage.setItem('euroPlanner_commenterName', name)
    }
    const toggleComments = (id) => setExpandedComments(prev => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
    })

    const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
    const isTransferCity = (city) => city.isTransfer || city.city.toLowerCase().includes('transfer') || city.city.toLowerCase().includes('kids choice')

    const fmtLongDate = (d) => {
        if (!d) return ''
        const dt = new Date(d + 'T00:00:00')
        return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    }

    // ── Derived data ──────────────────────────────────────────────────────────

    const allEntries = (journalEntries || []).filter(e => e.userId && (e.entryText || e.photoUrl))
    const allPhotos = allEntries.filter(e => e.entryType === 'photo' || e.photoUrl)
    const recentPhotos = [...allPhotos]
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        .slice(0, 10)
    const grouped = allEntries.reduce((acc, e) => {
        const key = e.date || (e.timestamp ? e.timestamp.split('T')[0] : 'Unknown')
        if (!acc[key]) acc[key] = []
        acc[key].push(e)
        return acc
    }, {})
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
    const heartedIds = JSON.parse(localStorage.getItem('euroPlanner_heartedEntries') || '[]')

    const hasNewStory = (() => {
        if (!journalDigest?.length) return false
        const latest = [...journalDigest].sort((a, b) => b.date.localeCompare(a.date))[0]?.date
        const lastSeen = localStorage.getItem('euroPlanner_lastSeenStory')
        return !lastSeen || latest > lastSeen
    })()

    const markStorySeen = () => {
        if (journalDigest?.length > 0) {
            const latest = [...journalDigest].sort((a, b) => b.date.localeCompare(a.date))[0]?.date
            try { localStorage.setItem('euroPlanner_lastSeenStory', latest) } catch {}
        }
    }

    // ── Map initialization ────────────────────────────────────────────────────

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return

        const map = L.map(mapRef.current, { center: [46, 10], zoom: 5, zoomControl: false })
        L.control.zoom({ position: 'bottomright' }).addTo(map)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd', maxZoom: 19
        }).addTo(map)

        const mainCities = tripItinerary.filter(c => !isTransferCity(c))
        if (mainCities.length > 1) {
            const bounds = L.latLngBounds(mainCities.map(c => [c.lat, c.lng]))
            map.fitBounds(bounds, { padding: [60, 60] })
        }

        L.polyline(tripItinerary.map(c => [c.lat, c.lng]), {
            color: '#C4704F', weight: 2.5, dashArray: '8, 8', opacity: 0.6
        }).addTo(map)

        const formatDate = (d) => {
            if (!d) return ''
            const dt = new Date(d + 'T00:00:00')
            return (dt.getMonth() + 1) + '/' + dt.getDate()
        }

        tripItinerary.forEach((city) => {
            const isTransfer = isTransferCity(city)
            const markerIcon = L.divIcon({
                className: 'custom-marker',
                html: isTransfer
                    ? '<div style="background:var(--color-gold);width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:12px;">🚂</div>'
                    : '<div style="background:var(--color-terracotta);width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>',
                iconSize: isTransfer ? [24, 24] : [30, 30],
                iconAnchor: isTransfer ? [12, 12] : [15, 30]
            })

            const marker = L.marker([city.lat, city.lng], { icon: markerIcon }).addTo(map)
            marker.on('click', () => {
                setSelectedCity(city)
                setAiSummary(null)
                map.flyTo([city.lat, city.lng], 11, { duration: 0.5 })
            })

            const dateLabel = (!isTransfer && city.startDate && city.endDate)
                ? ' <span style="opacity:0.65;font-size:9px;margin-left:3px;">' + formatDate(city.startDate) + '&ndash;' + formatDate(city.endDate) + '</span>'
                : ''
            const labelIcon = L.divIcon({
                className: 'city-label-container',
                html: '<div style="background:' + (isTransfer ? 'var(--color-gold)' : 'white') + ';color:' + (isTransfer ? 'white' : 'var(--color-text)') + ';padding:3px 7px;border-radius:4px;font-size:' + (isTransfer ? '10px' : '11px') + ';font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.18);">' + city.city + dateLabel + '</div>',
                iconAnchor: [-18, 14]
            })
            L.marker([city.lat, city.lng], { icon: labelIcon, interactive: false }).addTo(map)
        })

        mapInstanceRef.current = map
        return () => {
            if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
        }
    }, [])

    // Invalidate Leaflet map size when switching to map view
    useEffect(() => {
        if (trackerView === 'map' && mapInstanceRef.current) {
            setTimeout(() => {
                mapInstanceRef.current?.invalidateSize()
                const mainCities = tripItinerary.filter(c => !isTransferCity(c))
                if (mainCities.length > 1) {
                    const bounds = L.latLngBounds(mainCities.map(c => [c.lat, c.lng]))
                    mapInstanceRef.current?.fitBounds(bounds, { padding: [60, 60] })
                }
            }, 100)
        }
    }, [trackerView])

    // City summary for map popup
    useEffect(() => {
        if (!selectedCity || isTransferCity(selectedCity)) return
        setLoadingSummary(true)
        setAiSummary(null)

        const cityActivities = (activities || []).filter(a => {
            const ac = (a.city || '').toLowerCase()
            const sc = selectedCity.city.toLowerCase()
            return (ac === sc || ac.includes(sc) || sc.includes(ac)) && a.status === 'approved' && !a.isSample
        })

        const activityList = cityActivities.length > 0
            ? cityActivities.map(a => '- ' + a.title + (a.kidName ? ' (' + a.kidName + ')' : '')).join('\n')
            : 'Nothing locked in yet for this stop.'

        const dateRange = (selectedCity.startDate && selectedCity.endDate)
            ? 'from ' + selectedCity.startDate + ' to ' + selectedCity.endDate : ''

        const prompt = 'Team Wonder & Awe (two parents and two kids ages 11 and 14) is spending time in '
            + selectedCity.city + ', ' + selectedCity.country + ' ' + dateRange
            + ' during their 3-week Europe trip in summer 2026.\n\n'
            + 'Approved plans so far:\n' + activityList
            + '\n\nWrite a warm, friendly 2-3 sentence summary of what they have planned, '
            + 'written for friends and family following along from home. '
            + 'Keep it conversational and enthusiastic. '
            + 'Always refer to the family as **_Team Wonder & Awe_** — bold italic, exactly that phrasing. Never say "the family" or any other variation. '
            + 'If nothing is booked yet, say plans are still taking shape and that is part of the fun.'

        fetchCitySummary(prompt).then(text => {
            setAiSummary(text)
            setLoadingSummary(false)
        })
    }, [selectedCity])

    const isTransferSelected = selectedCity && isTransferCity(selectedCity)

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div style={{ height: '100%', position: 'relative' }}>

            {/* ── Always-mounted map layer (display:none keeps Leaflet alive) ── */}
            <div style={{ position: 'absolute', inset: 0, display: trackerView === 'map' ? 'flex' : 'none', flexDirection: 'column', zIndex: 1 }}>
                <SubHeader title="🗺️ Trip Map" onBack={() => setTrackerView('home')} />
                <div style={{ flex: 1, position: 'relative' }}>
                    <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

                    {selectedCity && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)', maxHeight: '55%', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out', zIndex: 1000 }}>
                            <div style={{ padding: 'var(--space-sm)', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                <div style={{ width: '40px', height: '4px', background: 'var(--color-tan)', borderRadius: '2px' }} />
                            </div>
                            <div style={{ padding: '0 var(--space-md) var(--space-md)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                                            {isTransferSelected ? '✈️ Transfer Day' : selectedCity.city}
                                        </h2>
                                        <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                                            {fmtLongDate(selectedCity.startDate)}{selectedCity.endDate !== selectedCity.startDate ? ' – ' + fmtLongDate(selectedCity.endDate) : ''}
                                        </p>
                                    </div>
                                    <button onClick={() => { setSelectedCity(null); setAiSummary(null) }} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}>
                                        <Icon name="X" size={20} color="var(--color-text-light)" />
                                    </button>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
                                {isTransferSelected ? (
                                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                        🎯 This is a kids' choice stop — Abby and Tyler pick the destination!
                                    </p>
                                ) : (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-sm)' }}>
                                            <Icon name="Sparkles" size={14} color="var(--color-gold)" />
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>What's planned</span>
                                        </div>
                                        {loadingSummary ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                                                <div style={{ width: '16px', height: '16px', border: '2px solid var(--color-tan)', borderTopColor: 'var(--color-terracotta)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                                                Generating summary...
                                            </div>
                                        ) : (
                                            <div className="markdown-content" style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--color-text)' }} dangerouslySetInnerHTML={{ __html: marked.parse(aiSummary || '') }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!selectedCity && (
                        <div style={{ position: 'absolute', bottom: 'var(--space-lg)', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-md)', fontSize: '0.9rem', color: 'var(--color-text-light)', whiteSpace: 'nowrap', zIndex: 1000 }}>
                            👆 Tap a city to see what's planned
                        </div>
                    )}
                </div>
            </div>

            {/* ── Home: photo strip + feature grid ── */}
            {trackerView === 'home' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
                    <SubHeader title="Follow Along 👁️" subtitle="Team Wonder & Awe · Summer 2026" onBack={onBack} />
                    <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-lg)', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>

                        {/* Photo strip */}
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-sm)' }}>
                                Latest Moments
                            </div>
                            {recentPhotos.length > 0 ? (
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    {recentPhotos.map((photo, i) => (
                                        <PhotoThumb key={photo.id} photo={photo} index={i} onOpen={(idx) => setLightbox({ photos: recentPhotos, index: idx })} />
                                    ))}
                                </div>
                            ) : (
                                <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)', border: '1.5px dashed var(--color-border)', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                    📷 Photos will appear here once the adventure begins
                                </div>
                            )}
                        </div>

                        {/* Feature grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <button onClick={() => setTrackerView('familyFeed')} style={trackerCardStyle}>
                                <div style={{ fontSize: '34px', marginBottom: '8px' }}>📸</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>Family Feed</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '3px' }}>Photos &amp; journal updates</div>
                            </button>

                            <button onClick={() => { setTrackerView('dailyStories'); markStorySeen() }} style={{ ...trackerCardStyle, position: 'relative' }}>
                                {hasNewStory && (
                                    <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: 'var(--color-terracotta)', borderRadius: '50%' }} />
                                )}
                                <div style={{ fontSize: '34px', marginBottom: '8px' }}>✨</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>Daily Stories</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '3px' }}>AI-written daily recaps</div>
                            </button>

                            <button onClick={() => setTrackerView('slideshow')} style={trackerCardStyle}>
                                <div style={{ fontSize: '34px', marginBottom: '8px' }}>🎞️</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>Slideshow</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '3px' }}>Relive the moments</div>
                            </button>

                            <button onClick={() => setTrackerView('map')} style={trackerCardStyle}>
                                <div style={{ fontSize: '34px', marginBottom: '8px' }}>🗺️</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>Trip Map</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '3px' }}>Cities &amp; route</div>
                            </button>

                            <button onClick={onOpenCityGuides} style={{ ...trackerCardStyle, gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: '34px', marginBottom: '8px' }}>🏛️</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>Our Cities</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '3px' }}>Guides, activities &amp; local phrases</div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Family Feed ── */}
            {trackerView === 'familyFeed' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
                    <SubHeader title="📸 Family Feed" onBack={() => setTrackerView('home')} />
                    <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)', background: 'var(--color-cream)' }}>
                        {allEntries.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)', animation: 'fadeIn 0.5s ease-out' }}>
                                <div style={{ fontSize: '52px', marginBottom: 'var(--space-md)' }}>📸</div>
                                <p style={{ fontWeight: 600, color: 'var(--color-navy)', marginBottom: 'var(--space-sm)' }}>No memories yet</p>
                                <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>Check back once the adventure starts — Team Wonder &amp; Awe will post their moments here!</p>
                            </div>
                        ) : (
                            sortedDates.map(dateKey => {
                                const dayEntries = [...grouped[dateKey]].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                const photos = dayEntries.filter(e => e.entryType === 'photo' || e.photoUrl)
                                const journals = dayEntries.filter(e => e.entryType !== 'photo' && !e.photoUrl && e.entryText)
                                return (
                                    <div key={dateKey} style={{ marginBottom: 'var(--space-xl)', animation: 'slideUp 0.4s ease-out' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-sm)', paddingBottom: 'var(--space-xs)', borderBottom: '1px solid var(--color-border)' }}>
                                            📅 {formatDay(dateKey)}
                                        </div>

                                        {photos.length > 0 && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: 'var(--space-sm)' }}>
                                                {photos.map(entry => {
                                                    const photoCommentCount = (comments || []).filter(c => c.entryId === entry.id).length
                                                    return (
                                                        <div key={entry.id} onClick={() => setLightbox({ photos: allPhotos, index: allPhotos.findIndex(p => p.id === entry.id) })} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'var(--color-tan)' }}>
                                                            <img src={getThumbUrl(entry.photoUrl)} alt={entry.entryText || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.55))', padding: '20px 6px 6px' }}>
                                                                <div style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>{entry.userName}</div>
                                                                {entry.entryText && <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', marginTop: '1px' }}>{entry.entryText}</div>}
                                                            </div>
                                                            {photoCommentCount > 0 && (
                                                                <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.65)', borderRadius: 'var(--radius-full)', padding: '2px 5px', color: 'white', fontSize: '0.65rem', fontWeight: 700 }}>
                                                                    💬 {photoCommentCount}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {journals.map(entry => {
                                            const isHearted = heartedIds.includes(entry.id)
                                            const commentCount = (comments || []).filter(c => c.entryId === entry.id).length
                                            const isExpanded = expandedComments.has(entry.id)
                                            return (
                                                <div key={entry.id} style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', marginBottom: 'var(--space-sm)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)' }}>{entry.userName}</span>
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', background: 'var(--color-cream)', padding: '3px 9px', borderRadius: 'var(--radius-full)' }}>📍 {entry.city}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {entry.mood && <span style={{ fontSize: '22px', lineHeight: 1 }}>{entry.mood}</span>}
                                                            <button onClick={() => toggleComments(entry.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#2E7D32', border: '1px solid #2E7D32', borderRadius: 'var(--radius-full)', padding: '8px 14px', cursor: 'pointer', fontSize: '0.9rem', color: 'white', fontWeight: 600, transition: 'all 0.15s', opacity: isExpanded ? 1 : 0.85, minHeight: '40px' }}>
                                                                💬{commentCount > 0 ? ` ${commentCount}` : ''}
                                                            </button>
                                                            <button onClick={() => onHeartEntry && onHeartEntry(entry.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: isHearted ? '#FFF0F0' : 'var(--color-cream)', border: isHearted ? '1px solid #FFCCCC' : '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '8px 14px', cursor: 'pointer', fontSize: '0.9rem', color: isHearted ? 'var(--color-error)' : 'var(--color-text-light)', fontWeight: 600, transition: 'all 0.15s', minHeight: '40px' }}>
                                                                {isHearted ? '❤️' : '🤍'}{entry.heartCount > 0 ? ` ${entry.heartCount}` : ''}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--color-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{entry.entryText}</p>
                                                    {isExpanded && (
                                                        <CommentSection entryId={entry.id} entryType="journal" comments={comments} onAddComment={onAddComment} commenterName={commenterName} onSetCommenterName={handleSetCommenterName} />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ── Daily Stories ── */}
            {trackerView === 'dailyStories' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
                    <SubHeader title="✨ Daily Stories" onBack={() => setTrackerView('home')} />
                    <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)', background: 'var(--color-cream)' }}>
                        {(!journalDigest || journalDigest.length === 0) ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)', animation: 'fadeIn 0.5s ease-out' }}>
                                <div style={{ fontSize: '52px', marginBottom: 'var(--space-md)' }}>📖</div>
                                <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '1.05rem', marginBottom: 'var(--space-sm)' }}>No stories yet</p>
                                <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                    Check back once Team Wonder &amp; Awe hits the road — daily stories will appear here!
                                </p>
                            </div>
                        ) : (
                            [...journalDigest].sort((a, b) => b.date.localeCompare(a.date)).map(entry => {
                                const isOpen = expandedStory === entry.date
                                const fmt = d => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }
                                return (
                                    <div key={entry.date} style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', animation: 'slideUp 0.4s ease-out', cursor: 'pointer' }}
                                        onClick={() => setExpandedStory(isOpen ? null : entry.date)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>✨ Daily Story</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)', marginTop: '2px' }}>{fmt(entry.date)}</div>
                                            </div>
                                            <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} color="var(--color-text-light)" />
                                        </div>
                                        <p style={{ fontSize: '0.95rem', lineHeight: 1.75, color: 'var(--color-text)', margin: 0, whiteSpace: 'pre-wrap' }}>
                                            {isOpen ? entry.story : (entry.story?.slice(0, 180) + (entry.story?.length > 180 ? '…' : ''))}
                                        </p>
                                        {isOpen && entry.generatedBy && (
                                            <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border)', fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                                                Written by Claude · curated by {entry.generatedBy}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ── Slideshow ── */}
            {trackerView === 'slideshow' && (
                <div style={{ position: 'absolute', inset: 0 }}>
                    <SlideshowScreen onBack={() => setTrackerView('home')} journalEntries={journalEntries} userProfiles={userProfiles} />
                </div>
            )}

            {/* ── Lightbox ── */}
            {lightbox && (
                <Lightbox
                    photos={lightbox.photos}
                    initialIndex={lightbox.index}
                    onClose={() => setLightbox(null)}
                    comments={comments}
                    onAddComment={onAddComment}
                    commenterName={commenterName}
                    onSetCommenterName={handleSetCommenterName}
                />
            )}
        </div>
    )
}
