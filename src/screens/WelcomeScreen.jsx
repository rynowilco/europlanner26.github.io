import React, { useState, useEffect } from 'react'
import { Icon } from '../components/Icon'

export const WelcomeScreen = ({
    onSelectUser, onSelectMemories, userProfiles, activities,
    onOpenAdmin, onOpenDashboard, onOpenMap, onOpenFamilyFeed, onBack,
    itinerary, onOpenPolls, onOpenScavengerHunt
}) => {
    const [forkUser, setForkUser] = useState(null)
    const [checkInPrompt, setCheckInPrompt] = useState(null)  // null=fetching, ''=none, 'text'=ready
    const [checkInDismissed, setCheckInDismissed] = useState(false)
    const [checkInMode, setCheckInMode] = useState(false)
    const journalActive = true

    // ── Daily check-in prompt (Claude-generated, cached per city+date) ──────────
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]
        const cacheKey = `ep26_checkin_${today}`

        // Read from cache first
        try {
            const cached = localStorage.getItem(cacheKey)
            if (cached) {
                const { prompt, dismissed } = JSON.parse(cached)
                setCheckInPrompt(prompt || '')
                setCheckInDismissed(dismissed || false)
                return
            }
        } catch {}

        // Find current city from itinerary
        const allStops = (itinerary && itinerary.length > 0) ? itinerary : []
        const currentStop = allStops.find(c => c.startDate <= today && today <= c.endDate)
        if (!currentStop || currentStop.isTransfer) { setCheckInPrompt(''); return }

        // Fetch from Claude
        fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 60,
                system: 'You write short, warm, specific daily journal prompts for kids on a family Europe trip. Respond with ONE question only — 15 words max. No quotes, no trailing period. Make it specific and surprising, not generic.',
                messages: [{ role: 'user', content: `Journal prompt for a family currently in ${currentStop.city}, ${currentStop.country}.` }]
            })
        })
            .then(r => r.json())
            .then(data => {
                const prompt = data.content?.[0]?.text?.trim() || ''
                try { localStorage.setItem(cacheKey, JSON.stringify({ prompt, dismissed: false })) } catch {}
                setCheckInPrompt(prompt)
            })
            .catch(() => setCheckInPrompt(''))
    }, [])

    const dismissCheckIn = () => {
        const today = new Date().toISOString().split('T')[0]
        try {
            const cached = JSON.parse(localStorage.getItem(`ep26_checkin_${today}`) || '{}')
            localStorage.setItem(`ep26_checkin_${today}`, JSON.stringify({ ...cached, dismissed: true }))
        } catch {}
        setCheckInDismissed(true)
        setCheckInMode(false)
    }

    const handleCardTap = (key) => {
        if (journalActive) { setForkUser(key) }
        else { onSelectUser(key) }
    }

    const handleMakeMemories = () => {
        const prompt = checkInMode ? checkInPrompt : null
        const user = forkUser
        setForkUser(null)
        setCheckInMode(false)
        onSelectMemories(user, prompt)
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)', padding: 'var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', overflow: 'auto' }}>
            <header style={{ textAlign: 'center', paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-lg)', animation: 'slideUp 0.6s ease-out', position: 'relative' }}>
                <button onClick={onBack} style={{ position: 'absolute', left: 0, top: 'var(--space-xl)', background: 'var(--color-navy)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '0.9rem', fontWeight: 600, padding: '8px 14px', boxShadow: 'var(--shadow-sm)' }}>
                    🏠 Home
                </button>
                <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🌍✈️</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 8vw, 2.5rem)', fontWeight: 600, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>Euro Explorers</h1>
                <p style={{ fontSize: '1rem', color: 'var(--color-text-light)', maxWidth: '280px', margin: '0 auto', lineHeight: 1.5 }}>Plan your European adventure with your AI travel buddy</p>
            </header>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: '400px', margin: '0 auto', width: '100%' }}>

                {/* ── Daily Check-In Banner ─────────────────────────────────────── */}
                {checkInPrompt && !checkInDismissed && (
                    <div style={{ background: 'linear-gradient(135deg, #c8603a, #d97f55)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', boxShadow: 'var(--shadow-md)', animation: 'slideUp 0.45s ease-out 0.1s both' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '5px' }}>📖 Today's Journal Prompt</div>
                                <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.45 }}>{checkInPrompt}</div>
                            </div>
                            <button onClick={dismissCheckIn} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: 'white', width: '28px', height: '28px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', lineHeight: 1 }}>×</button>
                        </div>
                        <button
                            onClick={() => setCheckInMode(m => !m)}
                            style={{ marginTop: '10px', background: checkInMode ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 'var(--radius-sm)', padding: '7px 16px', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s', width: '100%' }}
                        >
                            {checkInMode ? '✓ Now tap your name below to journal ↓' : 'Journal Now ✍️'}
                        </button>
                    </div>
                )}

                {/* ── Deadline countdown ───────────────────────────────────────── */}
                {(() => {
                    const deadlineDays = Math.ceil((new Date('2026-05-11') - new Date()) / (1000 * 60 * 60 * 24))
                    const abbyApproved = activities.filter(a => a.kidId === 'abby' && a.status === 'approved' && !a.isSample).length
                    const tylerApproved = activities.filter(a => a.kidId === 'tyler' && a.status === 'approved' && !a.isSample).length
                    const totalApproved = abbyApproved + tylerApproved
                    const totalNeeded = 6
                    const pct = Math.round((totalApproved / totalNeeded) * 100)
                    const urgentColor = deadlineDays <= 14 ? 'var(--color-error)' : deadlineDays <= 30 ? 'var(--color-warning)' : 'var(--color-sage)'
                    return (
                        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', animation: 'fadeIn 0.5s ease-out' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>📅 Activity Deadline</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: urgentColor }}>{deadlineDays}d left</span>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>⚽ Abby {abbyApproved}/3</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>🏈 Tyler {tylerApproved}/3</span>
                            </div>
                            <div style={{ background: 'var(--color-tan)', borderRadius: 'var(--radius-full)', height: '6px', overflow: 'hidden' }}>
                                <div style={{ background: urgentColor, height: '100%', width: pct + '%', borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }} />
                            </div>
                        </div>
                    )
                })()}

                <p style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--color-text-light)', animation: 'fadeIn 0.6s ease-out 0.2s both', margin: 0 }}>"Who's planning today?"</p>

                {/* ── Kids ─────────────────────────────────────────────────────── */}
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 'var(--space-sm)' }}>The Kids</div>
                {Object.entries(userProfiles).filter(([key]) => !userProfiles[key].isParent).map(([key, user], index) => {
                    const approved = activities.filter(a => a.kidId === key && a.status === 'approved' && !a.isSample).length
                    const locked = false
                    const isCheckInTarget = checkInMode
                    return (
                        <button key={key} onClick={() => !locked && handleCardTap(key)} disabled={locked}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)', background: locked ? 'var(--color-tan)' : 'white', border: `2px solid ${isCheckInTarget ? '#c8603a' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', cursor: locked ? 'not-allowed' : 'pointer', boxShadow: isCheckInTarget ? '0 0 0 3px rgba(200,96,58,0.15)' : 'var(--shadow-sm)', animation: `slideUp 0.5s ease-out ${0.3 + index * 0.1}s both`, textAlign: 'left', transition: 'all 0.2s', opacity: locked ? 0.6 : 1 }}
                            onMouseEnter={e => { if (!locked) { e.currentTarget.style.borderColor = isCheckInTarget ? '#c8603a' : user.color; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = isCheckInTarget ? '#c8603a' : 'var(--color-border)'; e.currentTarget.style.transform = 'none' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>{locked ? '🔒' : user.emoji}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user.name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>{locked ? 'Sign in to plan' : isCheckInTarget ? '✍️ Tap to journal' : `${approved}/3 activities`}</div>
                            </div>
                            <Icon name={locked ? 'Lock' : 'ChevronRight'} size={24} color="var(--color-text-light)" />
                        </button>
                    )
                })}

                {/* ── Parents ───────────────────────────────────────────────────── */}
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 'var(--space-md)' }}>The Parents</div>
                {Object.entries(userProfiles).filter(([key]) => userProfiles[key].isParent).map(([key, user], index) => {
                    const approved = activities.filter(a => a.kidId === key && a.status === 'approved' && !a.isSample).length
                    const locked = false
                    const isCheckInTarget = checkInMode
                    return (
                        <button key={key} onClick={() => !locked && handleCardTap(key)} disabled={locked}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)', background: locked ? 'var(--color-tan)' : 'white', border: `2px solid ${isCheckInTarget ? '#c8603a' : 'var(--color-border)'}`, borderRadius: 'var(--radius-lg)', cursor: locked ? 'not-allowed' : 'pointer', boxShadow: isCheckInTarget ? '0 0 0 3px rgba(200,96,58,0.15)' : 'var(--shadow-sm)', animation: `slideUp 0.5s ease-out ${0.5 + index * 0.1}s both`, textAlign: 'left', transition: 'all 0.2s', opacity: locked ? 0.6 : 1 }}
                            onMouseEnter={e => { if (!locked) { e.currentTarget.style.borderColor = isCheckInTarget ? '#c8603a' : user.color; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = isCheckInTarget ? '#c8603a' : 'var(--color-border)'; e.currentTarget.style.transform = 'none' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>{locked ? '🔒' : user.emoji}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user.name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>{locked ? 'Sign in to plan' : isCheckInTarget ? '✍️ Tap to journal' : `${approved} activities`}</div>
                            </div>
                            <Icon name={locked ? 'Lock' : 'ChevronRight'} size={24} color="var(--color-text-light)" />
                        </button>
                    )
                })}

                {/* ── Action buttons row 1 ──────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', animation: 'fadeIn 0.6s ease-out 0.5s both' }}>
                    <button onClick={onOpenMap} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)', background: 'var(--color-sage)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                        <Icon name="Map" size={18} color="white" /> Trip Map
                    </button>
                    <button onClick={onOpenDashboard} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)', background: 'var(--color-tan)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                        <Icon name="List" size={18} /> Activities
                    </button>
                    <button onClick={onOpenFamilyFeed} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)', background: 'var(--color-terracotta)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                        📸 Feed
                    </button>
                </div>

                {/* ── Action buttons row 2: Polls + Scavenger Hunt ──────────────── */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', animation: 'fadeIn 0.6s ease-out 0.58s both' }}>
                    <button onClick={onOpenPolls} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: 'var(--space-md)', background: '#4a7fc1', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                        🗳️ Polls
                    </button>
                    <button onClick={onOpenScavengerHunt} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: 'var(--space-md)', background: '#5a9e6f', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                        🔍 Hunt
                    </button>
                </div>

                {/* ── Admin ─────────────────────────────────────────────────────── */}
                <button onClick={onOpenAdmin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', width: '100%', marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: '#1a1a2e', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.5px', animation: 'fadeIn 0.6s ease-out 0.6s both' }}>
                    🔒 Admin Area
                </button>
            </div>

            {/* ── Journey Mode Fork — bottom sheet ─────────────────────────────── */}
            {forkUser && (() => {
                const u = userProfiles[forkUser] || {}
                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setForkUser(null)}>
                        <div style={{ background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', padding: 'var(--space-xl)', width: '100%', animation: 'slideUp 0.25s ease-out' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                                <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{u.emoji}</div>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Hey {u.name}!</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>What do you want to do?</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <button onClick={() => { setForkUser(null); setCheckInMode(false); onSelectUser(forkUser) }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)', background: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, textAlign: 'left' }}>
                                    <span style={{ fontSize: '24px' }}>💬</span>
                                    <div>
                                        <div>Plan the Trip</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.75 }}>Chat with your AI travel buddy</div>
                                    </div>
                                </button>
                                <button onClick={handleMakeMemories} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)', background: checkInMode ? 'linear-gradient(135deg, #c8603a, #d97f55)' : 'white', color: checkInMode ? 'white' : 'var(--color-navy)', border: checkInMode ? 'none' : '2px solid var(--color-navy)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, textAlign: 'left' }}>
                                    <span style={{ fontSize: '24px' }}>📖</span>
                                    <div>
                                        <div>Make Memories</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 400, opacity: checkInMode ? 0.85 : undefined, color: checkInMode ? 'rgba(255,255,255,0.85)' : 'var(--color-text-light)' }}>
                                            {checkInMode ? `"${checkInPrompt}"` : 'Journal, photos & moments'}
                                        </div>
                                    </div>
                                </button>
                            </div>
                            <button onClick={() => setForkUser(null)} style={{ width: '100%', marginTop: 'var(--space-md)', padding: 'var(--space-sm)', background: 'none', border: 'none', color: 'var(--color-text-light)', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}
