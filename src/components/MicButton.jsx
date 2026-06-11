import { useEffect } from 'react'
import { useSpeechInput } from '../hooks/useSpeechInput'

// Inject pulse keyframe once on first render
let _stylesInjected = false
function ensurePulseStyles() {
  if (_stylesInjected || typeof document === 'undefined') return
  _stylesInjected = true
  const el = document.createElement('style')
  el.textContent = `
    @keyframes micPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.55; transform: scale(0.9); }
    }
  `
  document.head.appendChild(el)
}

// MicButton — two variants:
//   variant="compact"  (default) — 36×36px round button, sits inside input rows
//   variant="wide"               — full-width "Tap to dictate" bar, sits below textareas
//
// Props:
//   onTranscript(text)  — called with each final speech result; parent appends
//   existingValue       — current field value (context only, not modified here)
//   variant             — 'compact' | 'wide'
export function MicButton({ onTranscript, existingValue, variant = 'compact' }) {
  // Pass onTranscript directly — the hook stores it in a ref internally
  // so new function references on each render are handled correctly
  const { isListening, isSupported, startListening, stopListening } = useSpeechInput({ onTranscript })

  useEffect(() => { ensurePulseStyles() }, [])

  if (!isSupported) return null

  const handleTap = () => {
    if (isListening) stopListening()
    else startListening()
  }

  // ── Wide variant — below textareas (journal, postcard, planning assistant) ──
  if (variant === 'wide') {
    return (
      <button
        type="button"
        onClick={handleTap}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
          width: '100%',
          padding: '10px var(--space-md)',
          background: isListening ? 'rgba(185, 40, 40, 0.07)' : 'var(--color-cream)',
          border: `1.5px solid ${isListening ? 'rgba(185, 40, 40, 0.35)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          color: isListening ? 'rgb(170, 30, 30)' : 'var(--color-text-light)',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          marginTop: 'var(--space-sm)',
          animation: isListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
          transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        }}
      >
        <span style={{ fontSize: '15px', lineHeight: 1 }}>🎤</span>
        {isListening ? 'Listening… tap to stop' : 'Tap to dictate'}
      </button>
    )
  }

  // ── Compact variant — inline with input row (planning assistant) ────────────
  return (
    <button
      type="button"
      onClick={handleTap}
      style={{
        flexShrink: 0,
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-full)',
        border: `1.5px solid ${isListening ? 'rgba(185, 40, 40, 0.4)' : 'var(--color-border)'}`,
        background: isListening ? 'rgba(185, 40, 40, 0.08)' : 'var(--color-cream)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '15px',
        alignSelf: 'flex-end',
        marginBottom: '6px',
        animation: isListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      title={isListening ? 'Tap to stop' : 'Tap to speak'}
    >
      {isListening ? '🔴' : '🎤'}
    </button>
  )
}
