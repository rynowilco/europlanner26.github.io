import React, { useState } from 'react'
import { CONFIG, localDate } from '../config'
import { Icon } from '../components/Icon'

// ─── Quick Tools Modal ────────────────────────────────────────────────────────

export const QuickToolsModal = ({ onClose, itinerary }) => {
    const [tab, setTab] = useState('currency')
    const [eurAmount, setEurAmount] = useState('')

    const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
    const today = localDate()
    const currentStop = tripItinerary.find(c => c.startDate <= today && today <= c.endDate)
    const currentLanguage = currentStop?.language || null

    const allLanguages = ['Italian', 'German']
    const [selectedLang, setSelectedLang] = useState(currentLanguage && CONFIG.phrases[currentLanguage] ? currentLanguage : 'Italian')
    const phrases = CONFIG.phrases[selectedLang] || []

    const usdRate = CONFIG.softParams?.eurToUsdRate || 1.08
    const usdAmount = eurAmount ? (parseFloat(eurAmount) * usdRate).toFixed(2) : ''

    const tabBtnStyle = (active) => ({
        flex: 1, padding: '10px', background: active ? 'var(--color-navy)' : 'transparent',
        color: active ? 'white' : 'var(--color-text-light)', border: 'none',
        borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: active ? 700 : 500,
        fontSize: '0.9rem', transition: 'all 0.15s',
    })

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s ease-out' }} onClick={onClose}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} onClick={e => e.stopPropagation()}>

                <div style={{ padding: 'var(--space-lg) var(--space-xl) var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-navy)' }}>🧰 Quick Tools</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <Icon name="X" size={20} color="var(--color-text-light)" />
                    </button>
                </div>

                <div style={{ padding: 'var(--space-md) var(--space-xl) 0', flexShrink: 0 }}>
                    <div style={{ display: 'flex', background: 'var(--color-cream)', borderRadius: 'var(--radius-md)', padding: '3px', gap: '3px' }}>
                        <button onClick={() => setTab('currency')} style={tabBtnStyle(tab === 'currency')}>💶 Currency</button>
                        <button onClick={() => setTab('phrases')} style={tabBtnStyle(tab === 'phrases')}>🗣️ Phrases</button>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-lg) var(--space-xl)' }}>

                    {tab === 'currency' && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>Rate: €1 = ${usdRate.toFixed(2)} USD</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div style={{ background: 'var(--color-cream)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Euros (€)</div>
                                    <input
                                        type="number" inputMode="decimal"
                                        value={eurAmount} onChange={e => setEurAmount(e.target.value)}
                                        placeholder="0"
                                        style={{ width: '100%', fontSize: '2rem', fontWeight: 700, color: 'var(--color-navy)', background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ textAlign: 'center', fontSize: '1.4rem', color: 'var(--color-text-light)' }}>⇅</div>
                                <div style={{ background: 'linear-gradient(135deg, #1a472a, #2a7a45)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>US Dollars ($)</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', minHeight: '2.5rem' }}>
                                        {usdAmount ? `$${usdAmount}` : <span style={{ opacity: 0.4 }}>0</span>}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: 'var(--space-xl)' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 'var(--space-sm)' }}>Quick Reference</div>
                                {[5, 10, 20, 50, 100].map(eur => (
                                    <div key={eur} onClick={() => setEurAmount(String(eur))} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px var(--space-md)', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--color-navy)' }}>€{eur}</span>
                                        <span style={{ color: 'var(--color-text-light)' }}>${(eur * usdRate).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 'phrases' && (
                        <div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                                {allLanguages.map(lang => (
                                    <button key={lang} onClick={() => setSelectedLang(lang)} style={{ padding: '6px 14px', background: selectedLang === lang ? 'var(--color-navy)' : 'var(--color-cream)', color: selectedLang === lang ? 'white' : 'var(--color-text-light)', border: selectedLang === lang ? 'none' : '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: selectedLang === lang ? 700 : 400, cursor: 'pointer' }}>
                                        {lang === 'Italian' ? '🇮🇹 Italian' : '🇩🇪 German'}
                                    </button>
                                ))}
                            </div>
                            {currentStop && currentStop.language === selectedLang && (
                                <div style={{ background: 'rgba(26,26,46,0.06)', borderRadius: 'var(--radius-md)', padding: '8px 12px', marginBottom: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--color-navy)', fontWeight: 600 }}>
                                    📍 You're in {currentStop.city} — {selectedLang} is the local language
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {phrases.map((p, i) => (
                                    <div key={i} style={{ background: i % 2 === 0 ? 'var(--color-cream)' : 'white', borderRadius: 'var(--radius-sm)', padding: '10px var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <div style={{ flex: '0 0 38%', fontWeight: 700, color: 'var(--color-navy)', fontSize: '0.9rem' }}>{p.english}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, color: 'var(--color-terracotta)', fontSize: '0.95rem' }}>{p.local}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontStyle: 'italic' }}>{p.pronunciation}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── PersonalHomeScreen ───────────────────────────────────────────────────────

export const PersonalHomeScreen = ({
    userId, user, activities, euroLedger, newStoryAvailable,
    onOpenDailyStories, onOpenJournal, onSwitchUser, itinerary
}) => {
    const [showQuickTools, setShowQuickTools] = useState(false)

    const euroBalance = Math.max(0, parseFloat(
        (euroLedger || [])
            .filter(e => e.userId === userId)
            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
            .toFixed(2)
    ))

    const isParent = user?.isParent || false
    const today = localDate()
    const reminderDismissed = (() => {
        try { return localStorage.getItem(`ep26_reminder_${today}`) === 'dismissed' } catch { return true }
    })()

    return (
        <div style={{ height: '100%', overflowY: 'auto', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>

            {/* Navy header */}
            <div style={{ background: 'var(--color-navy)', padding: 'var(--space-md) var(--space-lg) var(--space-xl)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', flexShrink: 0, position: 'relative' }}>
                <button onClick={onSwitchUser} style={{ position: 'absolute', top: 'calc(var(--space-md) + env(safe-area-inset-top, 0px))', right: 'var(--space-md)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', fontWeight: 600, padding: '5px 10px', cursor: 'pointer' }}>
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

                {/* 1. Journal — top priority */}
                <button onClick={onOpenJournal} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)', border: 'none', background: !reminderDismissed ? 'linear-gradient(135deg, #c8603a, #d97f55)' : 'white', color: !reminderDismissed ? 'white' : 'var(--color-navy)', outline: !reminderDismissed ? 'none' : '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', boxShadow: !reminderDismissed ? '0 4px 20px rgba(200,96,58,0.3)' : 'var(--shadow-sm)', animation: 'slideUp 0.5s ease-out 0.05s both' }}>
                    <div style={{ fontSize: '30px', flexShrink: 0 }}>📖</div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>Write in Your Journal</div>
                        <div style={{ fontSize: '0.8rem', opacity: !reminderDismissed ? 0.88 : 0.55 }}>{!reminderDismissed ? 'Earn €1 for your entry today!' : "Capture today's memories"}</div>
                    </div>
                    {!reminderDismissed && <div style={{ background: 'white', color: '#c8603a', fontSize: '0.62rem', fontWeight: 800, borderRadius: '20px', padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>📝 Earn €1!</div>}
                </button>

                {/* 2. Daily Stories */}
                <button onClick={onOpenDailyStories} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)', border: 'none', background: newStoryAvailable ? 'linear-gradient(135deg, #b8860b, #d4a017)' : 'white', color: newStoryAvailable ? 'white' : 'var(--color-navy)', outline: newStoryAvailable ? 'none' : '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', boxShadow: newStoryAvailable ? '0 4px 20px rgba(184,134,11,0.35)' : 'var(--shadow-sm)', animation: 'slideUp 0.5s ease-out 0.1s both' }}>
                    <div style={{ fontSize: '30px', flexShrink: 0 }}>✨</div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>{newStoryAvailable ? "Today's Story is ready!" : 'Daily Stories'}</div>
                        <div style={{ fontSize: '0.8rem', opacity: newStoryAvailable ? 0.88 : 0.55 }}>{newStoryAvailable ? 'Tap to read your AI-written adventure' : "Check back tonight for today's story"}</div>
                    </div>
                    {newStoryAvailable && <span style={{ background: 'white', color: '#b8860b', fontSize: '0.6rem', fontWeight: 800, padding: '3px 7px', borderRadius: 'var(--radius-full)', flexShrink: 0 }}>NEW</span>}
                </button>

                {/* 3. Quick Tools */}
                <button onClick={() => setShowQuickTools(true)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-lg)', border: 'none', background: 'white', outline: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', animation: 'slideUp 0.5s ease-out 0.15s both' }}>
                    <div style={{ fontSize: '30px', flexShrink: 0 }}>🧰</div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-navy)', marginBottom: '2px' }}>Quick Tools</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>Currency converter · Local phrases</div>
                    </div>
                    <Icon name="ChevronRight" size={18} color="var(--color-text-light)" />
                </button>
            </div>

            {showQuickTools && <QuickToolsModal onClose={() => setShowQuickTools(false)} itinerary={itinerary} />}
        </div>
    )
}
