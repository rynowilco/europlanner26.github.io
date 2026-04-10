import React, { useState } from 'react'

export const AddBookingModal = ({ onSubmit, onCancel }) => {
    const [title, setTitle] = useState('')
    const [city, setCity] = useState('')
    const [notes, setNotes] = useState('')
    const [link, setLink] = useState('')
    const canSubmit = title.trim().length > 0
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>🎟️ Add to Booking List</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-light)' }}>What needs booking <span style={{ color: 'var(--color-error)' }}>*</span></label>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Arena di Verona tickets" autoFocus style={{ width: '100%', padding: 'var(--space-md)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--color-navy)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-light)' }}>City</label>
                        <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Verona" style={{ width: '100%', padding: 'var(--space-md)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--color-navy)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-light)' }}>Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Why it needs booking, best timing, etc." rows={2} style={{ width: '100%', padding: 'var(--space-md)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--color-navy)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-light)' }}>Booking link</label>
                        <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: 'var(--space-md)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--color-navy)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
                    <button onClick={onCancel} style={{ flex: 1, padding: 'var(--space-md)', background: 'var(--color-cream)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                    <button onClick={() => canSubmit && onSubmit({ title: title.trim(), city: city.trim(), notes: notes.trim(), link: link.trim() || null })} disabled={!canSubmit} style={{ flex: 1, padding: 'var(--space-md)', background: canSubmit ? 'var(--color-terracotta)' : 'var(--color-tan)', color: canSubmit ? 'white' : 'var(--color-text-light)', border: 'none', borderRadius: 'var(--radius-md)', cursor: canSubmit ? 'pointer' : 'not-allowed', fontWeight: 600 }}>Add to List</button>
                </div>
            </div>
        </div>
    )
}
