import React, { useState, useRef } from 'react'

// ─── PullToRefresh ───────────────────────────────────────────────────────────
// Wraps a scrollable container and adds a native-feeling pull-to-refresh
// gesture. Only triggers when the wrapped content is scrolled to the very top.
//
// Props:
//   onRefresh   — async function to call when the user pulls down and releases
//   isRefreshing — optional external refreshing state (e.g. from useStore)
//   children    — the scrollable content (should NOT itself set overflowY;
//                 this component provides the scroll container)
//   threshold   — px of pull required to trigger refresh (default 70)

const PULL_MAX = 120

export const PullToRefresh = ({ onRefresh, isRefreshing: externalRefreshing, children, threshold = 70 }) => {
    const [pullDistance, setPullDistance] = useState(0)
    const [internalRefreshing, setInternalRefreshing] = useState(false)
    const startY = useRef(null)
    const scrollRef = useRef(null)
    const dragging = useRef(false)

    const isRefreshing = externalRefreshing !== undefined ? externalRefreshing : internalRefreshing

    const handleTouchStart = (e) => {
        if (isRefreshing) return
        const el = scrollRef.current
        if (!el || el.scrollTop > 0) return
        startY.current = e.touches[0].clientY
        dragging.current = true
    }

    const handleTouchMove = (e) => {
        if (!dragging.current || startY.current === null || isRefreshing) return
        const el = scrollRef.current
        if (!el || el.scrollTop > 0) { dragging.current = false; setPullDistance(0); return }
        const dy = e.touches[0].clientY - startY.current
        if (dy <= 0) { setPullDistance(0); return }
        // Resistance curve — pulling feels progressively harder
        const resisted = Math.min(PULL_MAX, dy * 0.5)
        setPullDistance(resisted)
    }

    const handleTouchEnd = async () => {
        if (!dragging.current) return
        dragging.current = false
        startY.current = null
        if (pullDistance >= threshold && !isRefreshing) {
            if (externalRefreshing === undefined) setInternalRefreshing(true)
            try { await onRefresh() }
            finally {
                setPullDistance(0)
                if (externalRefreshing === undefined) setInternalRefreshing(false)
            }
        } else {
            setPullDistance(0)
        }
    }

    const indicatorHeight = isRefreshing ? 56 : pullDistance
    const indicatorOpacity = isRefreshing ? 1 : Math.min(1, pullDistance / threshold)
    const indicatorRotation = isRefreshing ? 0 : Math.min(180, (pullDistance / threshold) * 180)

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ height: `${indicatorHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: dragging.current ? 'none' : 'height 0.2s ease-out', overflow: 'hidden' }}>
                <div style={{ opacity: indicatorOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    {isRefreshing ? (
                        <div style={{ width: '22px', height: '22px', border: '2.5px solid var(--color-border)', borderTopColor: 'var(--color-terracotta)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    ) : (
                        <div style={{ fontSize: '1.1rem', transform: `rotate(${indicatorRotation}deg)`, transition: 'transform 0.1s linear' }}>↓</div>
                    )}
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-light)', fontWeight: 600 }}>
                        {isRefreshing ? 'Refreshing…' : pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
                    </span>
                </div>
            </div>
            <div
                ref={scrollRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
            >
                {children}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
