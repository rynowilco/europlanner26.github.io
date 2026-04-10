import React from 'react'
import { Icon } from '../components/Icon'

export const HomeScreen = ({ onExplorer, onFollowAlong }) => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)', padding: 'var(--space-lg)', paddingTop: 'calc(var(--space-2xl) + env(safe-area-inset-top, 0px))', overflow: 'auto' }}>
        <header style={{ textAlign: 'center', paddingBottom: 'var(--space-xl)', animation: 'slideUp 0.6s ease-out' }}>
            <div style={{ fontSize: '52px', marginBottom: 'var(--space-md)' }}>🌍✈️</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 8vw, 2.5rem)', fontWeight: 600, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>Euro Planner '26</h1>
            <p style={{ fontSize: '1rem', color: 'var(--color-text-light)', marginTop: 'var(--space-sm)' }}>Summer of Wonder &amp; Awe</p>
        </header>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: '400px', margin: '0 auto', width: '100%', justifyContent: 'center' }}>
            <button
                onClick={onExplorer}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 'var(--space-xl)', background: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', cursor: 'pointer', boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.5s ease-out 0.2s both', textAlign: 'left', transition: 'opacity 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.92' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Euro Explorers</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: 'var(--space-xs)', lineHeight: 1.5 }}>Abby, Tyler, Ryan &amp; Mom — plan your adventures</div>
                <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>
                    Let's go <Icon name="ChevronRight" size={16} color="white" />
                </div>
            </button>

            <button
                onClick={onFollowAlong}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 'var(--space-xl)', background: 'white', color: 'var(--color-text)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', boxShadow: 'var(--shadow-md)', animation: 'slideUp 0.5s ease-out 0.35s both', textAlign: 'left', transition: 'border-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-terracotta)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>Follow Along</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginTop: 'var(--space-xs)', lineHeight: 1.5 }}>See where we're headed and what we have planned</div>
                <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-terracotta)', fontSize: '0.9rem', fontWeight: 600 }}>
                    View trip <Icon name="ChevronRight" size={16} color="var(--color-terracotta)" />
                </div>
            </button>
        </div>

        <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--color-text-light)', fontSize: '0.8rem', animation: 'fadeIn 0.8s ease-out 0.6s both' }}>
            ✈️ PDX → Frankfurt · June 13, 2026
        </div>
    </div>
)
