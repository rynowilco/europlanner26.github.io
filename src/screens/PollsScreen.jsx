import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Icon } from '../components/Icon'
import { CONFIG } from '../config'

const USER_EMOJIS = { abby: '⚽', tyler: '🏈', ryan: '👨‍🍳', mom: '🧜‍♀️' }
const USER_ORDER = ['abby', 'tyler', 'ryan', 'mom']

const timeAgo = (isoString) => {
    if (!isoString) return ''
    const diff = Date.now() - new Date(isoString).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 2) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

const getCurrentCity = (itinerary) => {
    if (!itinerary?.length) return 'your next city'
    const today = new Date().toISOString().split('T')[0]
    const current = itinerary.find(c => c.startDate <= today && today <= c.endDate)
    return current?.city || itinerary[0]?.city || 'your next city'
}

const tallyVotes = (votes, options) => {
    const tally = options.map(() => [])
    Object.entries(votes || {}).forEach(([userId, optIdx]) => {
        if (tally[optIdx]) tally[optIdx].push(userId)
    })
    return tally
}

// Returns { winnerIdx, isTie, tiedIndices } — winnerIdx is -1 if no votes yet
const computeResult = (votes, options) => {
    const tally = tallyVotes(votes, options)
    const totalVotes = Object.keys(votes || {}).length
    if (totalVotes === 0) return { winnerIdx: -1, isTie: false, tiedIndices: [] }
    let max = 0
    tally.forEach(voters => { if (voters.length > max) max = voters.length })
    const tiedIndices = tally.map((v, i) => v.length === max ? i : -1).filter(i => i !== -1)
    return {
        winnerIdx: tiedIndices.length === 1 ? tiedIndices[0] : -1,
        isTie: tiedIndices.length > 1,
        tiedIndices
    }
}

// ─── VoterBubbles ─────────────────────────────────────────────────────────────

const VoterBubbles = ({ voters, userProfiles }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
        {voters.map(uid => (
            <span key={uid} title={userProfiles?.[uid]?.name || uid} style={{ fontSize: '14px', lineHeight: 1 }}>
                {USER_EMOJIS[uid] || '👤'}
            </span>
        ))}
    </div>
)

// ─── PollCard ─────────────────────────────────────────────────────────────────

const PollCard = ({ poll, activeUser, userProfiles, onCastVote, onResolve, isParent }) => {
    const [expanded, setExpanded] = useState(true)
    const myVote = poll.votes?.[activeUser]
    const tally = tallyVotes(poll.votes, poll.options)
    const totalVotes = Object.keys(poll.votes || {}).length
    const { winnerIdx, isTie, tiedIndices } = computeResult(poll.votes, poll.options)
    const isResolved = poll.status === 'resolved'

    return (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', border: isResolved ? '1.5px solid var(--color-border)' : '1.5px solid #4a7fc1' }}>
            {/* Header */}
            <div onClick={() => setExpanded(e => !e)} style={{ padding: 'var(--space-md) var(--space-lg)', cursor: 'pointer', display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-navy)', lineHeight: 1.4, marginBottom: '4px' }}>
                        {isResolved && <span style={{ color: '#27ae60', marginRight: '6px' }}>✅</span>}
                        {poll.question}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                        {USER_EMOJIS[poll.createdBy] || '👤'} {userProfiles?.[poll.createdBy]?.name || poll.createdBy} · {timeAgo(poll.createdAt)} · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                        {isResolved && isTie && <span style={{ marginLeft: '6px' }}>· 🤝 Tie</span>}
                    </div>
                </div>
                <div style={{ color: 'var(--color-text-light)', flexShrink: 0, paddingTop: '2px' }}>
                    <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={18} />
                </div>
            </div>

            {/* Options */}
            {expanded && (
                <div style={{ padding: '0 var(--space-lg) var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {poll.options.map((opt, i) => {
                        const isMyVote = myVote === i
                        const isWinner = isResolved && !isTie && i === winnerIdx
                        const isTied = isResolved && isTie && tiedIndices.includes(i)
                        const voters = tally[i] || []

                        let bg = '#f7f9fc', border = '1.5px solid var(--color-border)', circleColor = 'white', circleBorder = '2px solid var(--color-border)', labelColor = '#4a7fc1'
                        if (isWinner) { bg = '#e8f8ef'; border = '2px solid #27ae60'; circleColor = '#27ae60'; circleBorder = '2px solid #27ae60'; labelColor = '#27ae60' }
                        else if (isTied) { bg = '#fff8e8'; border = '2px solid #f0a500'; circleColor = '#f0a500'; circleBorder = '2px solid #f0a500'; labelColor = '#f0a500' }
                        else if (isMyVote) { bg = '#e8f0fb'; border = '2px solid #4a7fc1'; circleColor = '#4a7fc1'; circleBorder = '2px solid #4a7fc1' }

                        return (
                            <button key={i}
                                onClick={() => !isResolved && activeUser && onCastVote(poll.pollId, activeUser, i)}
                                disabled={isResolved || !activeUser}
                                style={{ width: '100%', background: bg, border, borderRadius: 'var(--radius-md)', padding: '10px 14px', cursor: isResolved || !activeUser ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', textAlign: 'left', transition: 'all 0.15s ease' }}
                            >
                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, background: (isMyVote || isWinner || isTied) ? circleColor : 'white', border: circleBorder, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {(isMyVote || isWinner || isTied) && <Icon name="Check" size={13} color="white" />}
                                </div>
                                <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: isMyVote || isWinner || isTied ? 600 : 400, color: 'var(--color-navy)' }}>
                                    {opt}
                                    {isWinner && <span style={{ color: '#27ae60', marginLeft: '8px', fontSize: '0.8rem' }}>Winner! 🏆</span>}
                                    {isTied && <span style={{ color: '#f0a500', marginLeft: '8px', fontSize: '0.8rem' }}>Tied 🤝</span>}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    {voters.length > 0 && <VoterBubbles voters={voters} userProfiles={userProfiles} />}
                                    {totalVotes > 0 && <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isWinner ? '#27ae60' : isTied ? '#f0a500' : isMyVote ? '#4a7fc1' : 'var(--color-text-light)', minWidth: '18px', textAlign: 'right' }}>{voters.length}</span>}
                                </div>
                            </button>
                        )
                    })}

                    {/* Lock it in — parents only, open polls */}
                    {isParent && !isResolved && totalVotes > 0 && (
                        <button onClick={() => onResolve(poll.pollId)} style={{ marginTop: 'var(--space-xs)', alignSelf: 'flex-end', background: '#27ae60', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '7px 16px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                            Lock it in ✅
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Identity Bar — 2×2 grid ──────────────────────────────────────────────────

const IdentityBar = ({ activeUser, setActiveUser, userProfiles, shaking }) => (
    <div style={{
        background: shaking ? '#fff3f3' : '#f0f4fa',
        borderBottom: '1px solid var(--color-border)',
        padding: '10px var(--space-lg)',
        flexShrink: 0,
        transition: 'background 0.2s',
        animation: shaking ? 'shake 0.4s ease' : 'none'
    }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: shaking ? '#c0392b' : 'var(--color-text-light)', marginBottom: '8px' }}>
            {activeUser ? `Voting as ${USER_EMOJIS[activeUser]} ${userProfiles?.[activeUser]?.name || activeUser}` : shaking ? '⬆ Tap your name first' : 'Who are you?'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {USER_ORDER.map(uid => {
                const isActive = activeUser === uid
                const name = userProfiles?.[uid]?.name || uid
                return (
                    <button key={uid} onClick={() => setActiveUser(isActive ? null : uid)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: isActive ? '2px solid #4a7fc1' : '1.5px solid var(--color-border)', background: isActive ? '#e8f0fb' : 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: isActive ? 700 : 400, color: isActive ? '#4a7fc1' : 'var(--color-text)', transition: 'all 0.15s ease' }}>
                        <span style={{ fontSize: '18px' }}>{USER_EMOJIS[uid] || '👤'}</span>
                        {name}
                    </button>
                )
            })}
        </div>
    </div>
)

// ─── Create Poll Modal ────────────────────────────────────────────────────────

const CreatePollModal = ({ onClose, onSubmit, currentCity, activeUser, userProfiles }) => {
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState(['', ''])
    const [suggesting, setSuggesting] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const updateOption = (i, val) => setOptions(prev => prev.map((o, idx) => idx === i ? val : o))
    const addOption = () => { if (options.length < 6) setOptions(prev => [...prev, '']) }
    const removeOption = (i) => { if (options.length > 2) setOptions(prev => prev.filter((_, idx) => idx !== i)) }

    const suggestOptions = async () => {
        setSuggesting(true)
        try {
            const q = question.trim()
            // Question provides primary context; currentCity is the fallback hint
            const contextNote = q
                ? `The family is asking: "${q}". Use the location or activity context from the question itself. If no specific location is mentioned, assume they're in or near ${currentCity}.`
                : `The family is visiting ${currentCity} and wants activity ideas.`
            const prompt = `${contextNote} Suggest 3–4 specific, fun options for a family with kids aged 11 and 14. Return ONLY a JSON array of short option strings (max 8 words each). Example: ["Visit the old town", "Take a boat tour", "Find the best gelato"]`

            const res = await fetch('/api/claude', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: CONFIG.CLAUDE_MODEL, max_tokens: 300, system: 'Return ONLY a valid JSON array of strings. No preamble, no markdown.', messages: [{ role: 'user', content: prompt }] })
            })
            const data = await res.json()
            const text = data.content?.find(b => b.type === 'text')?.text || ''
            const suggested = JSON.parse(text.replace(/```json|```/g, '').trim())
            if (Array.isArray(suggested) && suggested.length > 0) setOptions(suggested.map(s => String(s).slice(0, 80)))
        } catch (e) { console.error('Suggest failed:', e) }
        setSuggesting(false)
    }

    const handleSubmit = async () => {
        const validOptions = options.map(o => o.trim()).filter(Boolean)
        if (!question.trim()) { alert('Please enter a question.'); return }
        if (validOptions.length < 2) { alert('Add at least 2 options.'); return }
        setSubmitting(true)
        await onSubmit(question.trim(), validOptions)
        setSubmitting(false)
        onClose()
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s ease-out' }} onClick={onClose}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 'var(--space-xl)', paddingBottom: 'calc(var(--space-xl) + env(safe-area-inset-bottom, 0px))', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)' }}>🗳️ New Poll</div>
                        {activeUser && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '2px' }}>from {USER_EMOJIS[activeUser]} {userProfiles?.[activeUser]?.name || activeUser}</div>}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><Icon name="X" size={20} color="var(--color-text-light)" /></button>
                </div>

                {/* Question */}
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Question</label>
                    <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="What should we do in Tuscany?" style={{ width: '100%', padding: '12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>

                {/* Suggest — no city name in label */}
                <button onClick={suggestOptions} disabled={suggesting} style={{ width: '100%', marginBottom: 'var(--space-lg)', background: suggesting ? '#f0f0f0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: suggesting ? 'var(--color-text-light)' : 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '11px', fontSize: '0.9rem', fontWeight: 600, cursor: suggesting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {suggesting ? '⏳ Getting ideas from Claude…' : '✨ Suggest options'}
                </button>

                {/* Options */}
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Options</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {options.map((opt, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }} />
                                {options.length > 2 && <button onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)', padding: '4px', flexShrink: 0 }}><Icon name="X" size={16} /></button>}
                            </div>
                        ))}
                    </div>
                    {options.length < 6 && <button onClick={addOption} style={{ marginTop: '8px', background: 'none', border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '8px', width: '100%', fontSize: '0.85rem', color: 'var(--color-text-light)', cursor: 'pointer', fontWeight: 500 }}>+ Add option</button>}
                </div>

                <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', background: submitting ? '#a0b8d8' : '#4a7fc1', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', fontSize: '1rem', fontWeight: 700, cursor: submitting ? 'default' : 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                    {submitting ? 'Posting…' : 'Post Poll'}
                </button>
            </div>
        </div>
    )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const PollsScreen = ({ onBack, polls = [], currentUser, userProfiles, itinerary, onCreatePoll, onCastVote, onResolvePoll }) => {
    const [showHowItWorks, setShowHowItWorks] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [activeUser, setActiveUser] = useState(currentUser || null)
    const [shaking, setShaking] = useState(false)

    const isParent = activeUser === 'ryan' || activeUser === 'mom'
    const currentCity = useMemo(() => getCurrentCity(itinerary), [itinerary])

    const openPolls = polls.filter(p => p.status === 'open')
    const resolvedPolls = polls.filter(p => p.status === 'resolved')

    // Mark polls as seen when screen mounts
    useEffect(() => {
        if (polls.length > 0) {
            const latest = [...polls].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt
            if (latest) localStorage.setItem('euroPlanner_lastSeenPoll', latest)
        }
    }, [])

    const triggerShake = () => {
        setShaking(true)
        setTimeout(() => setShaking(false), 500)
    }

    const handleOpenCreate = () => {
        if (!activeUser) { triggerShake(); return }
        setShowCreate(true)
    }

    const handleCreate = async (question, options) => {
        await onCreatePoll(question, options, activeUser)
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>

            {/* Shake keyframe */}
            <style>{`
                @keyframes shake {
                    0%,100% { transform: translateX(0); }
                    20% { transform: translateX(-6px); }
                    40% { transform: translateX(6px); }
                    60% { transform: translateX(-4px); }
                    80% { transform: translateX(4px); }
                }
            `}</style>

            {/* Header */}
            <div style={{ background: '#4a7fc1', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
                    <Icon name="ArrowLeft" size={20} color="white" />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>🗳️ Family Polls</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{currentCity} · {openPolls.length} open</div>
                </div>
                <button onClick={() => setShowHowItWorks(true)} style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}>?</button>
            </div>

            {/* Identity bar — 2×2 grid */}
            <IdentityBar activeUser={activeUser} setActiveUser={setActiveUser} userProfiles={userProfiles} shaking={shaking} />

            {/* Sticky Create Poll */}
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-md) var(--space-lg)', flexShrink: 0 }}>
                <button onClick={handleOpenCreate} style={{ width: '100%', background: '#4a7fc1', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                    🗳️ Create Poll
                </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                {openPolls.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {openPolls.map(poll => <PollCard key={poll.pollId} poll={poll} activeUser={activeUser} userProfiles={userProfiles} onCastVote={onCastVote} onResolve={onResolvePoll} isParent={isParent} />)}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2xl) var(--space-lg)', gap: 'var(--space-lg)', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', background: '#e8f0fb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🗳️</div>
                        <div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>No open polls</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', lineHeight: 1.6, maxWidth: '260px' }}>Can't agree on what to do? Create a poll and let the family vote.</div>
                        </div>
                    </div>
                )}
                {resolvedPolls.length > 0 && (
                    <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-sm)' }}>Resolved</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {resolvedPolls.map(poll => <PollCard key={poll.pollId} poll={poll} activeUser={activeUser} userProfiles={userProfiles} onCastVote={onCastVote} onResolve={onResolvePoll} isParent={isParent} />)}
                        </div>
                    </div>
                )}
            </div>

            {/* How It Works */}
            {showHowItWorks && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }} onClick={() => setShowHowItWorks(false)}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', maxWidth: '320px', width: '100%', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)' }}>How Polls Work</div>
                            <button onClick={() => setShowHowItWorks(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><Icon name="X" size={20} color="var(--color-text-light)" /></button>
                        </div>
                        {[
                            { icon: '👤', text: 'Tap your name so the app knows who\'s voting' },
                            { icon: '💬', text: 'Create a poll — include the city in your question for better AI suggestions' },
                            { icon: '✨', text: 'Tap "Suggest options" — Claude reads your question to pick relevant activities' },
                            { icon: '✅', text: 'Ryan or Mom taps "Lock it in" once the family has decided' },
                        ].map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start', marginBottom: i < 3 ? 'var(--space-md)' : 0 }}>
                                <span style={{ fontSize: '20px', flexShrink: 0 }}>{step.icon}</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{step.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showCreate && <CreatePollModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} currentCity={currentCity} activeUser={activeUser} userProfiles={userProfiles} />}
        </div>
    )
}
