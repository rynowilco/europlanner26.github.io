import React, { useState } from 'react'

export const FingerprintModal = ({ onSuccess, onCancel }) => {
    const [phase, setPhase] = useState('idle') // idle | scanning | success

    const handleScan = () => {
        if (phase !== 'idle') return
        setPhase('scanning')
        setTimeout(() => {
            setPhase('success')
            setTimeout(() => { onSuccess() }, 900)
        }, 1800)
    }

    const phaseColor = phase === 'success' ? '#4CAF50' : phase === 'scanning' ? 'var(--color-gold)' : 'var(--color-navy)'
    const phaseLabel = phase === 'success' ? '✓ Identity confirmed' : phase === 'scanning' ? 'Scanning...' : 'Place finger on scanner'

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', zIndex: 2000, animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ background: '#0D1B2A', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', width: '100%', maxWidth: '340px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '3px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 'var(--space-lg)' }}>🔒 Secure Access Terminal</div>

                <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-xl)', fontSize: '0.8rem', color: '#FF8A80', lineHeight: 1.5 }}>
                    ⚠️ Warning: Unrecognized fingerprints will lock this device for <strong>72 hours</strong> and notify authorities.
                </div>

                <div onClick={handleScan} style={{ cursor: phase === 'idle' ? 'pointer' : 'default', display: 'inline-block', position: 'relative', marginBottom: 'var(--space-lg)' }}>
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ filter: phase === 'success' ? 'drop-shadow(0 0 12px #4CAF50)' : phase === 'scanning' ? 'drop-shadow(0 0 12px #D4A853)' : 'drop-shadow(0 0 6px rgba(30,58,95,0.8))', transition: 'filter 0.4s' }}>
                        {[
                            'M 60 95 Q 20 95 20 60 Q 20 25 60 25 Q 100 25 100 60 Q 100 78 88 88',
                            'M 60 88 Q 28 88 28 60 Q 28 32 60 32 Q 92 32 92 60 Q 92 74 82 82',
                            'M 60 81 Q 36 81 36 60 Q 36 39 60 39 Q 84 39 84 60 Q 84 70 76 76',
                            'M 60 74 Q 44 74 44 60 Q 44 46 60 46 Q 76 46 76 60 Q 76 66 70 70',
                            'M 60 67 Q 52 67 52 60 Q 52 53 60 53 Q 68 53 68 60 Q 68 62 65 64',
                            'M 42 22 Q 60 14 78 22',
                            'M 35 28 Q 60 16 85 28',
                            'M 60 95 Q 38 97 24 82',
                            'M 60 88 Q 42 91 30 78',
                        ].map((d, i) => (
                            <path key={i} d={d} fill="none" stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round"
                                style={{ opacity: phase === 'scanning' ? 0 : 1, animation: phase === 'scanning' ? `pulse 0.8s ease-in-out ${i * 0.1}s infinite` : 'none', transition: 'stroke 0.4s, opacity 0.3s' }} />
                        ))}
                        {phase === 'success' && (
                            <path d="M 38 60 L 52 74 L 82 44" fill="none" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
                                style={{ animation: 'slideIn 0.3s ease-out' }} />
                        )}
                        <circle cx="60" cy="60" r="56" fill="none" stroke={phaseColor} strokeWidth="1.5" strokeDasharray={phase === 'scanning' ? '8 4' : 'none'} style={{ opacity: 0.4, transition: 'stroke 0.4s', animation: phase === 'scanning' ? 'spin 2s linear infinite' : 'none' }} />
                    </svg>
                    {phase === 'idle' && (
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite', background: 'radial-gradient(circle, rgba(30,58,95,0.15) 0%, transparent 70%)' }} />
                    )}
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: phase === 'success' ? '#4CAF50' : phase === 'scanning' ? 'var(--color-gold)' : 'rgba(255,255,255,0.7)', marginBottom: 'var(--space-xl)', transition: 'color 0.4s', letterSpacing: '0.5px' }}>
                    {phaseLabel}
                </div>

                {phase === 'idle' && (
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', cursor: 'pointer', padding: 'var(--space-sm)' }}>
                        Cancel
                    </button>
                )}
            </div>
        </div>
    )
}
