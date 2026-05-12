import React from 'react'
import { Icon } from '../components/Icon'

const HomeButton = ({ onClick, bg, color, border, title, subtitle, animationDelay }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-md) var(--space-lg)',
            background: bg, color, border: border || 'none',
            borderRadius: 'var(--radius-lg)', cursor: 'pointer',
            boxShadow: 'var(--shadow-md)', textAlign: 'left',
            animation: `slideUp 0.5s ease-out ${animationDelay}s both`,
            transition: 'filter 0.15s',
            width: '100%',
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.93)' }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
    >
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{title}</div>
            <div style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '3px', lineHeight: 1.4 }}>{subtitle}</div>
        </div>
        <Icon name="ChevronRight" size={22} color={color} style={{ flexShrink: 0, marginLeft: 'var(--space-md)', opacity: 0.7 }} />
    </button>
)

export const HomeScreen = ({ onExplorer, onFollowAlong, onOpenCityGuides }) => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)', padding: 'var(--space-lg)', paddingTop: 'calc(var(--space-2xl) + env(safe-area-inset-top, 0px))', overflow: 'auto' }}>
        <header style={{ textAlign: 'center', paddingBottom: 'var(--space-lg)', animation: 'slideUp 0.6s ease-out' }}>
            <div style={{ fontSize: '52px', marginBottom: 'var(--space-md)' }}>🌍✈️</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 8vw, 2.5rem)', fontWeight: 600, color: 'var(--color-navy)', letterSpacing: '-0.02em' }}>Euro Planner '26</h1>
            <p style={{ fontSize: '1rem', color: 'var(--color-text-light)', marginTop: 'var(--space-sm)' }}>Summer of Wonder &amp; Awe</p>
        </header>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', maxWidth: '400px', margin: '0 auto', width: '100%', justifyContent: 'center' }}>
            <HomeButton
                onClick={onExplorer}
                bg="var(--color-navy)"
                color="white"
                title="Euro Explorers"
                subtitle="Abby, Tyler, Ryan &amp; Mom — plan your adventures"
                animationDelay={0.2}
            />
            <HomeButton
                onClick={onFollowAlong}
                bg="white"
                color="var(--color-navy)"
                border="2px solid var(--color-border)"
                title="Follow Along"
                subtitle="See where we're headed and what we have planned"
                animationDelay={0.32}
            />
            <HomeButton
                onClick={onOpenCityGuides}
                bg="rgb(211, 108, 80)"
                color="white"
                title="Our Cities"
                subtitle="Explore destinations — summaries, activities &amp; local phrases"
                animationDelay={0.44}
            />
        </div>

        <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--color-text-light)', fontSize: '0.8rem', animation: 'fadeIn 0.8s ease-out 0.6s both' }}>
            ✈️ PDX → Frankfurt · June 13, 2026
        </div>
    </div>
)
