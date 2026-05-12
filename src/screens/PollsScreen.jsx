import React, { useState } from 'react'
import { Icon } from '../components/Icon'

export const PollsScreen = ({ onBack }) => {
    const [showHowItWorks, setShowHowItWorks] = useState(false)
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
                <button onClick={() => setShowHowItWorks(true)} style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}>
                    ?
                </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* Sticky Create Poll button */}
                <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-md) var(--space-lg)' }}>
                    <button onClick={() => setShowComingSoon(true)} style={{ width: '100%', background: '#4a7fc1', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                        🗳️ Create Poll
                    </button>
                </div>

                {/* Empty state */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2xl) var(--space-lg)', gap: 'var(--space-lg)', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', background: '#e8f0fb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                        🗳️
                    </div>
                    <div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>No polls yet</div>
                        <div style={{ fontSize: '0.95rem', color: 'var(--color-text-light)', lineHeight: 1.6, maxWidth: '260px' }}>
                            Can't decide what to do? Create a poll and let the family vote.
                        </div>
                    </div>
                </div>
            </div>

            {/* How it works modal */}
            {showHowItWorks && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setShowHowItWorks(false)}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', maxWidth: '320px', width: '100%', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)' }}>How Polls Work</div>
                            <button onClick={() => setShowHowItWorks(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <Icon name="X" size={20} color="var(--color-text-light)" />
                            </button>
                        </div>
                        {[
                            { icon: '💬', text: 'Someone asks "What should we do in Basel this afternoon?"' },
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
                </div>
            )}

            {/* Coming soon modal */}
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
