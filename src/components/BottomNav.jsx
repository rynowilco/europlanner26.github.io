import React from 'react'

const NAV_ITEMS = [
    { id: 'home',     emoji: '🏠', label: 'Home'     },
    { id: 'memories', emoji: '📖', label: 'Memories'  },
    { id: 'feed',     emoji: '📸', label: 'Feed'      },
    { id: 'plan',     emoji: '💬', label: 'Plan'      },
    { id: 'tools',    emoji: '🧰', label: 'Tools'     },
]

export const BottomNav = ({ activeTab, onTabChange, newStoryAvailable, newPollAvailable }) => (
    <nav style={{
        display: 'flex',
        background: 'white',
        borderTop: '1px solid var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        flexShrink: 0,
        zIndex: 100,
    }}>
        {NAV_ITEMS.map(({ id, emoji, label }) => {
            const active = activeTab === id
            const hasBadge = (id === 'feed' && newStoryAvailable) || (id === 'tools' && newPollAvailable)
            return (
                <button
                    key={id}
                    onClick={() => onTabChange(id)}
                    style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'flex-end',
                        paddingTop: '6px', paddingBottom: '6px', gap: '2px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        position: 'relative', minHeight: '52px',
                    }}
                >
                    {/* Active bar */}
                    {active && (
                        <div style={{
                            position: 'absolute', top: 0, left: '22%', right: '22%',
                            height: '2.5px', background: 'var(--color-navy)',
                            borderRadius: '0 0 3px 3px',
                        }} />
                    )}
                    {/* Badge dot */}
                    {hasBadge && !active && (
                        <div style={{
                            position: 'absolute', top: '8px', right: 'calc(50% - 16px)',
                            width: '7px', height: '7px',
                            background: 'var(--color-terracotta)', borderRadius: '50%',
                            border: '1.5px solid white',
                        }} />
                    )}
                    <div style={{ fontSize: '20px', lineHeight: 1 }}>{emoji}</div>
                    <div style={{
                        fontSize: '0.62rem', lineHeight: 1.3, letterSpacing: '0.1px',
                        fontWeight: active ? 700 : 500,
                        color: active ? 'var(--color-navy)' : 'var(--color-text-light)',
                    }}>
                        {label}
                    </div>
                </button>
            )
        })}
    </nav>
)
