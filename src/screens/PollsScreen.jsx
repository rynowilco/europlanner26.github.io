import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Icon } from '../components/Icon'
import { CONFIG } from '../config'

// ── Constants ─────────────────────────────────────────────────────────────────

const USER_EMOJIS = { abby: '⚽', tyler: '🏈', ryan: '👨‍🍳', mom: '🧜‍♀️' }
const ALL_USER_IDS = ['abby', 'tyler', 'ryan', 'mom']
const TOTAL_VOTERS = ALL_USER_IDS.length

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// Returns per-option vote counts and tie information
const computeResult = (votes, options) => {
    const tally = (options || []).map((_, i) =>
        Object.values(votes || {}).filter(v => v === i).length
    )
    const total = Object.keys(votes || {}).length
    if (total === 0) return { tally, winnerIdx: -1, isTie: false, tiedIndices: [] }
    const max = Math.max(...tally)
    const tiedIndices = tally.map((c, i) => c === max ? i : -1).filter(i => i !== -1)
    return {
        tally,
        winnerIdx: tiedIndices.length === 1 ? tiedIndices[0] : -1,
        isTie: tiedIndices.length > 1,
        tiedIndices
    }
}

// ── AnonymousTally ────────────────────────────────────────────────────────────
// Shows vote count + progress bar. No names — used while poll is open.

const AnonymousTally = ({ count, total, isMyVote }) => {
    const pct = total > 0 ? (count / total) * 100 : 0
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, minWidth: '72px' }}>
            <div style={{ flex: 1, height: '5px', background: '#e0e8f5', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: isMyVote ? '#4a7fc1' : '#a0b8d8', borderRadius: '3px', transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isMyVote ? '#4a7fc1' : 'var(--color-text-light)', minWidth: '16px', textAlign: 'right' }}>{count}</span>
        </div>
    )
}

// ── ClosedResults ─────────────────────────────────────────────────────────────
// Full results with voter names. Used for closed and tied polls.

const ClosedResults = ({ poll, tally, tiedIndices, userProfiles, winnerIdx }) => {
    const votersByOption = (poll.options || []).map((_, i) =>
        Object.entries(poll.votes || {})
            .filter(([, v]) => v === i)
            .map(([uid]) => uid)
    )
    const didNotVote = ALL_USER_IDS.filter(uid => poll.votes?.[uid] === undefined)
    const tieBreak = poll.tieBreak

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(poll.options || []).map((opt, i) => {
                const isWinner = i === winnerIdx
                const isTied = tiedIndices.includes(i)
                const isTieBreakWinner = tieBreak?.optionIndex === i
                const voters = votersByOption[i] || []

                return (
                    <div key={i} style={{
                        padding: '10px 14px',
                        border: isWinner ? '2px solid #27ae60' : isTied ? '2px solid #f0a500' : '1.5px solid var(--color-border)',
                        background: isWinner ? '#e8f8ef' : isTied ? '#fff8e8' : '#f7f9fc',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: voters.length > 0 ? '6px' : 0 }}>
                            <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: isWinner ? 700 : 400, color: isWinner ? '#27ae60' : isTied ? '#b07d00' : 'var(--color-navy)' }}>
                                {isWinner && !isTied && '🏆 '}{opt}
                            </span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isWinner ? '#27ae60' : isTied ? '#b07d00' : 'var(--color-text-light)', flexShrink: 0 }}>
                                {tally[i]} vote{tally[i] !== 1 ? 's' : ''}
                            </span>
                        </div>
                        {voters.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {voters.map(uid => (
                                    <span key={uid} style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        {USER_EMOJIS[uid] || '👤'} {userProfiles?.[uid]?.name || uid}
                                    </span>
                                ))}
                            </div>
                        )}
                        {isTieBreakWinner && (
                            <div style={{ marginTop: '5px', fontSize: '0.75rem', color: '#4a7fc1', fontWeight: 600 }}>
                                🗳️ Tie broken by {userProfiles?.[tieBreak.castBy]?.name || tieBreak.castBy}
                            </div>
                        )}
                    </div>
                )
            })}

            {didNotVote.length > 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', padding: '6px 2px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>❌ Did not vote:</span>
                    {didNotVote.map(uid => (
                        <span key={uid}>{USER_EMOJIS[uid] || '👤'} {userProfiles?.[uid]?.name || uid}</span>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── PollCard ──────────────────────────────────────────────────────────────────

const PollCard = ({ poll, currentUser, userProfiles, onCastVote, onClosePoll, onCancelPoll, onTieBreak }) => {
    const status = poll.status || 'open'
    const isOpen      = status === 'open'
    const isTied      = status === 'tied'
    const isClosed    = status === 'closed'
    const isCancelled = status === 'cancelled'

    const isOwner  = poll.createdBy === currentUser
    const hasVoted = poll.votes?.[currentUser] !== undefined

    const [expanded, setExpanded]         = useState(isOpen || isTied)
    const [selectedOption, setSelectedOption] = useState(null)
    const [submitting, setSubmitting]     = useState(false)
    const [justVoted, setJustVoted]       = useState(false)
    const [confirmCancel, setConfirmCancel] = useState(false)

    const totalVotes = Object.keys(poll.votes || {}).length
    const { tally, winnerIdx, isTie, tiedIndices } = computeResult(poll.votes, poll.options)

    // Winner index: if tie-broken, use the tie-break choice; otherwise computed
    const effectiveWinnerIdx = poll.tieBreak ? poll.tieBreak.optionIndex : winnerIdx

    const handleSubmit = async () => {
        if (selectedOption === null || submitting) return
        setSubmitting(true)
        await onCastVote(poll.pollId, currentUser, selectedOption)
        setSubmitting(false)
        setJustVoted(true)
    }

    const borderColor = { open: '#4a7fc1', tied: '#f0a500', closed: '#27ae60', cancelled: '#ddd' }[status] || '#ddd'

    return (
        <div style={{
            background: isCancelled ? '#fafafa' : 'white',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            border: `1.5px solid ${borderColor}`,
            opacity: isCancelled ? 0.75 : 1
        }}>
            {/* ── Header (always visible, tappable to collapse) ── */}
            <div
                onClick={() => setExpanded(e => !e)}
                style={{ padding: 'var(--space-md) var(--space-lg)', cursor: 'pointer', display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start' }}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isCancelled ? '#999' : 'var(--color-navy)', lineHeight: 1.4, marginBottom: '4px' }}>
                        {poll.question}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                        <span>{USER_EMOJIS[poll.createdBy] || '👤'} {userProfiles?.[poll.createdBy]?.name || poll.createdBy}</span>
                        <span>·</span>
                        <span>{timeAgo(poll.createdAt)}</span>
                        <span>·</span>
                        <span>{totalVotes}/{TOTAL_VOTERS} votes</span>
                        {isOwner && (
                            <span style={{ background: '#4a7fc1', color: 'white', borderRadius: '4px', padding: '1px 6px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                                Your poll
                            </span>
                        )}
                    </div>
                    {/* Status badge for non-open polls */}
                    {!isOpen && (
                        <div style={{ marginTop: '4px' }}>
                            {{
                                tied:      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b07d00', background: '#fff8e8', borderRadius: '4px', padding: '2px 7px' }}>⚖️ Tied — awaiting decision</span>,
                                closed:    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#27ae60', background: '#e8f8ef', borderRadius: '4px', padding: '2px 7px' }}>✅ Closed</span>,
                                cancelled: <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#999', background: '#f0f0f0', borderRadius: '4px', padding: '2px 7px' }}>🚫 Cancelled</span>,
                            }[status]}
                        </div>
                    )}
                </div>
                <div style={{ color: 'var(--color-text-light)', flexShrink: 0, paddingTop: '2px' }}>
                    <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={18} />
                </div>
            </div>

            {/* ── Body ── */}
            {expanded && (
                <div style={{ padding: '0 var(--space-lg) var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>

                    {/* OPEN — user hasn't voted yet */}
                    {isOpen && !hasVoted && !justVoted && (
                        <>
                            {(poll.options || []).map((opt, i) => {
                                const isSelected = selectedOption === i
                                return (
                                    <button key={i}
                                        onClick={() => setSelectedOption(i)}
                                        style={{
                                            width: '100%', textAlign: 'left', padding: '10px 14px',
                                            border: isSelected ? '2px solid #4a7fc1' : '1.5px solid var(--color-border)',
                                            background: isSelected ? '#e8f0fb' : '#f7f9fc',
                                            borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        {/* Radio dot */}
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                                            border: isSelected ? '2px solid #4a7fc1' : '2px solid var(--color-border)',
                                            background: isSelected ? '#4a7fc1' : 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
                                        </div>
                                        <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: isSelected ? 600 : 400, color: 'var(--color-navy)' }}>{opt}</span>
                                        {/* Anonymous live tally if votes exist */}
                                        {totalVotes > 0 && <AnonymousTally count={tally[i]} total={totalVotes} isMyVote={false} />}
                                    </button>
                                )
                            })}
                            <button
                                onClick={handleSubmit}
                                disabled={selectedOption === null || submitting}
                                style={{
                                    marginTop: '4px', width: '100%',
                                    background: selectedOption === null ? '#c5d6ec' : '#4a7fc1',
                                    color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
                                    padding: '11px', fontSize: '0.95rem', fontWeight: 700,
                                    cursor: selectedOption === null ? 'default' : 'pointer',
                                    transition: 'background 0.15s ease'
                                }}
                            >
                                {submitting ? 'Submitting…' : 'Submit Vote'}
                            </button>
                        </>
                    )}

                    {/* OPEN — user has voted (or just voted) */}
                    {isOpen && (hasVoted || justVoted) && (
                        <>
                            {justVoted && (
                                <div style={{ background: '#e8f8ef', border: '1.5px solid #27ae60', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.88rem', color: '#1e7e43', fontWeight: 600 }}>
                                    ✅ Your vote is in! Results will be announced when voting closes.
                                </div>
                            )}
                            {(poll.options || []).map((opt, i) => {
                                const isMyVote = poll.votes?.[currentUser] === i
                                return (
                                    <div key={i} style={{
                                        padding: '10px 14px',
                                        border: isMyVote ? '2px solid #4a7fc1' : '1.5px solid var(--color-border)',
                                        background: isMyVote ? '#e8f0fb' : '#f7f9fc',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex', alignItems: 'center', gap: '10px'
                                    }}>
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                                            border: `2px solid ${isMyVote ? '#4a7fc1' : 'var(--color-border)'}`,
                                            background: isMyVote ? '#4a7fc1' : 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {isMyVote && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
                                        </div>
                                        <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: isMyVote ? 600 : 400, color: 'var(--color-navy)' }}>{opt}</span>
                                        <AnonymousTally count={tally[i]} total={totalVotes} isMyVote={isMyVote} />
                                    </div>
                                )
                            })}
                        </>
                    )}

                    {/* TIED — waiting for owner to break the tie */}
                    {isTied && !isOwner && (
                        <>
                            <div style={{ background: '#fff8e8', border: '1.5px solid #f0a500', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.88rem', color: '#8a5e00', fontWeight: 600 }}>
                                ⚖️ It's a tie! {userProfiles?.[poll.createdBy]?.name || poll.createdBy} is making the final call…
                            </div>
                            <ClosedResults poll={poll} tally={tally} tiedIndices={tiedIndices} userProfiles={userProfiles} winnerIdx={-1} />
                        </>
                    )}

                    {/* TIED — owner sees tie-break options */}
                    {isTied && isOwner && (
                        <>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#8a5e00', marginBottom: '2px' }}>
                                ⚖️ It's a tie — you make the call:
                            </div>
                            {tiedIndices.map(i => (
                                <button key={i}
                                    onClick={() => onTieBreak(poll.pollId, i)}
                                    style={{
                                        width: '100%', textAlign: 'left', padding: '10px 14px',
                                        border: '2px solid #f0a500', background: '#fff8e8',
                                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-navy)',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <span>{poll.options[i]}</span>
                                    <span style={{ fontSize: '0.78rem', color: '#b07d00', marginLeft: '8px', flexShrink: 0 }}>{tally[i]} vote{tally[i] !== 1 ? 's' : ''}</span>
                                </button>
                            ))}
                            <div style={{ marginTop: '4px' }}>
                                <ClosedResults poll={poll} tally={tally} tiedIndices={tiedIndices} userProfiles={userProfiles} winnerIdx={-1} />
                            </div>
                        </>
                    )}

                    {/* CLOSED — full results */}
                    {isClosed && (
                        <ClosedResults poll={poll} tally={tally} tiedIndices={[]} userProfiles={userProfiles} winnerIdx={effectiveWinnerIdx} />
                    )}

                    {/* CANCELLED */}
                    {isCancelled && (
                        <div style={{ fontSize: '0.88rem', color: '#999', fontStyle: 'italic', padding: '4px 2px' }}>
                            This poll was cancelled by {userProfiles?.[poll.createdBy]?.name || poll.createdBy}.
                        </div>
                    )}

                    {/* Owner controls — only for open polls */}
                    {isOpen && isOwner && (
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-sm)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => onClosePoll(poll.pollId)}
                                    disabled={totalVotes === 0}
                                    style={{
                                        flex: 1, background: totalVotes === 0 ? '#c5d6ec' : '#27ae60',
                                        color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
                                        padding: '8px 12px', fontSize: '0.82rem', fontWeight: 600,
                                        cursor: totalVotes === 0 ? 'default' : 'pointer'
                                    }}
                                >
                                    Close Voting ({totalVotes}/{TOTAL_VOTERS})
                                </button>
                                {!confirmCancel ? (
                                    <button
                                        onClick={() => setConfirmCancel(true)}
                                        style={{ background: 'none', border: '1.5px solid #e74c3c', color: '#e74c3c', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                                        <button
                                            onClick={() => { onCancelPoll(poll.pollId); setConfirmCancel(false) }}
                                            style={{ flex: 1, background: '#e74c3c', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Yes, cancel
                                        </button>
                                        <button
                                            onClick={() => setConfirmCancel(false)}
                                            style={{ flex: 1, background: 'none', border: '1.5px solid var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius-md)', padding: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Never mind
                                        </button>
                                    </div>
                                )}
                            </div>
                            {isOwner && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', textAlign: 'center' }}>
                                    🔄 Auto-refreshing every 8 seconds
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── CreatePollModal ───────────────────────────────────────────────────────────

const CreatePollModal = ({ onClose, onSubmit, currentCity, currentUser, userProfiles }) => {
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
            const contextNote = q
                ? `The family is asking: "${q}". Use the location or activity context from the question. If no location is mentioned, assume they're in or near ${currentCity}.`
                : `The family is visiting ${currentCity} and wants activity ideas.`
            const prompt = `${contextNote} Suggest 3–4 specific, fun options for a family with kids aged 11 and 14. Return ONLY a JSON array of short option strings (max 8 words each). Example: ["Visit the old town", "Take a boat tour", "Find the best gelato"]`

            const res = await fetch('/api/claude', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: CONFIG.CLAUDE_MODEL,
                    max_tokens: 300,
                    system: 'Return ONLY a valid JSON array of strings. No preamble, no markdown.',
                    messages: [{ role: 'user', content: prompt }]
                })
            })
            const data = await res.json()
            const text = data.content?.find(b => b.type === 'text')?.text || ''
            const suggested = JSON.parse(text.replace(/```json|```/g, '').trim())
            if (Array.isArray(suggested) && suggested.length > 0) {
                setOptions(suggested.map(s => String(s).slice(0, 80)))
            }
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
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s ease-out' }}
            onClick={onClose}
        >
            <div
                style={{ background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 'var(--space-xl)', paddingBottom: 'calc(var(--space-xl) + env(safe-area-inset-bottom, 0px))', boxShadow: 'var(--shadow-lg)' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)' }}>🗳️ New Poll</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                            from {USER_EMOJIS[currentUser] || '👤'} {userProfiles?.[currentUser]?.name || currentUser} · you'll be the owner
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                        <Icon name="X" size={20} color="var(--color-text-light)" />
                    </button>
                </div>

                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Question</label>
                    <input
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        placeholder="What should we do in Tuscany?"
                        style={{ width: '100%', padding: '12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                </div>

                <button
                    onClick={suggestOptions}
                    disabled={suggesting}
                    style={{ width: '100%', marginBottom: 'var(--space-lg)', background: suggesting ? '#f0f0f0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: suggesting ? 'var(--color-text-light)' : 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: '11px', fontSize: '0.9rem', fontWeight: 600, cursor: suggesting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    {suggesting ? '⏳ Getting ideas from Claude…' : '✨ Suggest options'}
                </button>

                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Options</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {options.map((opt, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    value={opt}
                                    onChange={e => updateOption(i, e.target.value)}
                                    placeholder={`Option ${i + 1}`}
                                    style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                                />
                                {options.length > 2 && (
                                    <button onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)', padding: '4px', flexShrink: 0 }}>
                                        <Icon name="X" size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {options.length < 6 && (
                        <button onClick={addOption} style={{ marginTop: '8px', background: 'none', border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '8px', width: '100%', fontSize: '0.85rem', color: 'var(--color-text-light)', cursor: 'pointer', fontWeight: 500 }}>
                            + Add option
                        </button>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{ width: '100%', background: submitting ? '#a0b8d8' : '#4a7fc1', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', fontSize: '1rem', fontWeight: 700, cursor: submitting ? 'default' : 'pointer', boxShadow: 'var(--shadow-sm)' }}
                >
                    {submitting ? 'Posting…' : 'Post Poll'}
                </button>
            </div>
        </div>
    )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export const PollsScreen = ({
    onBack, polls = [], currentUser, userProfiles, itinerary,
    onCreatePoll, onCastVote, onClosePoll, onCancelPoll, onTieBreak, onRefresh
}) => {
    const [showCreate, setShowCreate]     = useState(false)
    const [showHowItWorks, setShowHowItWorks] = useState(false)
    const [refreshing, setRefreshing]     = useState(false)
    const [showClosed, setShowClosed]     = useState(false)
    const [showCancelled, setShowCancelled] = useState(false)

    const currentCity = useMemo(() => getCurrentCity(itinerary), [itinerary])

    const openPolls      = polls.filter(p => p.status === 'open')
    const tiedPolls      = polls.filter(p => p.status === 'tied')
    const closedPolls    = polls.filter(p => p.status === 'closed' || p.status === 'resolved')
    const cancelledPolls = polls.filter(p => p.status === 'cancelled')

    // Auto-refresh every 8s when current user owns an active (open or tied) poll
    const isOwnerOfActivePolls = useMemo(() =>
        polls.some(p => p.createdBy === currentUser && (p.status === 'open' || p.status === 'tied'))
    , [polls, currentUser])

    const refreshRef = useRef(onRefresh)
    useEffect(() => { refreshRef.current = onRefresh }, [onRefresh])

    useEffect(() => {
        if (!isOwnerOfActivePolls) return
        const interval = setInterval(() => {
            refreshRef.current?.().catch(() => {})
        }, 8000)
        return () => clearInterval(interval)
    }, [isOwnerOfActivePolls])

    // Mark polls as seen
    useEffect(() => {
        if (polls.length > 0) {
            const latest = [...polls].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt
            if (latest) localStorage.setItem('euroPlanner_lastSeenPoll', latest)
        }
    }, [])

    const handleRefresh = async () => {
        if (refreshing || !onRefresh) return
        setRefreshing(true)
        try { await onRefresh() } catch {}
        setRefreshing(false)
    }

    const handleCreate = async (question, options) => {
        await onCreatePoll(question, options, currentUser)
    }

    const sectionLabel = (label, color = 'var(--color-text-light)') => (
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-xs)' }}>
            {label}
        </div>
    )

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            {/* Header */}
            <div style={{ background: '#4a7fc1', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
                    <Icon name="ArrowLeft" size={20} color="white" />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>🗳️ Family Polls</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span>{currentCity} · {openPolls.length} open</span>
                        {isOwnerOfActivePolls && (
                            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 600 }}>
                                🔄 Auto-refreshing
                            </span>
                        )}
                    </div>
                </div>
                {/* Manual refresh */}
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Refresh polls"
                    style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: refreshing ? 'default' : 'pointer', flexShrink: 0, fontSize: '15px', lineHeight: 1, animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}
                >
                    🔄
                </button>
                <button
                    onClick={() => setShowHowItWorks(true)}
                    style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}
                >
                    ?
                </button>
            </div>

            {/* Sticky Create Poll */}
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-md) var(--space-lg)', flexShrink: 0 }}>
                <button
                    onClick={() => setShowCreate(true)}
                    style={{ width: '100%', background: '#4a7fc1', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                >
                    🗳️ Create Poll
                </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

                {/* Tied polls — prominent, always shown when present */}
                {tiedPolls.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {sectionLabel('⚖️ Awaiting Decision', '#b07d00')}
                        {tiedPolls.map(poll => (
                            <PollCard key={poll.pollId} poll={poll} currentUser={currentUser} userProfiles={userProfiles} onCastVote={onCastVote} onClosePoll={onClosePoll} onCancelPoll={onCancelPoll} onTieBreak={onTieBreak} />
                        ))}
                    </div>
                )}

                {/* Open polls */}
                {openPolls.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {sectionLabel('Open')}
                        {openPolls.map(poll => (
                            <PollCard key={poll.pollId} poll={poll} currentUser={currentUser} userProfiles={userProfiles} onCastVote={onCastVote} onClosePoll={onClosePoll} onCancelPoll={onCancelPoll} onTieBreak={onTieBreak} />
                        ))}
                    </div>
                ) : tiedPolls.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2xl) var(--space-lg)', gap: 'var(--space-lg)', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', background: '#e8f0fb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🗳️</div>
                        <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>No open polls</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: 1.6, maxWidth: '260px' }}>Can't agree on something? Create a poll and let the family decide.</div>
                        </div>
                    </div>
                )}

                {/* Closed polls — collapsible, collapsed by default */}
                {closedPolls.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowClosed(s => !s)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: showClosed ? 'var(--space-sm)' : 0 }}
                        >
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#27ae60', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                ✅ Closed ({closedPolls.length})
                            </span>
                            <Icon name={showClosed ? 'ChevronUp' : 'ChevronDown'} size={16} color="var(--color-text-light)" />
                        </button>
                        {showClosed && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {closedPolls.map(poll => (
                                    <PollCard key={poll.pollId} poll={poll} currentUser={currentUser} userProfiles={userProfiles} onCastVote={onCastVote} onClosePoll={onClosePoll} onCancelPoll={onCancelPoll} onTieBreak={onTieBreak} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Cancelled polls — collapsible, collapsed by default */}
                {cancelledPolls.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowCancelled(s => !s)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: showCancelled ? 'var(--space-sm)' : 0 }}
                        >
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                🚫 Cancelled ({cancelledPolls.length})
                            </span>
                            <Icon name={showCancelled ? 'ChevronUp' : 'ChevronDown'} size={16} color="var(--color-text-light)" />
                        </button>
                        {showCancelled && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {cancelledPolls.map(poll => (
                                    <PollCard key={poll.pollId} poll={poll} currentUser={currentUser} userProfiles={userProfiles} onCastVote={onCastVote} onClosePoll={onClosePoll} onCancelPoll={onCancelPoll} onTieBreak={onTieBreak} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* How It Works modal */}
            {showHowItWorks && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }}
                    onClick={() => setShowHowItWorks(false)}
                >
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', maxWidth: '320px', width: '100%', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy)' }}>How Polls Work</div>
                            <button onClick={() => setShowHowItWorks(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <Icon name="X" size={20} color="var(--color-text-light)" />
                            </button>
                        </div>
                        {[
                            { icon: '🗳️', text: 'Anyone can create a poll — you become the owner and can close it or break a tie.' },
                            { icon: '👆', text: 'Select your answer and tap Submit. You can\'t change your vote after.' },
                            { icon: '📊', text: 'Live vote counts show anonymously while the poll is open.' },
                            { icon: '✅', text: 'The poll closes automatically when all 4 votes are in — or the owner can close early.' },
                            { icon: '⚖️', text: 'If there\'s a tie, the owner breaks it. Their choice is noted in the results.' },
                        ].map((step, i, arr) => (
                            <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start', marginBottom: i < arr.length - 1 ? 'var(--space-md)' : 0 }}>
                                <span style={{ fontSize: '20px', flexShrink: 0 }}>{step.icon}</span>
                                <span style={{ fontSize: '0.88rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{step.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showCreate && (
                <CreatePollModal
                    onClose={() => setShowCreate(false)}
                    onSubmit={handleCreate}
                    currentCity={currentCity}
                    currentUser={currentUser}
                    userProfiles={userProfiles}
                />
            )}
        </div>
    )
}
