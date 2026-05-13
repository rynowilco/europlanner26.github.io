import React, { useState, useEffect } from 'react'
import { CONFIG } from '../config'
import { Icon } from '../components/Icon'

// ─── Claude call (same inline pattern as TrackerScreen) ──────────────────────

const generateStory = async (entries, targetDate, itinerary) => {
    const cityEntry = itinerary?.find(c => c.startDate <= targetDate && targetDate <= c.endDate)
    const cityLine = cityEntry ? `Location: ${cityEntry.city}, ${cityEntry.country}` : ''

    const compiled = entries.map(e => {
        const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''
        const who = e.userName || 'Family'
        const type = (e.entryType === 'photo' || e.photoUrl) ? 'photo caption' : 'journal entry'
        const text = e.entryText || e.caption || ''
        return `[${who} – ${type}${time ? ', ' + time : ''}] ${text}`
    }).filter(line => line.trim().length > 30).join('\n')

    if (!compiled) throw new Error('No content to generate from')

    const prompt = `You are writing a daily travel narrative for the Wilcoxson family — Team Wonder & Awe — on their 3-week Europe trip in Summer 2026.

The family: Ryan (dad, 50, seafood-obsessed, dry humor), Mom (48, loves water, hiking, and culture), Abby (11, soccer player, loves food and shopping), Tyler (14, sports fan, curious about everything).
${cityLine}
Date: ${targetDate}

Here's what the family shared today:
${compiled}

Write a warm, vivid, funny ~300-word narrative of today — told in first-person plural ("we") as if written that evening. Voice: enthusiastic, specific, a little self-deprecating, full of heart — like a dad who also happens to be a great storyteller. Include the specific moments, foods, and observations from the entries above. Natural paragraph breaks. No headers, no bullet points. Just the story.`

    const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: CONFIG.CLAUDE_MODEL,
            max_tokens: 600,
            messages: [{ role: 'user', content: prompt }]
        })
    })
    if (!response.ok) throw new Error('API error ' + response.status)
    const data = await response.json()
    const textBlocks = (data?.content || []).filter(b => b.type === 'text')
    if (!textBlocks.length) throw new Error('No response from Claude')
    return textBlocks.map(b => b.text).join('')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatStoryDate = (dateStr) => {
    if (!dateStr) return 'Unknown Date'
    const dt = new Date(dateStr + 'T00:00:00')
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// ─── GenerateModal ────────────────────────────────────────────────────────────

const GenerateModal = ({ journalEntries, itinerary, currentUser, userProfiles, existingStory, onSave, onCancel }) => {
    const [phase, setPhase] = useState('preview') // preview | generating | done | error
    const [generatedText, setGeneratedText] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    // Find most recent date with entries
    const datesWithEntries = [...new Set(
        journalEntries
            .filter(e => e.entryText || e.photoUrl)
            .map(e => e.date || (e.timestamp ? e.timestamp.split('T')[0] : null))
            .filter(Boolean)
    )].sort((a, b) => b.localeCompare(a))

    const targetDate = datesWithEntries[0] || null
    const targetEntries = targetDate
        ? journalEntries.filter(e => {
            const d = e.date || (e.timestamp ? e.timestamp.split('T')[0] : null)
            return d === targetDate && (e.entryText || e.photoUrl)
        })
        : []

    const alreadyHasStory = existingStory?.date === targetDate
    const currentUserName = userProfiles?.[currentUser]?.name || currentUser || 'Explorer'

    const handleGenerate = async () => {
        setPhase('generating')
        try {
            const story = await generateStory(targetEntries, targetDate, itinerary)
            setGeneratedText(story)
            setPhase('done')
        } catch (e) {
            setErrorMsg(e.message || 'Something went wrong. Try again.')
            setPhase('error')
        }
    }

    const handleSave = async () => {
        await onSave(targetDate, generatedText, currentUserName)
        onCancel()
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 600, display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s ease-out' }}
            onClick={phase !== 'generating' ? onCancel : undefined}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', padding: 'var(--space-xl)', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>✨ Daily Story</div>
                        {targetDate && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '2px' }}>{formatStoryDate(targetDate)}</div>}
                    </div>
                    {phase !== 'generating' && (
                        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                            <Icon name="X" size={20} color="var(--color-text-light)" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {!targetDate && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)' }}>
                            <div style={{ fontSize: '40px', marginBottom: 'var(--space-md)' }}>📭</div>
                            <p style={{ fontWeight: 600, color: 'var(--color-navy)' }}>No entries yet</p>
                            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.6, marginTop: 'var(--space-sm)' }}>Add some journal entries or photos first, then come back to generate today's story.</p>
                        </div>
                    )}

                    {targetDate && phase === 'preview' && (
                        <>
                            <div style={{ background: 'var(--color-cream)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-lg)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                <div style={{ fontWeight: 600, color: 'var(--color-navy)', marginBottom: 'var(--space-xs)' }}>📚 Compiling from {targetEntries.length} {targetEntries.length === 1 ? 'entry' : 'entries'}:</div>
                                {targetEntries.slice(0, 4).map((e, i) => (
                                    <div key={i} style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '4px' }}>
                                        · {e.userName}: {(e.entryText || e.caption || '').slice(0, 60)}{(e.entryText || '').length > 60 ? '…' : ''}
                                    </div>
                                ))}
                                {targetEntries.length > 4 && <div style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '4px' }}>· …and {targetEntries.length - 4} more</div>}
                            </div>
                            {alreadyHasStory && (
                                <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', fontSize: '0.85rem', color: '#7a6020' }}>
                                    ⚠️ A story already exists for this day. Generating will replace it.
                                </div>
                            )}
                            <button onClick={handleGenerate} style={{ width: '100%', padding: 'var(--space-lg)', background: 'linear-gradient(135deg, var(--color-navy), #2a5298)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1rem', fontWeight: 600 }}>
                                ✨ {alreadyHasStory ? 'Regenerate Story' : 'Generate Story'}
                            </button>
                        </>
                    )}

                    {phase === 'generating' && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)' }}>
                            <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-tan)', borderTopColor: 'var(--color-navy)', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto var(--space-lg)' }} />
                            <p style={{ fontWeight: 600, color: 'var(--color-navy)' }}>Writing your story…</p>
                            <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: 'var(--space-sm)' }}>Claude is weaving the day's moments together</p>
                        </div>
                    )}

                    {phase === 'done' && (
                        <>
                            <div style={{ background: 'var(--color-cream)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)', lineHeight: 1.75, fontSize: '0.95rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                                {generatedText}
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button onClick={() => setPhase('preview')} style={{ flex: 1, padding: 'var(--space-md)', background: 'white', color: 'var(--color-navy)', border: '2px solid var(--color-navy)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                                    Regenerate
                                </button>
                                <button onClick={handleSave} style={{ flex: 2, padding: 'var(--space-md)', background: 'var(--color-terracotta)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                                    💾 Save Story
                                </button>
                            </div>
                        </>
                    )}

                    {phase === 'error' && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                            <div style={{ fontSize: '36px', marginBottom: 'var(--space-md)' }}>😬</div>
                            <p style={{ fontWeight: 600, color: 'var(--color-navy)' }}>Something went wrong</p>
                            <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>{errorMsg}</p>
                            <button onClick={() => setPhase('preview')} style={{ padding: 'var(--space-md) var(--space-xl)', background: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>Try Again</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── DailyStoriesScreen ───────────────────────────────────────────────────────

export const DailyStoriesScreen = ({ onBack, journalDigest, journalEntries, itinerary, currentUser, userProfiles, onSaveStory, canGenerate }) => {
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [expandedDate, setExpandedDate] = useState(null)

    // Mark stories as seen on mount
    useEffect(() => {
        if (journalDigest?.length > 0) {
            const latestDate = [...journalDigest].sort((a, b) => b.date.localeCompare(a.date))[0]?.date
            if (latestDate) {
                try { localStorage.setItem('euroPlanner_lastSeenStory', latestDate) } catch {}
            }
        }
    }, [])

    const sorted = [...(journalDigest || [])].sort((a, b) => b.date.localeCompare(a.date))

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-cream)' }}>
            {/* Header */}
            <div style={{ background: 'var(--color-navy)', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
                    <Icon name="ArrowLeft" size={20} color="white" />
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>✨ Daily Stories</div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>
                        {sorted.length === 0 ? 'Stories will appear here during the trip' : `${sorted.length} ${sorted.length === 1 ? 'story' : 'stories'} from the road`}
                    </div>
                </div>
                {canGenerate && (
                    <button onClick={() => setShowGenerateModal(true)}
                        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-md)', padding: '8px 14px', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                        ✨ Generate
                    </button>
                )}
            </div>

            {/* Story list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
                {sorted.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)', animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{ fontSize: '52px', marginBottom: 'var(--space-md)' }}>📖</div>
                        <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '1.05rem', marginBottom: 'var(--space-sm)' }}>No stories yet</p>
                        <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            {canGenerate
                                ? 'Once the trip starts and journal entries come in, tap ✨ Generate to write the first story.'
                                : 'Check back once Team Wonder & Awe starts writing — daily stories will appear here!'}
                        </p>
                    </div>
                ) : (
                    sorted.map((entry, i) => {
                        const isExpanded = expandedDate === entry.date
                        const preview = entry.story?.slice(0, 180)
                        return (
                            <div key={entry.date} style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', animation: 'slideUp 0.4s ease-out', cursor: 'pointer' }}
                                onClick={() => setExpandedDate(isExpanded ? null : entry.date)}>
                                {/* Date header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            ✨ Daily Story
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-navy)', marginTop: '2px' }}>
                                            {formatStoryDate(entry.date)}
                                        </div>
                                    </div>
                                    <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={18} color="var(--color-text-light)" />
                                </div>

                                {/* Story text */}
                                <p style={{ fontSize: '0.95rem', lineHeight: 1.75, color: 'var(--color-text)', margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {isExpanded ? entry.story : preview + (entry.story?.length > 180 ? '…' : '')}
                                </p>

                                {/* Footer */}
                                {isExpanded && entry.generatedBy && (
                                    <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border)', fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                                        Written by Claude · curated by {entry.generatedBy}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {showGenerateModal && (
                <GenerateModal
                    journalEntries={journalEntries || []}
                    itinerary={itinerary}
                    currentUser={currentUser}
                    userProfiles={userProfiles}
                    existingStory={sorted[0]}
                    onSave={onSaveStory}
                    onCancel={() => setShowGenerateModal(false)}
                />
            )}
        </div>
    )
}
