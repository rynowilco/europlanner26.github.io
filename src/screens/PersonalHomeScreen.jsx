import React from 'react'
import { localDate } from '../config'

export const PersonalHomeScreen = ({
    userId, user, activities, euroLedger, newStoryAvailable,
    onOpenDailyStories, onOpenJournal, onSwitchUser
}) => {
    const euroBalance = Math.max(0, parseFloat(
        (euroLedger || [])
            .filter(e => e.userId === userId)
            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
            .toFixed(2)
    ))

    const approved = (activities || []).filter(a => a.kidId === userId && a.status === 'approved' && !a.isSample).length
    const pending  = (activities || []).filter(a => a.kidId === userId && a.status === 'pending'  && !a.isSample).length
    const isParent = user?.isParent || false

    const today = localDate()
    const reminderDismissed = (() => {
        try { return localStorage.getItem(`ep26_reminder_${today}`) === 'dismissed' } catch { return true }
    })()

    return (
        <div style={{ height: '100%', overflowY: 'auto', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>

            {/* Navy header */}
            <div style={{ background: 'var(--color-navy)', padding: 'var(--space-md) var(--space-lg) var(--space-xl)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', flexShrink: 0, position: 'relative' }}>
                <button
                    onClick={onSwitchUser}
                    style={{ position: 'absolute', top: 'calc(var(--space-md) + env(safe-area-inset-top, 0px))', right: 'var(--space-md)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', fontWeight: 600, padding: '5px 10px', cursor: 'pointer', letterSpacing: '0.2px' }}
                >
                    Switch ↗
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-md)', background: user?.color || '#4a7fc1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
                        {user?.emoji || '👤'}
                    </div>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', marginBottom: '2px' }}>Welcome back,</div>
                        <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>{user?.name || 'Explorer'}</div>
                    </div>
                </div>

                {/* Euro balance — kids only */}
                {!isParent && (
                    <div style={{ marginTop: 'var(--space-md)', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div style={{ fontSize: '28px' }}>💶</div>
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>Your Balance</div>
                            <div style={{ color: 'white', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-1.5px' }}>€{euroBalance.toFixed(2)}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cards */}
            <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

                {/* Daily Story */}
                <button
                    onClick={onOpenDailyStories}
                    style={{
                        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                        gap: 'var(--space-md)', padding: 'var(--space-lg)', border: 'none',
                        background: newStoryAvailable ? 'linear-gradient(135deg, #b8860b, #d4a017)' : 'white',
                        color: newStoryAvailable ? 'white' : 'var(--color-navy)',
                        outline: newStoryAvailable ? 'none' : '2px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                        boxShadow: newStoryAvailable ? '0 4px 20px rgba(184,134,11,0.35)' : 'var(--shadow-sm)',
                        transition: 'all 0.2s', animation: 'slideUp 0.5s ease-out 0.05s both',
                    }}
                >
                    <div style={{ fontSize: '30px', flexShrink: 0 }}>✨</div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>
                            {newStoryAvailable ? "Today's Story is ready!" : 'Daily Stories'}
                        </div>
                        <div style={{ fontSize: '0.8rem', opacity: newStoryAvailable ? 0.88 : 0.55 }}>
                            {newStoryAvailable ? 'Tap to read your AI-written adventure' : "Check back tonight for today's story"}
                        </div>
                    </div>
                    {newStoryAvailable && (
                        <span style={{ background: 'white', color: '#b8860b', fontSize: '0.6rem', fontWeight: 800, padding: '3px 7px', borderRadius: 'var(--radius-full)', flexShrink: 0, letterSpacing: '0.3px' }}>NEW</span>
                    )}
                </button>

                {/* Journal button */}
                <button
                    onClick={onOpenJournal}
                    style={{
                        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                        gap: 'var(--space-md)', padding: 'var(--space-lg)', border: 'none',
                        background: !reminderDismissed ? 'linear-gradient(135deg, #c8603a, #d97f55)' : 'white',
                        color: !reminderDismissed ? 'white' : 'var(--color-navy)',
                        outline: !reminderDismissed ? 'none' : '2px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                        boxShadow: !reminderDismissed ? '0 4px 20px rgba(200,96,58,0.3)' : 'var(--shadow-sm)',
                        animation: 'slideUp 0.5s ease-out 0.1s both',
                    }}
                >
                    <div style={{ fontSize: '30px', flexShrink: 0 }}>📖</div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>Write in Your Journal</div>
                        <div style={{ fontSize: '0.8rem', opacity: !reminderDismissed ? 0.88 : 0.55 }}>
                            {!reminderDismissed ? 'Earn €1 for your entry today!' : "Capture today's memories"}
                        </div>
                    </div>
                    {!reminderDismissed && (
                        <div style={{ background: 'white', color: '#c8603a', fontSize: '0.62rem', fontWeight: 800, borderRadius: '20px', padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            📝 Earn €1!
                        </div>
                    )}
                </button>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', animation: 'slideUp 0.5s ease-out 0.15s both' }}>
                    <div style={{ flex: 1, background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', lineHeight: 1 }}>{approved}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', fontWeight: 500, marginTop: '4px' }}>✅ Approved</div>
                    </div>
                    <div style={{ flex: 1, background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b8860b', lineHeight: 1 }}>{pending}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', fontWeight: 500, marginTop: '4px' }}>⏳ Pending</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
