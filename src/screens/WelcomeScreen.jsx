import React, { useState } from 'react'
import { Icon } from '../components/Icon'

export const WelcomeScreen = ({ onSelectUser, onSelectMemories, userProfiles, activities, onOpenAdmin, onOpenDashboard, onOpenMap, onOpenFamilyFeed, onBack }) => {
    const [forkUser, setForkUser] = useState(null)
    const journalActive = true

    const handleCardTap = (key) => {
        if (journalActive) { setForkUser(key) }
        else { onSelectUser(key) }
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
                {/* Kids section */}
                {Object.entries(userProfiles).filter(([key]) => !userProfiles[key].isParent).map(([key, user], index) => {
                    const approved = activities.filter(a => a.kidId === key && a.status === 'approved' && !a.isSample).length
                    const locked = false
                    return (
                        <button key={key} onClick={() => !locked && handleCardTap(key)} disabled={locked} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)', background: locked ? 'var(--color-tan)' : 'white', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: locked ? 'not-allowed' : 'pointer', boxShadow: 'var(--shadow-sm)', animation: `slideUp 0.5s ease-out ${0.3 + index * 0.1}s both`, textAlign: 'left', transition: 'all 0.2s', opacity: locked ? 0.6 : 1 }}
                            onMouseEnter={(e) => { if (!locked) { e.currentTarget.style.borderColor = user.color; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>{locked ? '🔒' : user.emoji}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user.name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>{locked ? 'Sign in to plan' : `${approved}/3 activities`}</div>
                            </div>
                            <Icon name={locked ? 'Lock' : 'ChevronRight'} size={24} color="var(--color-text-light)" />
                        </button>
                    )
                })}

                {Object.entries(userProfiles).filter(([key]) => userProfiles[key].isParent).map(([key, user], index) => {
                    const approved = activities.filter(a => a.kidId === key && a.status === 'approved' && !a.isSample).length
                    const locked = false
                    return (
                        <button key={key} onClick={() => !locked && handleCardTap(key)} disabled={locked} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)', background: locked ? 'var(--color-tan)' : 'white', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: locked ? 'not-allowed' : 'pointer', boxShadow: 'var(--shadow-sm)', animation: `slideUp 0.5s ease-out ${0.5 + index * 0.1}s both`, textAlign: 'left', transition: 'all 0.2s', opacity: locked ? 0.6 : 1 }}
                            onMouseEnter={(e) => { if (!locked) { e.currentTarget.style.borderColor = user.color; e.currentTarget.style.transform = 'translateY(-2px)' } }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>{locked ? '🔒' : user.emoji}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user.name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>{locked ? 'Sign in to plan' : `${approved} activities`}</div>
                            </div>
                            <Icon name={locked ? 'Lock' : 'ChevronRight'} size={24} color="var(--color-text-light)" />
                        </button>
                    )
                })}

                {/* Action buttons */}
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

                {/* Admin Area button */}
                <button onClick={onOpenAdmin} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', width: '100%', marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: '#1a1a2e', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.5px', animation: 'fadeIn 0.6s ease-out 0.6s both' }}>
                    🔒 Admin Area
                </button>
            </div>

            {/* Journey Mode Fork — bottom sheet */}
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
                                <button onClick={() => { setForkUser(null); onSelectUser(forkUser) }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)', background: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, textAlign: 'left' }}>
                                    <span style={{ fontSize: '24px' }}>💬</span>
                                    <div>
                                        <div>Plan the Trip</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.75 }}>Chat with your AI travel buddy</div>
                                    </div>
                                </button>
                                <button onClick={() => { setForkUser(null); onSelectMemories(forkUser) }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)', background: 'white', color: 'var(--color-navy)', border: '2px solid var(--color-navy)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, textAlign: 'left' }}>
                                    <span style={{ fontSize: '24px' }}>📖</span>
                                    <div>
                                        <div>Make Memories</div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-text-light)' }}>Journal, photos &amp; moments</div>
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
