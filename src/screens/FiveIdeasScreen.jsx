import React, { useState, useEffect, useCallback } from 'react'
import { Icon } from '../components/Icon'
import { CONFIG } from '../config'

// ── Helpers ───────────────────────────────────────────────────────────────────

const getItineraryCity = (itinerary) => {
    if (!itinerary?.length) return null
    const today = new Date().toISOString().split('T')[0]
    const current = itinerary.find(c => c.startDate <= today && today <= c.endDate)
    return current?.city || itinerary[0]?.city || null
}

const mapsUrl = (query) => `https://maps.apple.com/?q=${encodeURIComponent(query)}`

const loadSaved = () => {
    try { return JSON.parse(localStorage.getItem('ep26_fiveIdeas') || 'null') } catch { return null }
}
const persist = (data) => {
    try { localStorage.setItem('ep26_fiveIdeas', JSON.stringify(data)) } catch {}
}

// Strip any HTML / citation tags Claude might include in text values
const sanitize = (str) => {
    if (!str) return ''
    return str
        .replace(/<cite[^>]*>[\s\S]*?<\/cite>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

const cleanIdea = (raw, index) => ({
    id:             `IDEA-${Date.now()}-${index}`,
    title:          sanitize(raw.title          || ''),
    description:    sanitize(raw.description    || ''),
    whyYoullLikeIt: sanitize(raw.whyYoullLikeIt || ''),
    cost:           sanitize(raw.cost           || ''),
    transport:      sanitize(raw.transport      || ''),
    duration:       sanitize(raw.duration       || ''),
    mapsQuery:      sanitize(raw.mapsQuery      || '')
})

const LOADING_MSGS = [
    'Detecting your location…',
    'Asking Claude what\'s fun nearby…',
    'Finding spontaneous adventures…',
    'Picking the good ones…',
    'Almost ready…'
]

// ── SelectingCard ─────────────────────────────────────────────────────────────

const SelectingCard = ({ idea, index, isExpanded, isSelected, isDisabled, isHighlighted, onToggleExpand, onToggleSelect, spinning }) => (
    <div style={{
        flexShrink: 0,
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        border: isHighlighted ? '2.5px solid var(--color-terracotta)'
              : isSelected    ? '2px solid #4a7fc1'
              :                 '1.5px solid var(--color-border)',
        boxShadow: isHighlighted ? '0 0 18px rgba(200,96,58,0.35)'
                 : isSelected    ? 'var(--shadow-md)'
                 :                 'var(--shadow-sm)',
        opacity:   isDisabled ? 0.45 : 1,
        transform: isHighlighted ? 'scale(1.025)' : 'scale(1)',
        transition: 'border 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease, transform 0.12s ease',
        overflow: 'hidden'
    }}>
        {/* Header row */}
        <div
            onClick={() => !spinning && onToggleExpand(idea.id)}
            style={{ padding: '13px 16px', cursor: spinning ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '52px' }}
        >
            <div style={{
                width: '28px', height: '28px', minWidth: '28px', borderRadius: '50%',
                background: isHighlighted ? 'var(--color-terracotta)' : isSelected ? '#4a7fc1' : '#e8f0fb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.82rem', fontWeight: 700,
                color: isHighlighted || isSelected ? 'white' : '#4a7fc1',
                flexShrink: 0
            }}>
                {isSelected ? '✓' : index + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-navy)', lineHeight: 1.35 }}>
                    {idea.title}
                </div>
                {!isExpanded && !spinning && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                        {idea.cost}{idea.duration ? ` · ${idea.duration}` : ''}
                    </div>
                )}
            </div>
            {!spinning && <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} color="var(--color-text-light)" />}
        </div>

        {/* Expanded body */}
        {isExpanded && !spinning && (
            <div style={{ borderTop: '1px solid var(--color-border)', padding: '14px 16px 16px' }}>
                <p style={{ fontSize: '0.87rem', color: 'var(--color-text)', lineHeight: 1.65, margin: '0 0 8px' }}>
                    {idea.description}
                </p>
                <p style={{ fontSize: '0.82rem', color: '#4a7fc1', lineHeight: 1.5, margin: '0 0 14px', fontStyle: 'italic' }}>
                    ❤️ {idea.whyYoullLikeIt}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    {[
                        { icon: '💶', val: idea.cost      },
                        { icon: '🚶', val: idea.transport  },
                        { icon: '⏱️', val: idea.duration   },
                    ].filter(item => item.val).map((item, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '4px', background: '#f7f9fc', padding: '4px 9px', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
                            <span>{item.icon}</span><span>{item.val}</span>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => onToggleSelect(idea.id)}
                    style={{
                        width: '100%', padding: '10px',
                        background: isSelected ? '#e8f0fb' : '#4a7fc1',
                        color: isSelected ? '#4a7fc1' : 'white',
                        border: isSelected ? '2px solid #4a7fc1' : 'none',
                        borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer'
                    }}
                >
                    {isSelected ? '✓ Selected — tap to remove' : 'Select this'}
                </button>
            </div>
        )}
    </div>
)

// ── ActiveCard ────────────────────────────────────────────────────────────────

const ActiveCard = ({ idea, onDone }) => (
    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '2px solid #4a7fc1', boxShadow: 'var(--shadow-md)', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ background: 'linear-gradient(135deg, #2c5282 0%, #4a7fc1 100%)', padding: '14px 16px' }}>
            <div style={{ color: 'white', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>{idea.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.74rem', marginTop: '3px' }}>Your plan · Let's go!</div>
        </div>
        <div style={{ padding: '16px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.65, margin: '0 0 8px' }}>
                {idea.description}
            </p>
            <p style={{ fontSize: '0.83rem', color: '#4a7fc1', lineHeight: 1.5, margin: '0 0 16px', fontStyle: 'italic' }}>
                ❤️ {idea.whyYoullLikeIt}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                {[
                    { icon: '💶', label: 'Cost',          value: idea.cost      },
                    { icon: '🚶', label: 'Getting there',  value: idea.transport },
                    { icon: '⏱️', label: 'Time needed',   value: idea.duration  },
                ].filter(item => item.value).map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{item.icon}</span>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--color-text)', marginTop: '2px', lineHeight: 1.4 }}>{item.value}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <a
                    href={mapsUrl(idea.mapsQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px', background: '#f0f4fa', border: '1.5px solid #4a7fc1', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 600, color: '#4a7fc1', textDecoration: 'none' }}
                >
                    📍 Open in Maps
                </a>
                <button
                    onClick={() => onDone(idea.id)}
                    style={{ flex: 1, padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}
                >
                    ✓ Done
                </button>
            </div>
        </div>
    </div>
)

// ── Main Screen ───────────────────────────────────────────────────────────────

export const FiveIdeasScreen = ({ onBack, itinerary }) => {
    const [phase, setPhase]                     = useState('idle')
    const [ideas, setIdeas]                     = useState([])
    const [city, setCity]                       = useState('')
    const [locationSource, setLocationSource]   = useState(null)
    const [error, setError]                     = useState(null)
    const [expandedId, setExpandedId]           = useState(null)
    const [selectedIds, setSelectedIds]         = useState(new Set())
    const [spinning, setSpinning]               = useState(false)
    const [spinHighlightId, setSpinHighlightId] = useState(null)
    const [loadingMsgIdx, setLoadingMsgIdx]     = useState(0)
    const [showConfirm, setShowConfirm]         = useState(false)

    // ── Restore ───────────────────────────────────────────────────────────────
    useEffect(() => {
        const saved = loadSaved()
        if (saved?.phase && (saved.phase === 'selecting' || saved.phase === 'active') && saved.ideas?.length > 0) {
            setPhase(saved.phase)
            setIdeas(saved.ideas)
            setCity(saved.city || '')
        }
    }, [])

    useEffect(() => {
        if (phase !== 'loading') persist({ phase, ideas, city })
    }, [phase, ideas, city])

    useEffect(() => {
        if (phase !== 'loading') return
        setLoadingMsgIdx(0)
        const interval = setInterval(() => setLoadingMsgIdx(i => Math.min(i + 1, LOADING_MSGS.length - 1)), 1800)
        return () => clearInterval(interval)
    }, [phase])

    // ── Location ──────────────────────────────────────────────────────────────
    const detectLocation = () => new Promise((resolve) => {
        const fallback = getItineraryCity(itinerary) || 'your location'
        if (!navigator.geolocation) { resolve({ city: fallback, lat: null, lng: null, source: 'itinerary' }); return }
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ city: fallback, lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'gps' }),
            ()  => resolve({ city: fallback, lat: null, lng: null, source: 'itinerary' }),
            { timeout: 6000, maximumAge: 300000 }
        )
    })

    // ── Generate ──────────────────────────────────────────────────────────────
    const fetchIdeas = useCallback(async () => {
        setPhase('loading')
        setError(null)
        try {
            const loc = await detectLocation()
            setCity(loc.city)
            setLocationSource(loc.source)

            const locationContext = loc.lat && loc.lng
                ? `GPS coordinates: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} (near ${loc.city}, Europe)`
                : `Location: ${loc.city}, Europe`

            const prompt = `${locationContext}

Family of 4: 2 parents, kids aged 11 and 14. They want something fun RIGHT NOW — spontaneous, no advance booking, walkable or a short transit ride.

Generate exactly 5 diverse, immediately-doable activity ideas. Vary the types (outdoor, food, culture, quirky, active).

CRITICAL: Return ONLY a raw JSON array. No markdown, no code fences, no preamble, no HTML, no citation tags, no markup of any kind. Plain text strings only inside the JSON values.

Each object must have exactly these keys:
- "title": punchy name, max 6 words, plain text
- "description": 2-3 sentences, plain text only
- "whyYoullLikeIt": 1 sentence for a family with curious energetic teens, plain text only
- "cost": e.g. "Free" or "€5–10 per person", plain text only
- "transport": e.g. "5 min walk" or "10 min by tram", plain text only
- "duration": e.g. "30–45 min" or "1–2 hours", plain text only
- "mapsQuery": specific Apple Maps search string, plain text only`

            const res = await fetch('/api/claude', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: CONFIG.CLAUDE_MODEL,
                    max_tokens: 1800,
                    system: 'You are a spontaneous travel guide. Return ONLY a raw JSON array. Absolutely no markdown, no code fences, no HTML tags, no citation markup, no extra text. Plain text values only.',
                    messages: [{ role: 'user', content: prompt }]
                })
            })

            if (!res.ok) throw new Error(`API ${res.status}`)
            const data = await res.json()
            const text = data.content?.find(b => b.type === 'text')?.text || ''
            const cleaned = text.replace(/```json|```/g, '').replace(/<[^>]+>/g, '').trim()
            const parsed = JSON.parse(cleaned)
            if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty response')

            setIdeas(parsed.slice(0, 5).map(cleanIdea))
            setSelectedIds(new Set())
            setExpandedId(null)
            setPhase('selecting')
        } catch (e) {
            console.error('Failed to generate ideas:', e)
            setError('Something went wrong. Check your connection and try again.')
            setPhase('idle')
        }
    }, [itinerary])

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleGetIdeas     = () => { if (phase === 'active') { setShowConfirm(true); return } fetchIdeas() }
    const handleToggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)
    const handleToggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else if (next.size < 2) next.add(id)
            return next
        })
    }

    const confirmSelection = (ids) => {
        setIdeas(prev => prev.filter(i => ids.has(i.id)))
        setSelectedIds(new Set())
        setExpandedId(null)
        setSpinning(false)
        setSpinHighlightId(null)
        setPhase('active')
    }

    const handleLetsDoIt = () => { if (selectedIds.size > 0) confirmSelection(selectedIds) }

    const handleSpin = () => {
        if (spinning || ideas.length === 0) return
        const winner  = ideas[Math.floor(Math.random() * ideas.length)]
        const poolIds = ideas.map(i => i.id)
        const sequence = []
        for (let i = 0; i < ideas.length * 3; i++) sequence.push(poolIds[i % ideas.length])
        let curIdx = sequence.length % ideas.length, safety = 0
        while (poolIds[curIdx] !== winner.id && safety < ideas.length) { sequence.push(poolIds[curIdx]); curIdx = (curIdx + 1) % ideas.length; safety++ }
        sequence.push(winner.id)

        setSpinning(true); setExpandedId(null); setSelectedIds(new Set())
        let step = 0
        const total = sequence.length
        const runStep = () => {
            setSpinHighlightId(sequence[step])
            if (step < total - 1) {
                step++
                const p = step / total
                setTimeout(runStep, p < 0.45 ? 55 : p < 0.65 ? 85 : p < 0.8 ? 140 : p < 0.92 ? 220 : 330)
            } else {
                setTimeout(() => { setSpinning(false); setSpinHighlightId(null); confirmSelection(new Set([winner.id])) }, 750)
            }
        }
        setTimeout(runStep, 55)
    }

    const handleDone = (ideaId) => {
        const remaining = ideas.filter(i => i.id !== ideaId)
        if (remaining.length === 0) { setPhase('idle'); setIdeas([]); setCity('') }
        else setIdeas(remaining)
    }

    const handleStartFresh = () => { setPhase('idle'); setIdeas([]); setCity(''); setSelectedIds(new Set()); setExpandedId(null) }

    // ── Shared header ─────────────────────────────────────────────────────────
    const Header = ({ subtitle, rightSlot }) => (
        <div style={{ background: 'linear-gradient(135deg, #2c5282 0%, #4a7fc1 100%)', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
            <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <Icon name="ArrowLeft" size={20} color="white" />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '1.05rem', fontWeight: 700 }}>✨ 5 Ideas</div>
                {subtitle && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.76rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
            </div>
            {rightSlot}
        </div>
    )

    // ── IDLE ──────────────────────────────────────────────────────────────────
    if (phase === 'idle') return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>
            <Header subtitle="Spontaneous ideas for right now" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl) var(--space-lg)', textAlign: 'center', gap: 'var(--space-lg)' }}>
                <div style={{ fontSize: '72px', lineHeight: 1 }}>🗺️</div>
                <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>Looking for something fun?</div>
                    <div style={{ fontSize: '0.92rem', color: 'var(--color-text-light)', lineHeight: 1.6, maxWidth: '280px' }}>
                        Tap below for 5 spontaneous ideas near you — no planning, no booking.
                    </div>
                </div>
                {error && (
                    <div style={{ background: '#fff3f3', border: '1.5px solid #e74c3c', borderRadius: 'var(--radius-md)', padding: '10px 16px', fontSize: '0.85rem', color: '#c0392b', maxWidth: '300px' }}>
                        {error}
                    </div>
                )}
                <button onClick={handleGetIdeas} style={{ background: 'linear-gradient(135deg, #4a7fc1 0%, #2c5282 100%)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', padding: '16px 36px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(74,127,193,0.4)' }}>
                    ✨ Get 5 Ideas
                </button>
            </div>
        </div>
    )

    // ── LOADING ───────────────────────────────────────────────────────────────
    if (phase === 'loading') return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>
            <Header subtitle="One moment…" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-xl)', padding: 'var(--space-xl)' }}>
                <div style={{ fontSize: '64px', animation: 'ideaspin 1.4s linear infinite', lineHeight: 1 }}>🌀</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--color-text-light)', textAlign: 'center', fontStyle: 'italic' }}>
                    {LOADING_MSGS[loadingMsgIdx]}
                </div>
            </div>
            <style>{`@keyframes ideaspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    // ── SELECTING ─────────────────────────────────────────────────────────────
    if (phase === 'selecting') {
        const selectedCount = selectedIds.size
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>
                <Header
                    subtitle={`📍 ${locationSource === 'gps' ? 'Near' : 'In'} ${city}`}
                    rightSlot={
                        <button
                            onClick={handleSpin}
                            disabled={spinning}
                            style={{ background: spinning ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.22)', border: '1.5px solid rgba(255,255,255,0.6)', borderRadius: 'var(--radius-md)', padding: '7px 14px', color: 'white', fontSize: '0.88rem', fontWeight: 700, cursor: spinning ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                        >
                            🎰 {spinning ? 'Spinning…' : 'Spin!'}
                        </button>
                    }
                />

                {/* Scrollable card list */}
                <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 'var(--space-lg)', paddingBottom: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {ideas.map((idea, i) => (
                        <SelectingCard
                            key={idea.id}
                            idea={idea}
                            index={i}
                            isExpanded={expandedId === idea.id}
                            isSelected={selectedIds.has(idea.id)}
                            isDisabled={selectedCount >= 2 && !selectedIds.has(idea.id)}
                            isHighlighted={spinHighlightId === idea.id}
                            onToggleExpand={handleToggleExpand}
                            onToggleSelect={handleToggleSelect}
                            spinning={spinning}
                        />
                    ))}
                    {!spinning && (
                        <button onClick={handleStartFresh} style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', fontSize: '0.82rem', cursor: 'pointer', padding: '8px', textDecoration: 'underline', alignSelf: 'center', marginTop: 'var(--space-xs)' }}>
                            🔄 Generate different ideas
                        </button>
                    )}
                </div>

                {/* Bottom bar — in the flex flow, sits naturally above BottomNav */}
                <div style={{ flexShrink: 0, background: 'white', borderTop: '1px solid var(--color-border)', padding: '12px var(--space-lg)', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}>
                    <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--color-text-light)', lineHeight: 1.3 }}>
                        {selectedCount === 0
                            ? 'Expand a card, then tap Select'
                            : `${selectedCount} of 2 selected`}
                    </div>
                    <button
                        onClick={handleLetsDoIt}
                        disabled={selectedCount === 0 || spinning}
                        style={{
                            background: selectedCount === 0 ? '#c5d6ec' : 'linear-gradient(135deg, #4a7fc1 0%, #2c5282 100%)',
                            color: 'white', border: 'none', borderRadius: 'var(--radius-full)',
                            padding: '11px 22px', fontSize: '0.92rem', fontWeight: 700,
                            cursor: selectedCount === 0 ? 'default' : 'pointer',
                            boxShadow: selectedCount > 0 ? '0 2px 10px rgba(74,127,193,0.4)' : 'none',
                            transition: 'all 0.15s ease', whiteSpace: 'nowrap', flexShrink: 0
                        }}
                    >
                        Let's do it!{selectedCount > 0 ? ` (${selectedCount})` : ''}
                    </button>
                </div>
            </div>
        )
    }

    // ── ACTIVE ────────────────────────────────────────────────────────────────
    if (phase === 'active') return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>
            <Header
                subtitle={`📍 ${city} · Tap Done when finished`}
                rightSlot={
                    <button onClick={() => setShowConfirm(true)} style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)', padding: '7px 12px', color: 'white', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                        New ideas
                    </button>
                }
            />

            {/* Scrollable — cards may be tall; let the user scroll to Done */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {ideas.map(idea => (
                    <ActiveCard key={idea.id} idea={idea} onDone={handleDone} />
                ))}
            </div>

            {showConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }} onClick={() => setShowConfirm(false)}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', maxWidth: '300px', width: '100%', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>Get new ideas?</div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: 1.5, marginBottom: 'var(--space-lg)' }}>Your current plan will be cleared.</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: '11px', background: 'none', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)' }}>Keep plan</button>
                            <button onClick={() => { setShowConfirm(false); fetchIdeas() }} style={{ flex: 1, padding: '11px', background: '#4a7fc1', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>Get new ideas</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    return null
}
