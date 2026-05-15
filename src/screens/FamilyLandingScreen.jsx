import React from 'react'
import { Icon } from '../components/Icon'

export const FamilyLandingScreen = ({
    userProfiles, activities, onSelectUser, onOpenAdmin, onBack, euroLedger
}) => {
    const getEuroBalance = (userId) => {
        const total = (euroLedger || [])
            .filter(e => e.userId === userId)
            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
        return Math.max(0, parseFloat(total.toFixed(2)))
    }

    const kids    = Object.entries(userProfiles || {}).filter(([, u]) => !u.isParent)
    const parents = Object.entries(userProfiles || {}).filter(([, u]) =>  u.isParent)

    return (
        <div style={{
            height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto',
            background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)',
            padding: 'var(--space-lg)',
            paddingTop: 'calc(var(--space-xl) + env(safe-area-inset-top, 0px))',
        }}>
            {/* Header */}
            <header style={{ position: 'relative', textAlign: 'center', paddingBottom: 'var(--space-md)', animation: 'slideUp 0.5s ease-out' }}>
                <button
                    onClick={onBack}
                    style={{ position: 'absolute', left: 0, top: 0, background: 'var(--color-navy)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '0.9rem', fontWeight: 600, padding: '8px 14px', boxShadow: 'var(--shadow-sm)' }}
                >
                    🏠 Home
                </button>
                <button
                    onClick={onOpenAdmin}
                    title="Admin area"
                    style={{ position: 'absolute', right: 0, top: 0, background: 'rgba(26,26,46,0.07)', border: '1px solid rgba(26,26,46,0.1)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '7px 10px', fontSize: '1rem', lineHeight: 1, color: 'var(--color-navy)' }}
                >
                    🔐
                </button>
                <div style={{ fontSize: '44px', marginBottom: 'var(--space-sm)', paddingTop: '4px' }}>🌍✈️</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 7vw, 2.2rem)', fontWeight: 600, color: 'var(--color-navy)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                    Euro Explorers
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>Who's exploring today?</p>
            </header>

            {/* Euro Leaderboard */}
            {kids.length > 0 && (
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md) var(--space-lg)', marginBottom: 'var(--space-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', animation: 'slideUp 0.5s ease-out 0.08s both' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
                        💶 Euro Leaderboard
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        {kids.map(([key, user]) => (
                            <div key={key} style={{ flex: 1, textAlign: 'center', background: 'var(--color-cream)', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-xs)' }}>
                                <div style={{ fontSize: '22px', marginBottom: '2px' }}>{user.emoji}</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '2px' }}>{user.name}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2a7a45' }}>€{getEuroBalance(key).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* User cards */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', maxWidth: '400px', margin: '0 auto', width: '100%' }}>

                {/* Kids */}
                {kids.map(([key, user], i) => {
                    const approved = (activities || []).filter(a => a.kidId === key && a.status === 'approved' && !a.isSample).length
                    const balance  = getEuroBalance(key)
                    return (
                        <button
                            key={key}
                            onClick={() => onSelectUser(key)}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)', background: 'white', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', animation: `slideUp 0.5s ease-out ${0.15 + i * 0.1}s both`, textAlign: 'left', transition: 'all 0.2s', width: '100%' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = user.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none' }}
                        >
                            <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{user.emoji}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)' }}>{user.name}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)' }}>{approved} approved · 💶 €{balance.toFixed(2)}</div>
                            </div>
                            <Icon name="ChevronRight" size={20} color="var(--color-text-light)" />
                        </button>
                    )
                })}

                {/* Parents */}
                {parents.map(([key, user], i) => (
                    <button
                        key={key}
                        onClick={() => onSelectUser(key)}
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)', background: 'white', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', animation: `slideUp 0.5s ease-out ${0.3 + i * 0.1}s both`, textAlign: 'left', transition: 'all 0.2s', width: '100%' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = user.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'none' }}
                    >
                        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{user.emoji}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)' }}>{user.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>Parent</div>
                        </div>
                        <Icon name="ChevronRight" size={20} color="var(--color-text-light)" />
                    </button>
                ))}
            </div>
        </div>
    )
}
