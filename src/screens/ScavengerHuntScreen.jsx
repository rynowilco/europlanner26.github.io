import React, { useState } from 'react'
import { Icon } from '../components/Icon'
import { CONFIG } from '../config'

// ─── ScavengerHuntScreen ──────────────────────────────────────────────────────
// Stub screen — full functionality coming in a future session.
// Feature: Claude generates 5 city-specific cooperative photo challenges per city.
// Family earns shared points (convertible to Euros). Completed hunts saved per city.
// ─────────────────────────────────────────────────────────────────────────────

const EXAMPLE_CLUES = [
    { emoji: '🚪', text: 'Find a door with a year carved or painted on it', done: true },
    { emoji: '⛲', text: 'Photograph a fountain that\'s actually running', done: true },
    { emoji: '🐦', text: 'Capture a pigeon doing something weird', done: false },
    { emoji: '🔢', text: 'Find a street address with all the same digit', done: false },
    { emoji: '🛵', text: 'Spot a delivery scooter loaded with something unexpected', done: false },
]

export const ScavengerHuntScreen = ({ onBack, itinerary }) => {
    const [showComingSoon, setShowComingSoon] = useState(false)

    const today = new Date().toISOString().split('T')[0]
    const allStops = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
    const currentStop = allStops.find(c => c.startDate <= today && today <= c.endDate)
    const cityName = currentStop?.city || 'Your Next City'

    const doneCount = EXAMPLE_CLUES.filter(c => c.done).length

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>

            {/* Header */}
            <div style={{ background: '#5a9e6f', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
                    <Icon name="ArrowLeft" size={20} color="white" />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>🔍 Scavenger Hunt</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{cityName}</div>
                </div>
                {/* Points badge */}
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)', padding: '6px 12px', textAlign: 'center' }}>
                    <div style={{ color: 'white', fontSize: '1rem', fontWeight: 700 }}>0 pts</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.65rem', fontWeight: 600 }}>TOTAL</div>
                </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-lg)' }}>

                {/* Preview card */}
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)' }}>Example Hunt</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>This is what a hunt looks like</div>
                        </div>
                        <div style={{ background: '#f0faf3', borderRadius: 'var(--radius-md)', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600, color: '#5a9e6f' }}>
                            {doneCount}/{EXAMPLE_CLUES.length} done
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ background: 'var(--color-tan)', borderRadius: 'var(--radius-full)', height: '6px', overflow: 'hidden', marginBottom: 'var(--space-lg)' }}>
                        <div style={{ background: '#5a9e6f', height: '100%', width: `${(doneCount / EXAMPLE_CLUES.length) * 100}%`, borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
                    </div>

                    {/* Clue list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {EXAMPLE_CLUES.map((clue, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', background: clue.done ? '#f0faf3' : 'var(--color-cream)', borderRadius: 'var(--radius-md)', border: `1.5px solid ${clue.done ? '#b3dfc0' : 'var(--color-border)'}`, opacity: clue.done ? 0.8 : 1 }}>
                                <span style={{ fontSize: '22px', flexShrink: 0 }}>{clue.emoji}</span>
                                <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.4, textDecoration: clue.done ? 'line-through' : 'none' }}>{clue.text}</span>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: clue.done ? '#5a9e6f' : 'white', border: `2px solid ${clue.done ? '#5a9e6f' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {clue.done && <Icon name="Check" size={14} color="white" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How it works */}
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-md)' }}>How it works</div>
                    {[
                        { icon: '📍', text: `Arrive in a new city — a hunt is generated just for that place` },
                        { icon: '📸', text: 'Complete each challenge and snap a photo as proof' },
                        { icon: '⭐', text: 'Earn shared family points — all clues are nearby, nothing obscure' },
                        { icon: '💶', text: 'Ryan converts points to Euros (TBD) — spend at the next stop!' },
                    ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start', marginBottom: i < 3 ? 'var(--space-md)' : 0 }}>
                            <span style={{ fontSize: '20px', flexShrink: 0 }}>{step.icon}</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{step.text}</span>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <button onClick={() => setShowComingSoon(true)} style={{ width: '100%', background: '#5a9e6f', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-xl)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}>
                    🔍 Start the {cityName} Hunt
                </button>
            </div>

            {/* Coming soon */}
            {showComingSoon && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setShowComingSoon(false)}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', maxWidth: '300px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '40px', marginBottom: 'var(--space-md)' }}>🚧</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>Coming Soon</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
                            Scavenger Hunts are in the works! You'll be exploring {cityName} in no time.
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
