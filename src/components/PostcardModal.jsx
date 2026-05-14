import { useState } from 'react'
import emailjs from '@emailjs/browser'
import { CONFIG, localDate } from '../config'

const getThumbUrl = (url, width = 400) => {
  if (!url) return null
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`)
  }
  return url
}

// ─── PostcardModal ────────────────────────────────────────────────────────────
// Props:
//   user            — current user object
//   userId          — current user ID string
//   allFamilyPhotos — all journalEntries that have a photoUrl (any family member)
//   currentCity     — itinerary city object for today (or null)
//   euroLedger      — ledger state array (for daily cap check)
//   awardEuros      — store.awardEuros(userId, amount, reason)
//   onClose         — close handler

export const PostcardModal = ({ user, userId, allFamilyPhotos, currentCity, euroLedger, awardEuros, onClose }) => {
  const [step, setStep] = useState('pick')  // pick | compose | preview | sending | success
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [message, setMessage] = useState('')
  const [claudeLoading, setClaudeLoading] = useState(false)
  const [euroEarned, setEuroEarned] = useState(0)
  const [sendError, setSendError] = useState(null)
  const [selectedRecipients, setSelectedRecipients] = useState(
    () => (CONFIG.POSTCARD_RECIPIENTS || []).map(r => r.email)
  )

  const photos = (allFamilyPhotos || []).filter(e => e.photoUrl).slice().reverse()
  const cityName = currentCity?.city || 'Europe'
  const allRecipients = CONFIG.POSTCARD_RECIPIENTS || []
  const templateReady = !!(CONFIG.EMAILJS_POSTCARD_TEMPLATE_ID && allRecipients.length > 0)
  const canSend = templateReady && selectedRecipients.length > 0

  const toggleRecipient = (email) => {
    setSelectedRecipients(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    )
  }

  const handleClaudeHelp = async () => {
    setClaudeLoading(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CONFIG.CLAUDE_MODEL,
          max_tokens: 150,
          system: 'You help kids write fun, warm postcard messages to family at home. Write 2-3 sentences — conversational, upbeat, and specific to where they are. No greeting or sign-off, just the message body. Keep it genuine, not cheesy.',
          messages: [{
            role: 'user',
            content: `I'm ${user.name}${user.age ? `, age ${user.age}` : ''}, and I'm in ${cityName} right now on a family trip through Europe. Write me a quick postcard message to send to family back home!`
          }]
        })
      })
      const data = await res.json()
      const text = data.content?.find(b => b.type === 'text')?.text?.trim() || ''
      if (text) setMessage(text)
    } catch {
      // Fail silently — user can still write manually
    }
    setClaudeLoading(false)
  }

  const handleSend = async () => {
    if (!templateReady) return
    setStep('sending')
    setSendError(null)
    try {
      for (const email of selectedRecipients) {
        await emailjs.send(
          CONFIG.EMAILJS_SERVICE_ID,
          CONFIG.EMAILJS_POSTCARD_TEMPLATE_ID,
          {
            from_name: user.name,
            from_city: cityName,
            message: message.trim(),
            photo_url: selectedPhoto?.photoUrl || '',
            to_email: email
          },
          CONFIG.EMAILJS_PUBLIC_KEY
        )
      }
      // Award euros — daily cap check
      let earned = 0
      const isParent = CONFIG.users[userId]?.isParent
      if (!isParent) {
        const today = localDate()
        const todayEarnings = (euroLedger || [])
          .filter(e => e.userId === userId && e.reason === 'postcard' && e.timestamp.startsWith(today))
          .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
        if (todayEarnings < CONFIG.EURO_RATES.postcardDailyCap) {
          await awardEuros(userId, CONFIG.EURO_RATES.postcard, 'postcard')
          earned = CONFIG.EURO_RATES.postcard
        }
      }
      setEuroEarned(earned)
      setStep('success')
    } catch (e) {
      console.error('Postcard send error:', e)
      setSendError('Something went wrong. Check your connection and try again.')
      setStep('preview')
    }
  }

  // ── STEP: Pick photo ────────────────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--color-navy)', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 12px', cursor: 'pointer', color: 'white', fontSize: '1rem', fontWeight: 500 }}>←</button>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>📮 Send a Postcard</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Pick a photo</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-cream)', padding: 'var(--space-md)' }}>
          <button
            onClick={() => { setSelectedPhoto(null); setStep('compose') }}
            style={{ width: '100%', padding: 'var(--space-md)', background: 'white', border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}
          >
            Skip — send without a photo
          </button>
          {photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📷</div>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem' }}>No family photos yet — upload some first!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {photos.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => { setSelectedPhoto(entry); setStep('compose') }}
                  style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: 'var(--radius-sm)', cursor: 'pointer', boxSizing: 'border-box', border: selectedPhoto?.id === entry.id ? '3px solid var(--color-terracotta)' : '3px solid transparent' }}
                >
                  <img src={getThumbUrl(entry.photoUrl, 300)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── STEP: Compose message ───────────────────────────────────────────────────
  if (step === 'compose') {
    const canNext = message.trim().length > 0
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--color-navy)', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
          <button onClick={() => setStep('pick')} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 12px', cursor: 'pointer', color: 'white', fontSize: '1rem', fontWeight: 500 }}>←</button>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>📮 Send a Postcard</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Write your message</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-cream)', padding: 'var(--space-lg)' }}>
          {selectedPhoto && (
            <div style={{ width: '100%', height: '180px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-lg)', boxShadow: 'var(--shadow-md)' }}>
              <img src={getThumbUrl(selectedPhoto.photoUrl, 600)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: 'var(--space-sm)', margin: '0 0 var(--space-sm) 0' }}>
            From {user.name} in {cityName} ✈️
          </p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your message here..."
            rows={5}
            style={{ width: '100%', padding: 'var(--space-md)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box', background: 'white', marginBottom: 'var(--space-sm)' }}
            onFocus={e => e.target.style.borderColor = 'var(--color-navy)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
          />
          <button
            onClick={handleClaudeHelp}
            disabled={claudeLoading}
            style={{ width: '100%', padding: 'var(--space-md)', background: 'white', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: claudeLoading ? 'default' : 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-navy)', opacity: claudeLoading ? 0.6 : 1 }}
          >
            {claudeLoading ? '✨ Getting ideas...' : '✨ Help me write this'}
          </button>
          {message.trim().length > 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 'var(--space-sm)', textAlign: 'center' }}>
              Feel free to edit anything above!
            </p>
          )}
        </div>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', paddingBottom: 'calc(var(--space-md) + env(safe-area-inset-bottom, 0px))', background: 'white', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          <button
            onClick={() => setStep('preview')}
            disabled={!canNext}
            style={{ width: '100%', padding: 'var(--space-md)', background: canNext ? 'var(--color-terracotta)' : 'var(--color-tan)', color: canNext ? 'white' : 'var(--color-text-light)', border: 'none', borderRadius: 'var(--radius-md)', cursor: canNext ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '1rem' }}
          >
            Preview →
          </button>
        </div>
      </div>
    )
  }

  // ── STEP: Preview ───────────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--color-navy)', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
          <button onClick={() => setStep('compose')} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 12px', cursor: 'pointer', color: 'white', fontSize: '1rem', fontWeight: 500 }}>←</button>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>📮 Send a Postcard</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Preview</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-cream)', padding: 'var(--space-lg)' }}>
          {/* Postcard card */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', overflow: 'hidden', marginBottom: 'var(--space-md)' }}>
            {selectedPhoto ? (
              <div style={{ height: '200px', overflow: 'hidden' }}>
                <img src={getThumbUrl(selectedPhoto.photoUrl, 800)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ) : (
              <div style={{ height: '72px', background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-terracotta) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '2rem' }}>📮</span>
              </div>
            )}
            <div style={{ padding: 'var(--space-lg)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-terracotta)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 var(--space-sm) 0' }}>
                POSTCARD FROM {cityName.toUpperCase()}
              </p>
              <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--color-text)', margin: '0 0 var(--space-md) 0', whiteSpace: 'pre-wrap' }}>
                {message}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', fontStyle: 'italic', margin: 0 }}>
                — {user.name} {user.emoji}
              </p>
            </div>
          </div>
          {/* Recipients selector */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-sm)' }}>
            {!templateReady ? (
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
                📭 Recipients not configured yet — set <code>POSTCARD_RECIPIENTS</code> and <code>EMAILJS_POSTCARD_TEMPLATE_ID</code> in config.js.
              </p>
            ) : (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 var(--space-sm) 0' }}>
                  📬 Send to
                </p>
                {allRecipients.map(r => (
                  <label key={r.email} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(r.email)}
                      onChange={() => toggleRecipient(r.email)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-terracotta)', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '0.95rem', color: 'var(--color-text)', fontWeight: selectedRecipients.includes(r.email) ? 600 : 400 }}>
                      {r.name}
                    </span>
                  </label>
                ))}
                {selectedRecipients.length === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-terracotta)', margin: 'var(--space-sm) 0 0 0' }}>
                    Pick at least one recipient to send.
                  </p>
                )}
              </>
            )}
          </div>
          {sendError && (
            <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
              <p style={{ color: '#c53030', fontSize: '0.9rem', margin: 0 }}>{sendError}</p>
            </div>
          )}
        </div>
        <div style={{ padding: 'var(--space-md) var(--space-lg)', paddingBottom: 'calc(var(--space-md) + env(safe-area-inset-bottom, 0px))', background: 'white', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{ width: '100%', padding: 'var(--space-md)', background: canSend ? 'var(--color-terracotta)' : 'var(--color-tan)', color: canSend ? 'white' : 'var(--color-text-light)', border: 'none', borderRadius: 'var(--radius-md)', cursor: canSend ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '1rem' }}
          >
            {!templateReady ? 'Recipients not set up yet' : selectedRecipients.length === 0 ? 'Select a recipient' : `📮 Send Postcard`}
          </button>
        </div>
      </div>
    )
  }

  // ── STEP: Sending ───────────────────────────────────────────────────────────
  if (step === 'sending') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '40px 32px', textAlign: 'center', maxWidth: '280px', width: '85%' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📮</div>
          <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '1rem' }}>Sending your postcard...</div>
          <div style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '8px' }}>Just a moment!</div>
        </div>
      </div>
    )
  }

  // ── STEP: Success ───────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '40px 32px', textAlign: 'center', maxWidth: '300px', width: '85%', animation: 'slideUp 0.3s ease-out', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>📮</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>Postcard sent!</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginBottom: euroEarned > 0 ? '16px' : '24px', lineHeight: 1.5 }}>
            On its way to {selectedRecipients.length} {selectedRecipients.length === 1 ? 'person' : 'people'} back home!
          </div>
          {euroEarned > 0 && (
            <div style={{ background: '#f0faf4', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#2a7a45', letterSpacing: '-1px', lineHeight: 1 }}>
                +€{euroEarned.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#2a7a45', marginTop: '4px' }}>earned!</div>
            </div>
          )}
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>Tap anywhere to close</div>
        </div>
      </div>
    )
  }

  return null
}
