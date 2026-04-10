import React, { useState } from 'react'

export const FeedbackModal = ({ activity, onSubmit, onCancel }) => {
    const [feedback, setFeedback] = useState('')
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>Feedback for {activity?.kidName}</h2>
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: 'var(--space-lg)' }}>"{activity?.title}"</p>
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What changes would help?" rows={4} autoFocus style={{ width: '100%', padding: 'var(--space-md)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontFamily: 'var(--font-body)', resize: 'vertical', marginBottom: 'var(--space-md)' }} />
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: 'var(--space-md)', background: 'var(--color-cream)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                    <button onClick={() => onSubmit(feedback)} disabled={!feedback.trim()} style={{ flex: 1, padding: 'var(--space-md)', background: feedback.trim() ? 'var(--color-warning)' : 'var(--color-tan)', color: feedback.trim() ? 'white' : 'var(--color-text-light)', border: 'none', borderRadius: 'var(--radius-md)', cursor: feedback.trim() ? 'pointer' : 'not-allowed', fontWeight: 500 }}>Send</button>
                </div>
            </div>
        </div>
    )
}
