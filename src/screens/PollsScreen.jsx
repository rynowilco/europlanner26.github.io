import React, { useState } from 'react'
import { Icon } from '../components/Icon'

// ─── PollsScreen ─────────────────────────────────────────────────────────────
// Stub screen — full functionality coming in a future session.
// Feature: anyone in the family creates a poll (AI-suggested or manual options),
// all Explorers vote, results sync to Sheets in real time.
// ─────────────────────────────────────────────────────────────────────────────

export const PollsScreen = ({ onBack }) => {
    const [showComingSoon, setShowComingSoon] = useState(false)

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>

            {/* Header */}
            <div style={{ background: '#4a7fc1', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
                    <Icon name="ArrowLeft" size={20} color="white" />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>🗳️ Family Polls</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Vote on what to do next</div>
                </div>
                <button onClick={() => setShowComingSoon(true)} style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)', padding: '8px 16px', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                    + New Poll
                </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2xl) var(--space-lg)', gap: 'var(--space-lg)', textAlign: 'center' }}>

                {/* Icon */}
                <div style={{ width: '80px', height: '80px', background: '#e8f0fb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                    🗳️
                </div>

                <div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>No polls yet</div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--color-text-light)', lineHeight: 1.6, maxWidth: '280px' }}>
                        When you can't decide what to do, create a poll — Claude suggests options or you write your own, then everyone votes.
                    </div>
                </div>

                {/* How it works preview */}
                <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '340px', textAlign: 'left' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-md)' }}>How it'll work</div>
                    {[
                        { icon: '💬', text: 'Someone asks "What should we do in Basel?"' },
                        { icon: '🤖', text: 'Claude suggests 3–4 specific options for that city' },
                        { icon: '👆', text: 'Everyone taps their vote in the app' },
                        { icon: '🏆', text: 'Majority rules — no more group chat debates' },
                    ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start', marginBottom: i < 3 ? 'var(--space-md)' : 0 }}>
                            <span style={{ fontSize: '20px', flexShrink: 0 }}>{step.icon}</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{step.text}</span>
                        </div>
                    ))}
                </div>

                <button onClick={() => setShowComingSoon(true)} style={{ background: '#4a7fc1', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-xl)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}>
                    🗳️ Create First Poll
                </button>
            </div>

            {/* Coming soon toast */}
            {showComingSoon && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setShowComingSoon(false)}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', maxWidth: '300px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '40px', marginBottom: 'var(--space-md)' }}>🚧</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>Coming Soon</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
                            Polls are being built right now! Check back in the next update.
                        </div>
                        <button onClick={() => setShowComingSoon(false)} style={{ background: '#4a7fc1', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-xl)', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
