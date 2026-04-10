import React from 'react'

// Phase 1 scaffold — screens will be added in Phase 2.
// This stub confirms Vite builds, Vercel deploys, and /api/ routes work.
const App = () => {
    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-body)',
            background: 'var(--color-cream)',
            color: 'var(--color-navy)',
            gap: 12
        }}>
            <div style={{ fontSize: 52 }}>✈️</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600 }}>
                Euro Planner '26
            </h2>
            <p style={{ color: 'var(--color-text-light)', fontSize: 15 }}>
                Vite migration in progress — screens coming in Phase 2.
            </p>
        </div>
    )
}

export default App
