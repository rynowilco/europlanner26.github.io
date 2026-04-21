import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import { CONFIG, marked } from '../config'
import { Icon } from '../components/Icon'

// Inline Claude API call for city summaries — reuses same proxy endpoint
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

const getThumbUrl = (url, size = 'w400') => {
    if (!url) return null
    const match = url.match(/[?&]id=([^&]+)/)
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=${size}` : url
}

const formatDay = (dateStr) => {
    if (!dateStr) return 'Unknown Date'
    const dt = new Date(dateStr + 'T00:00:00')
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const Lightbox = ({ entry, onClose }) => (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 'calc(var(--space-xl) + env(safe-area-inset-top, 0px))', right: 'var(--space-lg)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="X" size={20} color="white" />
        </button>
        <img src={getThumbUrl(entry.photoUrl, 'w1600')} alt={entry.entryText || 'Photo'} onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
        {entry.entryText && <p style={{ color: 'white', marginTop: 'var(--space-md)', fontSize: '0.95rem', lineHeight: 1.6, textAlign: 'center', maxWidth: '500px' }}>{entry.entryText}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>
            <span>{entry.userName}</span>
            <span>·</span>
            <span>{entry.city}</span>
        </div>
    </div>
)

export const TrackerScreen = ({ onBack, activities, itinerary, journalEntries, onHeartEntry }) => {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const [selectedCity, setSelectedCity] = useState(null)
    const [aiSummary, setAiSummary] = useState(null)
    const [loadingSummary, setLoadingSummary] = useState(false)
    const [trackerTab, setTrackerTab] = useState('map')
    const [lightboxEntry, setLightboxEntry] = useState(null)

    const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
    const isTransferCity = (city) => city.isTransfer || city.city.toLowerCase().includes('transfer') || city.city.toLowerCase().includes('kids choice')

    const fmtLongDate = (d) => {
        if (!d) return ''
        const dt = new Date(d + 'T00:00:00')
        return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    }

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

    // Fetch AI summary when a non-transfer city is selected
    useEffect(() => {
        if (!selectedCity || isTransferCity(selectedCity)) return

        setLoadingSummary(true)
        setAiSummary(null)

        const cityActivities = activities.filter(a => {
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

    // Memories tab data — photos + journal entries, grouped by date
    const allEntries = (journalEntries || []).filter(e => e.userId && (e.entryText || e.photoUrl))
    const grouped = allEntries.reduce((acc, e) => {
        const key = e.date || (e.timestamp ? e.timestamp.split('T')[0] : 'Unknown')
        if (!acc[key]) acc[key] = []
        acc[key].push(e)
        return acc
    }, {})
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
    const heartedIds = JSON.parse(localStorage.getItem('euroPlanner_heartedEntries') || '[]')

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-md)', paddingTop: 'calc(var(--space-md) + env(safe-area-inset-top, 0px))', background: 'white', boxShadow: 'var(--shadow-sm)', flexShrink: 0, zIndex: 10 }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 'var(--space-sm)', cursor: 'pointer', marginRight: 'var(--space-sm)' }}>
                    <Icon name="ArrowLeft" size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.2 }}>Follow Along 👁️</h1>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Team Wonder &amp; Awe · Summer 2026</p>
                </div>
            </header>

            {/* Tab bar */}
            <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
                {[{ key: 'map', label: '🗺️ Trip Map' }, { key: 'memories', label: '📸 Memories' }].map(t => (
                    <button key={t.key} onClick={() => setTrackerTab(t.key)} style={{ flex: 1, padding: 'var(--space-md)', background: 'none', border: 'none', borderBottom: trackerTab === t.key ? '2px solid var(--color-terracotta)' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: trackerTab === t.key ? 600 : 400, color: trackerTab === t.key ? 'var(--color-terracotta)' : 'var(--color-text-light)', transition: 'all 0.15s' }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Map tab — always mounted, hidden via CSS to keep Leaflet initialized */}
            <div style={{ flex: 1, position: 'relative', display: trackerTab === 'map' ? 'block' : 'none' }}>
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

            {/* Memories tab — photos + journal entries grouped by date */}
            {trackerTab === 'memories' && (
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

                                    {/* Photo grid */}
                                    {photos.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', marginBottom: 'var(--space-sm)' }}>
                                            {photos.map(entry => (
                                                <div key={entry.id} onClick={() => setLightboxEntry(entry)} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'var(--color-tan)' }}>
                                                    <img src={getThumbUrl(entry.photoUrl)} alt={entry.entryText || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.55))', padding: '20px 6px 6px' }}>
                                                        <div style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>{entry.userName}</div>
                                                        {entry.entryText && <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', marginTop: '1px' }}>{entry.entryText}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Journal entries */}
                                    {journals.map(entry => {
                                        const isHearted = heartedIds.includes(entry.id)
                                        return (
                                            <div key={entry.id} style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-sm)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-navy)' }}>{entry.userName}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', background: 'var(--color-cream)', padding: '2px 7px', borderRadius: 'var(--radius-full)' }}>📍 {entry.city}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {entry.mood && <span style={{ fontSize: '18px', lineHeight: 1 }}>{entry.mood}</span>}
                                                        <button onClick={() => onHeartEntry && onHeartEntry(entry.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: isHearted ? '#FFF0F0' : 'var(--color-cream)', border: isHearted ? '1px solid #FFCCCC' : '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', color: isHearted ? 'var(--color-error)' : 'var(--color-text-light)', fontWeight: 600, transition: 'all 0.15s' }}>
                                                            {isHearted ? '❤️' : '🤍'} {entry.heartCount > 0 ? entry.heartCount : ''}
                                                        </button>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--color-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{entry.entryText}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {lightboxEntry && <Lightbox entry={lightboxEntry} onClose={() => setLightboxEntry(null)} />}
        </div>
    )
}
