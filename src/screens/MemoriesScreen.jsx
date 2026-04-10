import React, { useState } from 'react'
import { CONFIG } from '../config'
import { Icon } from '../components/Icon'

const JournalComposeModal = ({ user, itinerary, onSubmit, onCancel }) => {
    const [entryText, setEntryText] = useState('')
    const [mood, setMood] = useState('')
    const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
    const today = new Date().toISOString().split('T')[0]
    const currentCity = tripItinerary.find(c => c.startDate <= today && today <= c.endDate)
    const cityOptions = [...new Set(tripItinerary.filter(c => !c.isTransfer).map(c => c.city))]
    const [city, setCity] = useState(currentCity ? currentCity.city : '')
    const moods = ['😊', '🤩', '😄', '😴', '😤', '😐']
    const canSubmit = entryText.trim().length > 0 && city
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', padding: 'var(--space-xl)', width: '100%', maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-navy)' }}>📖 New Memory</h2>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <Icon name="X" size={20} color="var(--color-text-light)" />
                    </button>
                </div>
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '6px' }}>Where are you?</label>
                    <select value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: 'var(--space-md)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontFamily: 'var(--font-body)', background: 'white', outline: 'none', boxSizing: 'border-box' }}>
                        <option value="">Select a city...</option>
                        {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '6px' }}>How are you feeling?</label>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                        {moods.map(m => (
                            <button key={m} onClick={() => setMood(mood === m ? '' : m)} style={{ fontSize: '28px', background: mood === m ? 'var(--color-cream)' : 'transparent', border: mood === m ? '2px solid var(--color-terracotta)' : '2px solid transparent', borderRadius: 'var(--radius-sm)', padding: '4px 6px', cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1 }}>
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '6px' }}>What happened today?</label>
                    <textarea value={entryText} onChange={e => setEntryText(e.target.value)} placeholder="Write about your day, a moment that stood out, something that surprised you..." rows={6} autoFocus style={{ width: '100%', padding: 'var(--space-md)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--color-navy)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'right', marginTop: '4px' }}>{entryText.length} chars</div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: 'var(--space-md)', background: 'var(--color-cream)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                    <button onClick={() => canSubmit && onSubmit(entryText.trim(), mood, city)} disabled={!canSubmit} style={{ flex: 2, padding: 'var(--space-md)', background: canSubmit ? 'var(--color-terracotta)' : 'var(--color-tan)', color: canSubmit ? 'white' : 'var(--color-text-light)', border: 'none', borderRadius: 'var(--radius-md)', cursor: canSubmit ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '1rem' }}>
                        Save Memory ✨
                    </button>
                </div>
            </div>
        </div>
    )
}

export const MemoriesScreen = ({ userId, user, itinerary, journalEntries, onAddEntry, onBack }) => {
    const [showCompose, setShowCompose] = useState(false)
    const myEntries = journalEntries.filter(e => e.userId === userId)
    const grouped = myEntries.reduce((acc, e) => {
        if (!acc[e.city]) acc[e.city] = []
        acc[e.city].push(e)
        return acc
    }, {})
    const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
    const today = new Date().toISOString().split('T')[0]
    const currentCity = tripItinerary.find(c => c.startDate <= today && today <= c.endDate)

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-cream)' }}>
            <div style={{ background: 'var(--color-navy)', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
                    <Icon name="ArrowLeft" size={20} color="white" />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>{user.emoji} {user.name}'s Memories</div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{myEntries.length} {myEntries.length === 1 ? 'entry' : 'entries'}</div>
                </div>
                <button onClick={() => setShowCompose(true)} style={{ background: 'var(--color-terracotta)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 16px', color: 'white', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                    + Write
                </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
                {myEntries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)', animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ fontSize: '52px', marginBottom: 'var(--space-md)' }}>📖</div>
                        <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>No memories yet</p>
                        <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
                            {currentCity ? `You're in ${currentCity.city} — write your first entry!` : 'Start writing when the adventure begins!'}
                        </p>
                        <button onClick={() => setShowCompose(true)} style={{ padding: 'var(--space-md) var(--space-xl)', background: 'var(--color-terracotta)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
                            Write First Entry
                        </button>
                    </div>
                ) : (
                    Object.entries(grouped).map(([city, entries]) => (
                        <div key={city} style={{ marginBottom: 'var(--space-xl)', animation: 'slideUp 0.4s ease-out' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                📍 {city}
                            </div>
                            {[...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(entry => (
                                <div key={entry.id} style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-sm)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                                            {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {entry.mood && <span style={{ fontSize: '20px', lineHeight: 1 }}>{entry.mood}</span>}
                                            {entry.heartCount > 0 && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-terracotta)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                                                    ❤️ {entry.heartCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--color-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{entry.entryText}</p>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
            {showCompose && (
                <JournalComposeModal
                    user={user}
                    itinerary={tripItinerary}
                    onSubmit={async (entryText, mood, city) => {
                        await onAddEntry(userId, user.name, city, entryText, mood, null, null)
                        setShowCompose(false)
                    }}
                    onCancel={() => setShowCompose(false)}
                />
            )}
        </div>
    )
}
