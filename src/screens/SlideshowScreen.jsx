import React, { useState, useEffect, useRef, useCallback } from 'react'
import { CONFIG } from '../config'
import { Icon } from '../components/Icon'

const USER_EMOJIS = { abby: '⚽', tyler: '🏈', ryan: '👨‍🍳', mom: '🧜‍♀️' }

export const SlideshowScreen = ({ onBack, journalEntries, userProfiles }) => {
    const photos = (journalEntries || []).filter(e => e.photoUrl).sort((a, b) => {
        const da = a.date || (a.timestamp ? a.timestamp.split('T')[0] : '')
        const db = b.date || (b.timestamp ? b.timestamp.split('T')[0] : '')
        return da.localeCompare(db)
    })

    const [displayIdx, setDisplayIdx] = useState(0)
    const [opacity, setOpacity] = useState(1)
    const [playing, setPlaying] = useState(true)
    const [musicOn, setMusicOn] = useState(false)
    const [showControls, setShowControls] = useState(true)

    const audioRef = useRef(null)
    const timerRef = useRef(null)
    const touchStartX = useRef(null)
    const controlsTimerRef = useRef(null)

    const hasMusic = !!CONFIG.SLIDESHOW_MUSIC_URL

    // Crossfade to a new index
    const goTo = useCallback((idx) => {
        setOpacity(0)
        setTimeout(() => {
            setDisplayIdx(idx)
            setOpacity(1)
        }, 400)
    }, [])

    const advance = useCallback(() => {
        setDisplayIdx(prev => {
            const next = (prev + 1) % photos.length
            goTo(next)
            return prev // goTo handles the update inside timeout
        })
    }, [goTo, photos.length])

    // Auto-advance
    useEffect(() => {
        if (!playing || photos.length === 0) return
        timerRef.current = setInterval(() => {
            setDisplayIdx(prev => {
                const next = (prev + 1) % photos.length
                goTo(next)
                return prev
            })
        }, 5000)
        return () => clearInterval(timerRef.current)
    }, [playing, photos.length, goTo])

    // Music
    useEffect(() => {
        if (!audioRef.current || !hasMusic) return
        if (musicOn) {
            audioRef.current.play().catch(() => {})
        } else {
            audioRef.current.pause()
        }
    }, [musicOn, hasMusic])

    // Auto-hide controls after 3s of inactivity
    const resetControlsTimer = () => {
        setShowControls(true)
        clearTimeout(controlsTimerRef.current)
        controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    }

    useEffect(() => {
        resetControlsTimer()
        return () => clearTimeout(controlsTimerRef.current)
    }, [])

    const handleTap = () => {
        resetControlsTimer()
        setPlaying(p => !p)
    }

    const handlePrev = (e) => {
        e.stopPropagation()
        resetControlsTimer()
        const prev = (displayIdx - 1 + photos.length) % photos.length
        goTo(prev)
    }

    const handleNext = (e) => {
        e.stopPropagation()
        resetControlsTimer()
        const next = (displayIdx + 1) % photos.length
        goTo(next)
    }

    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return
        const delta = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(delta) > 50) {
            resetControlsTimer()
            if (delta < 0) {
                const next = (displayIdx + 1) % photos.length
                goTo(next)
            } else {
                const prev = (displayIdx - 1 + photos.length) % photos.length
                goTo(prev)
            }
        }
        touchStartX.current = null
    }

    if (photos.length === 0) {
        return (
            <div style={{ height: '100%', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <div style={{ fontSize: '48px' }}>📷</div>
                <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>No photos yet</div>
                <button onClick={onBack} style={{ marginTop: '8px', color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', fontSize: '0.9rem', cursor: 'pointer' }}>Go back</button>
            </div>
        )
    }

    const photo = photos[displayIdx]
    const authorEmoji = USER_EMOJIS[photo?.userId] || '📷'
    const authorName = userProfiles?.[photo?.userId]?.name || photo?.userId || ''

    return (
        <div
            style={{ height: '100%', background: '#000', position: 'relative', overflow: 'hidden', userSelect: 'none' }}
            onClick={handleTap}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Photo */}
            <img
                src={photo?.photoUrl}
                alt={photo?.caption || ''}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity, transition: 'opacity 0.4s ease' }}
            />

            {/* Top bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)', display: 'flex', alignItems: 'center', gap: '12px', opacity: showControls ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: showControls ? 'auto' : 'none', zIndex: 10 }}>
                <button onClick={(e) => { e.stopPropagation(); onBack() }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <Icon name="X" size={20} color="white" />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>📸 Trip Slideshow</div>
                    <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem' }}>{displayIdx + 1} of {photos.length}</div>
                </div>
                {hasMusic && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setMusicOn(m => !m) }}
                        style={{ background: musicOn ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px', padding: '6px 12px', color: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        {musicOn ? '🎵 On' : '🔇 Off'}
                    </button>
                )}
            </div>

            {/* Prev / Next arrows */}
            {showControls && (
                <>
                    <button onClick={handlePrev} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                        <Icon name="ChevronLeft" size={22} color="white" />
                    </button>
                    <button onClick={handleNext} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                        <Icon name="ChevronRight" size={22} color="white" />
                    </button>
                </>
            )}

            {/* Play/pause indicator */}
            {!playing && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
                    <div style={{ color: 'white', fontSize: '24px', marginLeft: '3px' }}>▶</div>
                </div>
            )}

            {/* Bottom caption */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)', background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)', zIndex: 10 }}>
                {photo?.caption && (
                    <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5, marginBottom: '6px' }}>
                        {photo.caption}
                    </div>
                )}
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{authorEmoji} {authorName}</span>
                    {photo?.city && <><span style={{ opacity: 0.4 }}>·</span><span>📍 {photo.city}</span></>}
                    {photo?.date && <><span style={{ opacity: 0.4 }}>·</span><span>{new Date(photo.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></>}
                </div>

                {/* Progress dots — max 12 shown */}
                {photos.length <= 20 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '12px', flexWrap: 'wrap' }}>
                        {photos.map((_, i) => (
                            <div key={i} style={{ width: i === displayIdx ? '16px' : '6px', height: '6px', borderRadius: '3px', background: i === displayIdx ? 'white' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s ease' }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Hidden audio */}
            {hasMusic && (
                <audio ref={audioRef} src={CONFIG.SLIDESHOW_MUSIC_URL} loop style={{ display: 'none' }} />
            )}
        </div>
    )
}
