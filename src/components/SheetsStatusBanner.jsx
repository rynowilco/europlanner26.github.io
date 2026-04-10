import React, { useEffect } from 'react'

export const SheetsStatusBanner = ({ error, onDismiss }) => {
    useEffect(() => {
        if (!error) return
        const t = setTimeout(onDismiss, 8000)
        return () => clearTimeout(t)
    }, [error])

    if (!error) return null

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
            background: '#7a4f1e', color: '#fff',
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 13, fontFamily: 'var(--font-body)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s ease'
        }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ flex: 1 }}>
                <strong>Couldn't reach trip data</strong> — showing cached info. Changes may not save until reconnected.
            </span>
            <button onClick={onDismiss} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 12
            }}>Dismiss</button>
        </div>
    )
}
