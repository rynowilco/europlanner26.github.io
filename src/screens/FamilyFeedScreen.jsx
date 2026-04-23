import React, { useState, useRef } from 'react'
import { Icon } from '../components/Icon'

// Derive a thumbnail URL from a Drive direct URL
const getThumbUrl = (url, width = 400) => {
  if (!url) return null
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`)
  }
  const match = url.match(/[?&]id=([^&]+)/)
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w${width}` : url
}

const formatDay = (dateStr) => {
  if (!dateStr) return 'Unknown Date'
  const dt = new Date(dateStr + 'T00:00:00')
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const Lightbox = ({ photos, initialIndex, onClose, comments }) => {
  const [idx, setIdx] = useState(initialIndex)
  const [dir, setDir] = useState(0)
  const touchStartX = useRef(null)
  const entry = photos[idx]
  const entryComments = (comments || []).filter(c => c.entryId === entry.id)

  const prev = (e) => { e.stopPropagation(); setDir(-1); setIdx(i => (i - 1 + photos.length) % photos.length) }
  const next = (e) => { e.stopPropagation(); setDir(1); setIdx(i => (i + 1) % photos.length) }
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) { setDir(1); setIdx(i => (i + 1) % photos.length) }
      else { setDir(-1); setIdx(i => (i - 1 + photos.length) % photos.length) }
    }
    touchStartX.current = null
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Close */}
      <button onClick={onClose} style={{ position: 'absolute', top: 'calc(var(--space-xl) + env(safe-area-inset-top, 0px))', right: '16px', zIndex: 10, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Icon name="X" size={20} color="white" />
      </button>
      {/* Prev */}
      {photos.length > 1 && (
        <button onClick={prev} style={{ position: 'absolute', left: '16px', top: '35%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="ChevronLeft" size={24} color="white" />
        </button>
      )}
      {/* Image area — tap backdrop to close */}
      <div onClick={onClose} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 'calc(48px + env(safe-area-inset-top, 0px))', paddingBottom: 'var(--space-md)', paddingLeft: '60px', paddingRight: '60px' }}>
        <img key={idx} src={getThumbUrl(entry.photoUrl, 1600)} alt={entry.entryText || 'Photo'} onClick={e => e.stopPropagation()}
          style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: 'var(--radius-md)',
            animation: dir === 0 ? 'fadeIn 0.2s ease-out' : dir > 0 ? 'slideInFromRight 0.25s ease-out' : 'slideInFromLeft 0.25s ease-out' }} />
        {entry.entryText && <p onClick={e => e.stopPropagation()} style={{ color: 'white', marginTop: 'var(--space-sm)', fontSize: '0.9rem', lineHeight: 1.5, textAlign: 'center', maxWidth: '400px' }}>{entry.entryText}</p>}
        <div onClick={e => e.stopPropagation()} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginTop: '4px' }}>
          {entry.userName} · {entry.city}{photos.length > 1 ? ` · ${idx + 1} / ${photos.length}` : ''}
        </div>
      </div>
      {/* Next */}
      {photos.length > 1 && (
        <button onClick={next} style={{ position: 'absolute', right: '16px', top: '35%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="ChevronRight" size={24} color="white" />
        </button>
      )}
      {/* Comments — independently scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.15)', padding: 'var(--space-md) var(--space-lg) var(--space-xl)' }}>
        {entryComments.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>No comments yet</div>
        ) : entryComments.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'white', fontWeight: 700 }}>
              {c.commenterName.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '2px' }}>{c.commenterName}</div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{c.commentText}</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInFromRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInFromLeft  { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  )
}

const PhotoGrid = ({ photos, onPhotoTap, comments }) => {
  if (photos.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: 'var(--space-sm)' }}>
      {photos.map(entry => {
        const photoCommentCount = (comments || []).filter(c => c.entryId === entry.id).length
        return (
          <div
            key={entry.id}
            onClick={() => onPhotoTap(entry)}
            style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'var(--color-tan)' }}>
            <img
              src={getThumbUrl(entry.photoUrl, 400)}
              alt={entry.entryText || 'Photo'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.55))', padding: '20px 6px 6px' }}>
              <div style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600, opacity: 0.9 }}>{entry.userName}</div>
            </div>
            {photoCommentCount > 0 && (
              <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.65)', borderRadius: 'var(--radius-full)', padding: '2px 6px', color: 'white', fontSize: '0.65rem', fontWeight: 700 }}>
                💬 {photoCommentCount}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const CommentDisplay = ({ entryId, comments }) => {
  const entryComments = (comments || []).filter(c => c.entryId === entryId)
  if (entryComments.length === 0) return (
    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', fontSize: '0.8rem', color: 'var(--color-text-light)', fontStyle: 'italic' }}>
      No comments yet
    </div>
  )
  return (
    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)' }}>
      {entryComments.map(c => (
        <div key={c.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
          <div style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'white', fontWeight: 700 }}>
            {c.commenterName.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div style={{ flex: 1, background: 'var(--color-cream)', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '2px' }}>{c.commenterName}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.4 }}>{c.commentText}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

const JournalCard = ({ entry, onHeartEntry, heartedIds, commentCount, comments, isExpanded, onToggle }) => {
  const isHearted = heartedIds.includes(entry.id)
  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-sm)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-navy)' }}>{entry.userName}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', background: 'var(--color-cream)', padding: '2px 7px', borderRadius: 'var(--radius-full)' }}>📍 {entry.city}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {entry.mood && <span style={{ fontSize: '18px', lineHeight: 1 }}>{entry.mood}</span>}
          <button onClick={onToggle}
            style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#2E7D32', border: '1px solid #2E7D32', borderRadius: 'var(--radius-full)', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', color: 'white', fontWeight: 600, opacity: isExpanded ? 1 : 0.85 }}>
            💬{commentCount > 0 ? ` ${commentCount}` : ''}
          </button>
          <button
            onClick={() => onHeartEntry && onHeartEntry(entry.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: isHearted ? '#FFF0F0' : 'var(--color-cream)', border: isHearted ? '1px solid #FFCCCC' : '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', color: isHearted ? 'var(--color-error)' : 'var(--color-text-light)', fontWeight: 600, transition: 'all 0.15s' }}>
            {isHearted ? '❤️' : '🤍'}{entry.heartCount > 0 ? ` ${entry.heartCount}` : ''}
          </button>
        </div>
      </div>
      <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--color-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{entry.entryText}</p>
      {isExpanded && <CommentDisplay entryId={entry.id} comments={comments} />}
    </div>
  )
}

export const FamilyFeedScreen = ({ onBack, journalEntries, onHeartEntry, comments }) => {
  const [lightbox, setLightbox] = useState(null) // { photos, index }
  const [expandedComments, setExpandedComments] = useState(() => {
    const ids = (comments || []).map(c => c.entryId)
    return new Set(ids)
  })
  const toggleComments = (id) => setExpandedComments(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const heartedIds = JSON.parse(localStorage.getItem('euroPlanner_heartedEntries') || '[]')

  const allEntries = (journalEntries || []).filter(e => e.userId && (e.entryText || e.photoUrl))
  const allPhotos = allEntries.filter(e => e.entryType === 'photo' || e.photoUrl)

  // Group by date, newest first
  const grouped = allEntries.reduce((acc, e) => {
    const key = e.date || (e.timestamp ? e.timestamp.split('T')[0] : 'Unknown')
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-cream)' }}>
      <div style={{ background: 'var(--color-navy)', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
          <Icon name="ArrowLeft" size={20} color="white" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>📸 Family Feed</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{allEntries.length} {allEntries.length === 1 ? 'moment' : 'moments'} from the trip</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
        {allEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ fontSize: '52px', marginBottom: 'var(--space-md)' }}>📸</div>
            <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>No memories yet</p>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Photos and journal entries from the trip will appear here.
            </p>
          </div>
        ) : (
          sortedDates.map(dateKey => {
            const dayEntries = [...grouped[dateKey]].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            const photos = dayEntries.filter(e => e.entryType === 'photo' || e.photoUrl)
            const journals = dayEntries.filter(e => e.entryType !== 'photo' && !e.photoUrl && e.entryText)
            return (
              <div key={dateKey} style={{ marginBottom: 'var(--space-xl)', animation: 'slideUp 0.4s ease-out' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-sm)', paddingBottom: 'var(--space-xs)', borderBottom: '1px solid var(--color-border)' }}>
                  📅 {formatDay(dateKey)}
                </div>
                <PhotoGrid photos={photos} onPhotoTap={(entry) => setLightbox({ photos: allPhotos, index: allPhotos.findIndex(p => p.id === entry.id) })} comments={comments} />
                {journals.map(entry => (
                  <JournalCard key={entry.id} entry={entry} onHeartEntry={onHeartEntry} heartedIds={heartedIds}
                    commentCount={(comments || []).filter(c => c.entryId === entry.id).length}
                    comments={comments} isExpanded={expandedComments.has(entry.id)} onToggle={() => toggleComments(entry.id)} />
                ))}
              </div>
            )
          })
        )}
      </div>

      {lightbox && <Lightbox photos={lightbox.photos} initialIndex={lightbox.index} onClose={() => setLightbox(null)} comments={comments} />}
    </div>
  )
}
