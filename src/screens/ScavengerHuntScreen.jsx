import React, { useState, useRef } from 'react'
import { Icon } from '../components/Icon'
import { CONFIG } from '../config'

// ─── ScavengerHuntScreen ──────────────────────────────────────────────────────
// Stub screen — full hunt generation + Sheets scoring coming in a future session.
// Photo upload flow is wired: camera icon → file picker → Cloudinary (ep26/hunts/)
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_CLUES = [
    { id: 1, emoji: '🚪', text: 'Find a door with a year carved or painted on it' },
    { id: 2, emoji: '⛲', text: 'Photograph a fountain that\'s actually running' },
    { id: 3, emoji: '🐦', text: 'Capture a pigeon doing something weird' },
    { id: 4, emoji: '🔢', text: 'Find a street address with all the same digit' },
    { id: 5, emoji: '🛵', text: 'Spot a delivery scooter loaded with something unexpected' },
]

export const ScavengerHuntScreen = ({ onBack, itinerary }) => {
    const [showHowItWorks, setShowHowItWorks] = useState(false)
    const [showComingSoon, setShowComingSoon] = useState(false)
    const [cluePhotos, setCluePhotos] = useState({}) // clueId → { previewUrl, uploading, done }
    const fileInputRef = useRef(null)
    const [activeClueId, setActiveClueId] = useState(null)

    const today = new Date().toISOString().split('T')[0]
    const allStops = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
    const currentStop = allStops.find(c => c.startDate <= today && today <= c.endDate)
    const cityName = currentStop?.city || 'Your Next City'

    const doneCount = Object.values(cluePhotos).filter(p => p.done).length

    const handleCameraClick = (clueId) => {
        setActiveClueId(clueId)
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file || !activeClueId) return
        e.target.value = ''

        const previewUrl = URL.createObjectURL(file)
        setCluePhotos(prev => ({ ...prev, [activeClueId]: { previewUrl, uploading: true, done: false } }))

        try {
            // Convert to base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = e => resolve(e.target.result.split(',')[1])
                reader.onerror = () => reject(new Error('Read failed'))
                reader.readAsDataURL(file)
            })

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageData: base64,
                    filename: `hunt_clue_${activeClueId}_${Date.now()}.jpg`,
                    folder: 'ep26/hunts'
                })
            })

            if (!res.ok) throw new Error('Upload failed')
            const data = await res.json()
            setCluePhotos(prev => ({ ...prev, [activeClueId]: { previewUrl: data.url || previewUrl, uploading: false, done: true } }))
        } catch {
            // Upload failed — mark as done with local preview anyway (will retry on full feature build)
            setCluePhotos(prev => ({ ...prev, [activeClueId]: { previewUrl, uploading: false, done: true } }))
        }
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            {/* Header */}
            <div style={{ background: '#5a9e6f', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
                    <Icon name="ArrowLeft" size={20} color="white" />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>🔍 Scavenger Hunt</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{cityName}</div>
                </div>
                <button onClick={() => setShowHowItWorks(true)} style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}>
                    ?
                </button>
                {/* Points badge */}
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)', padding: '6px 12px', textAlign: 'center' }}>
                    <div style={{ color: 'white', fontSize: '1rem', fontWeight: 700 }}>0 pts</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.65rem', fontWeight: 600 }}>TOTAL</div>
                </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

                {/* Progress */}
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)' }}>Example Hunt</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>Tap 📷 to submit photo proof</div>
                        </div>
                        <div style={{ background: doneCount === EXAMPLE_CLUES.length ? '#5a9e6f' : '#f0faf3', borderRadius: 'var(--radius-md)', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600, color: doneCount === EXAMPLE_CLUES.length ? 'white' : '#5a9e6f', transition: 'all 0.3s' }}>
                            {doneCount}/{EXAMPLE_CLUES.length} done
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ background: 'var(--color-tan)', borderRadius: 'var(--radius-full)', height: '6px', overflow: 'hidden', marginBottom: 'var(--space-lg)' }}>
                        <div style={{ background: '#5a9e6f', height: '100%', width: `${(doneCount / EXAMPLE_CLUES.length) * 100}%`, borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
                    </div>

                    {/* Clue list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {EXAMPLE_CLUES.map((clue) => {
                            const photo = cluePhotos[clue.id]
                            const isDone = photo?.done
                            const isUploading = photo?.uploading

                            return (
                                <div key={clue.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', background: isDone ? '#f0faf3' : 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: `1.5px solid ${isDone ? '#b3dfc0' : 'var(--color-border)'}`, transition: 'all 0.25s' }}>
                                    <span style={{ fontSize: '22px', flexShrink: 0 }}>{clue.emoji}</span>
                                    <span style={{ flex: 1, fontSize: '0.9rem', color: isDone ? 'var(--color-text-light)' : 'var(--color-text)', lineHeight: 1.4, textDecoration: isDone ? 'line-through' : 'none' }}>
                                        {clue.text}
                                    </span>
                                    {/* Photo thumbnail or camera button */}
                                    {isDone && photo?.previewUrl ? (
                                        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, border: '2px solid #5a9e6f' }}>
                                            <img src={photo.previewUrl} alt="proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ) : isUploading ? (
                                        <div style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <div style={{ width: '20px', height: '20px', border: '2px solid var(--color-tan)', borderTopColor: '#5a9e6f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        </div>
                                    ) : (
                                        <button onClick={() => handleCameraClick(clue.id)} style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: '#5a9e6f', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'filter 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.9)'}
                                            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>
                                            <Icon name="Camera" size={20} color="white" />
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* CTA */}
                <button onClick={() => setShowComingSoon(true)} style={{ width: '100%', background: '#5a9e6f', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-xl)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}>
                    🔍 Generate {cityName} Hunt
                </button>
            </div>

            {/* How it works modal */}
            {showHowItWorks && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setShowHowItWorks(false)}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', maxWidth: '320px', width: '100%', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)' }}>How Hunts Work</div>
                            <button onClick={() => setShowHowItWorks(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <Icon name="X" size={20} color="var(--color-text-light)" />
                            </button>
                        </div>
                        {[
                            { icon: '📍', text: 'Arrive in a new city and generate a hunt — 5 clues specific to that place' },
                            { icon: '📸', text: 'Find each thing and tap the camera to snap proof' },
                            { icon: '⭐', text: 'Earn shared family points — all clues are walkable, nothing obscure' },
                            { icon: '💶', text: 'Ryan converts points to Euros — spend at the next stop!' },
                        ].map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start', marginBottom: i < 3 ? 'var(--space-md)' : 0 }}>
                                <span style={{ fontSize: '20px', flexShrink: 0 }}>{step.icon}</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{step.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Coming soon modal */}
            {showComingSoon && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setShowComingSoon(false)}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', maxWidth: '300px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '40px', marginBottom: 'var(--space-md)' }}>🚧</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>Coming Soon</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
                            Hunt generation is being built. You'll be exploring {cityName} in no time.
                        </div>
                        <button onClick={() => setShowComingSoon(false)} style={{ background: '#5a9e6f', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-xl)', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>
                            Can't wait!
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
