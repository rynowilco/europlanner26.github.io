import React, { useState } from 'react'
import { CONFIG } from '../config'

// ─── Shared commenter lists ─────────────────────────────────────────────────
// Family (Explorers: kids + parents) always listed first, then Followers.

export const FAMILY_COMMENTERS = Object.values(CONFIG.users || {}).map(u => ({ name: u.name, canComment: true, isFamily: true }))
export const FOLLOWER_COMMENTERS = (CONFIG.TRACKER_FOLLOWERS || []).filter(f => f.canComment).map(f => ({ ...f, isFamily: false }))
export const COMMENTERS = [...FAMILY_COMMENTERS, ...FOLLOWER_COMMENTERS]
export const isFamilyCommenter = (name) => FAMILY_COMMENTERS.some(f => f.name === name)

// ─── CommentSection ──────────────────────────────────────────────────────────
// Shared by TrackerScreen (Followers) and MemoriesScreen (Explorers).
// Props:
//   entryId, entryType   — which journal/photo entry this is attached to
//   comments             — full comments array (filtered internally by entryId)
//   onAddComment         — store.addComment(entryId, entryType, commenterName, text)
//   commenterName         — currently selected "who is commenting" value
//   onSetCommenterName   — setter, should persist to localStorage by caller
//   dark                 — true for use on dark/lightbox backgrounds

export const CommentSection = ({ entryId, entryType, comments, onAddComment, commenterName, onSetCommenterName, dark = false }) => {
    const [text, setText] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const entryComments = (comments || []).filter(c => c.entryId === entryId)

    const handleSubmit = async () => {
        if (!text.trim() || !commenterName) return
        setSubmitting(true)
        await onAddComment(entryId, entryType, commenterName, text.trim())
        setText('')
        setSubmitting(false)
    }

    const bd = dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--color-border)'
    const bg = dark ? 'rgba(255,255,255,0.08)' : 'white'
    const textColor = dark ? 'rgba(255,255,255,0.85)' : 'var(--color-text)'
    const mutedColor = dark ? 'rgba(255,255,255,0.5)' : 'var(--color-text-light)'

    return (
        <div style={{ borderTop: bd, marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)' }}>
            {entryComments.length > 0 && (
                <div style={{ marginBottom: 'var(--space-sm)' }}>
                    {entryComments.map(c => {
                        const isFam = isFamilyCommenter(c.commenterName)
                        return (
                            <div key={c.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                                <div style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', background: isFam ? 'var(--color-terracotta)' : (dark ? 'rgba(255,255,255,0.2)' : 'var(--color-navy)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'white', fontWeight: 700 }}>
                                    {c.commenterName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                </div>
                                <div style={{ flex: 1, background: dark ? 'rgba(255,255,255,0.1)' : 'var(--color-cream)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isFam ? 'var(--color-terracotta)' : (dark ? 'rgba(255,255,255,0.9)' : 'var(--color-navy)'), marginBottom: '2px' }}>{c.commenterName}{isFam ? ' 🏠' : ''}</div>
                                    <div style={{ fontSize: '0.875rem', color: textColor, lineHeight: 1.4 }}>{c.commentText}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            <select value={commenterName} onChange={e => onSetCommenterName(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', border: bd, borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'var(--font-body)', background: bg, color: commenterName ? textColor : mutedColor, outline: 'none', marginBottom: '8px' }}>
                <option value="">Who is commenting?</option>
                <optgroup label="Family">
                    {FAMILY_COMMENTERS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                </optgroup>
                <optgroup label="Followers">
                    {FOLLOWER_COMMENTERS.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                </optgroup>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder={commenterName ? 'Leave a comment...' : 'Select your name above before commenting'}
                    disabled={!commenterName}
                    style={{ flex: 1, padding: '8px 10px', border: bd, borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', outline: 'none', background: bg, color: textColor }} />
                <button onClick={handleSubmit} disabled={!text.trim() || !commenterName || submitting}
                    style={{ padding: '8px 14px', background: !text.trim() || !commenterName ? (dark ? 'rgba(255,255,255,0.1)' : 'var(--color-tan)') : 'var(--color-terracotta)', color: !text.trim() || !commenterName ? mutedColor : 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: !text.trim() || !commenterName ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, flexShrink: 0 }}>
                    {submitting ? '...' : 'Send'}
                </button>
            </div>
        </div>
    )
}
