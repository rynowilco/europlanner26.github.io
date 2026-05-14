import React, { useState, useRef, useEffect } from 'react'
import { CONFIG } from '../config'
import { Icon } from '../components/Icon'

// ─── Helpers ────────────────────────────────────────────────────────────────

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const getNearestCity = (lat, lng, itinerary, date) => {
  const cities = itinerary.filter(c => !c.isTransfer && c.lat && c.lng)
  let nearest = null, minDist = Infinity
  for (const city of cities) {
    const d = getDistanceKm(lat, lng, city.lat, city.lng)
    if (d < minDist) { minDist = d; nearest = city }
  }
  if (minDist < 120) return nearest?.city

  // Smart En Route: find the leg the photo date falls between
  if (date) {
    const allCities = itinerary.filter(c => !c.isTransfer)
    const before = allCities.filter(c => c.endDate < date).sort((a, b) => b.endDate.localeCompare(a.endDate))
    const after  = allCities.filter(c => c.startDate > date).sort((a, b) => a.startDate.localeCompare(b.startDate))
    const from = before[0]?.city
    const to   = after[0]?.city
    if (from && to)   return `En Route · ${from} → ${to}`
    if (from)         return `En Route · from ${from}`
    if (to)           return `En Route · to ${to}`
  }
  return 'En Route'
}

const compressImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    const MAX = 1920
    let { width, height } = img
    if (width > MAX || height > MAX) {
      if (width >= height) { height = Math.round(height * MAX / width); width = MAX }
      else { width = Math.round(width * MAX / height); height = MAX }
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    URL.revokeObjectURL(url)
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/jpeg', 0.85)
  }
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
  img.src = url
})

const uploadToCloudinary = async (blob, filename) => {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result.split(',')[1])
    reader.onerror = () => reject(new Error('FileReader failed'))
    reader.readAsDataURL(blob)
  })
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData: base64, filename })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Upload failed')
  }
  return res.json()
}

const readExifGps = async (file) => {
  try {
    const exifr = (await import('exifr')).default
    return await exifr.gps(file)
  } catch {
    return null
  }
}

// Cloudinary URLs support on-the-fly transforms via /upload/ path segment
const getThumbUrl = (url, width = 400) => {
  if (!url) return null
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto,f_auto/`)
  }
  return url
}

// ─── PhotoUploadModal ────────────────────────────────────────────────────────

const PhotoUploadModal = ({ user, itinerary, onUploadComplete, onCancel }) => {
  const [step, setStep] = useState('select')
  const [photos, setPhotos] = useState([])
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, errors: [] })
  const fileInputRef = useRef(null)

  const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
  const today = new Date().toISOString().split('T')[0]
  const currentCity = tripItinerary.find(c => c.startDate <= today && today <= c.endDate)
  const cityOptions = ['En Route', ...new Set(tripItinerary.filter(c => !c.isTransfer).map(c => c.city))]

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10)
    if (files.length === 0) return
    const initialPhotos = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
      city: currentCity?.city || '',
      lat: null,
      lng: null
    }))
    setPhotos(initialPhotos)
    setStep('review')
    files.forEach(async (file, i) => {
      const gps = await readExifGps(file)
      if (gps?.latitude && gps?.longitude) {
        const detectedCity = getNearestCity(gps.latitude, gps.longitude, tripItinerary, today)
        setPhotos(prev => prev.map((p, idx) => idx === i
          ? { ...p, city: detectedCity || p.city, lat: gps.latitude, lng: gps.longitude }
          : p
        ))
      }
    })
  }

  const updatePhoto = (i, field, value) => {
    setPhotos(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  const removePhoto = (i) => {
    URL.revokeObjectURL(photos[i].previewUrl)
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
    if (photos.length === 1) setStep('select')
  }

  const handleUpload = async () => {
    setStep('uploading')
    const errors = []
    setUploadProgress({ current: 0, total: photos.length, errors: [] })
    for (let i = 0; i < photos.length; i++) {
      setUploadProgress(prev => ({ ...prev, current: i + 1 }))
      const photo = photos[i]
      try {
        const blob = await compressImage(photo.file)
        const filename = `EP26_${user.id || user.name}_${Date.now()}_${i}.jpg`
        const { url } = await uploadToCloudinary(blob, filename)
        await onUploadComplete(photo.city, photo.caption.trim(), photo.lat, photo.lng, url)
      } catch (err) {
        console.error('Photo upload error:', err)
        errors.push(i + 1)
      }
    }
    photos.forEach(p => URL.revokeObjectURL(p.previewUrl))
    if (errors.length > 0) {
      alert(`${photos.length - errors.length} photo${photos.length - errors.length !== 1 ? 's' : ''} uploaded. ${errors.length} failed — try again later.`)
    }
    onCancel()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }}>
        <div style={{ padding: 'var(--space-lg) var(--space-xl) var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-navy)' }}>
            {step === 'select' ? '📸 Add Photos' : step === 'review' ? `📸 Review ${photos.length} Photo${photos.length !== 1 ? 's' : ''}` : '⬆️ Uploading...'}
          </h2>
          {step !== 'uploading' && (
            <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <Icon name="X" size={20} color="var(--color-text-light)" />
            </button>
          )}
        </div>

        {step === 'select' && (
          <div style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: 'var(--space-2xl)', background: 'var(--color-cream)', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', transition: 'border-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-terracotta)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
              <div style={{ fontSize: '48px' }}>🖼️</div>
              <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '1rem' }}>Choose from Camera Roll</div>
              <div style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>Up to 10 photos at a time</div>
            </button>
            <button onClick={onCancel} style={{ padding: 'var(--space-md)', background: 'none', border: 'none', color: 'var(--color-text-light)', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        )}

        {step === 'review' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
              {photos.map((photo, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', background: 'var(--color-cream)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={photo.previewUrl} alt={`Photo ${i + 1}`} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }} />
                    <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-error)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Icon name="X" size={12} color="white" />
                    </button>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select value={photo.city} onChange={e => updatePhoto(i, 'city', e.target.value)} style={{ flex: 1, padding: '6px 8px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'var(--font-body)', background: 'white', outline: 'none' }}>
                        <option value="">Select city...</option>
                        {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {photo.lat && (
                        <span style={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-sage)', background: 'rgba(100,160,100,0.12)', borderRadius: 'var(--radius-sm)', padding: '3px 6px', whiteSpace: 'nowrap' }}>📍 Detected</span>
                      )}
                    </div>
                    <textarea value={photo.caption} onChange={e => updatePhoto(i, 'caption', e.target.value)} placeholder="Add a caption... (optional)" rows={2} style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', lineHeight: 1.5, boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--color-navy)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
                  </div>
                </div>
              ))}
              {photos.length < 10 && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: 'var(--space-md)', background: 'none', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                    + Add more photos ({photos.length}/10)
                  </button>
                </>
              )}
            </div>
            <div style={{ padding: 'var(--space-md) var(--space-xl)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-sm)', flexShrink: 0 }}>
              <button onClick={onCancel} style={{ flex: 1, padding: 'var(--space-md)', background: 'var(--color-cream)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={handleUpload} disabled={photos.some(p => !p.city)} style={{ flex: 2, padding: 'var(--space-md)', background: photos.some(p => !p.city) ? 'var(--color-tan)' : 'var(--color-terracotta)', color: photos.some(p => !p.city) ? 'var(--color-text-light)' : 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: photos.some(p => !p.city) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem' }}>
                Upload {photos.length} Photo{photos.length !== 1 ? 's' : ''} 📸
              </button>
            </div>
          </>
        )}

        {step === 'uploading' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2xl)', gap: 'var(--space-lg)' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-tan)', borderTopColor: 'var(--color-terracotta)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '1.1rem' }}>Uploading photo {uploadProgress.current} of {uploadProgress.total}</div>
              <div style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '4px' }}>Don't close the app</div>
            </div>
            <div style={{ width: '100%', maxWidth: '280px', background: 'var(--color-tan)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
              <div style={{ background: 'var(--color-terracotta)', height: '100%', width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── JournalComposeModal ─────────────────────────────────────────────────────

const JournalComposeModal = ({ user, itinerary, onSubmit, onCancel, checkInPrompt }) => {
  const [entryText, setEntryText] = useState('')
  const [mood, setMood] = useState('')
  const [showWordWarning, setShowWordWarning] = useState(false)
  const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
  const today = new Date().toISOString().split('T')[0]
  const currentCity = tripItinerary.find(c => c.startDate <= today && today <= c.endDate)
  const cityOptions = [...new Set(tripItinerary.filter(c => !c.isTransfer).map(c => c.city))]
  const [city, setCity] = useState(currentCity ? currentCity.city : '')
  const moods = ['😊', '🤩', '😄', '😴', '😤', '😐']
  const wordCount = entryText.trim().split(/\s+/).filter(Boolean).length
  const isParent = user?.isParent || false
  const MIN_WORDS = 75
  // Always submittable when there's text + city — word count only gates earning, not saving
  const canSubmit = entryText.trim().length > 0 && city

  const handleSubmitTap = () => {
    if (!canSubmit) return
    // For kids: if under 75 words, show a gentle warning first
    if (!isParent && wordCount < MIN_WORDS && !showWordWarning) {
      setShowWordWarning(true)
      return
    }
    setShowWordWarning(false)
    onSubmit(entryText.trim(), mood, city)
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', padding: 'var(--space-xl)', width: '100%', maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-navy)' }}>{checkInPrompt ? '✍️ Daily Check-In' : '📖 New Memory'}</h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <Icon name="X" size={20} color="var(--color-text-light)" />
          </button>
        </div>
        {/* Check-in prompt card */}
        {checkInPrompt && (
          <div style={{ background: 'linear-gradient(135deg, #fff5f0, #fde8dc)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-lg)', borderLeft: '3px solid #c8603a' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c8603a', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>📖 Today's Prompt</div>
            <div style={{ fontSize: '0.95rem', color: 'var(--color-text)', fontStyle: 'italic', lineHeight: 1.5 }}>{checkInPrompt}</div>
          </div>
        )}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '6px' }}>Where are you?</label>
          <select value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: 'var(--space-md)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontFamily: 'var(--font-body)', background: 'white', outline: 'none', boxSizing: 'border-box' }}>
            <option value="">Select a city...</option>
            {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '6px' }}>How are you feeling?</label>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            {moods.map(m => (
              <button key={m} onClick={() => setMood(mood === m ? '' : m)} style={{ fontSize: '28px', background: mood === m ? 'var(--color-cream)' : 'transparent', border: mood === m ? '2px solid var(--color-terracotta)' : '2px solid transparent', borderRadius: 'var(--radius-sm)', padding: '4px 6px', cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1 }}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '6px' }}>What happened today?</label>
          <textarea value={entryText} onChange={e => setEntryText(e.target.value)} placeholder="Write about your day, a moment that stood out, something that surprised you..." rows={6} autoFocus style={{ width: '100%', padding: 'var(--space-md)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--color-navy)'} onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
          {!isParent && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
              <div style={{ height: '4px', width: '80px', background: 'var(--color-tan)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (wordCount / MIN_WORDS) * 100)}%`, background: wordCount >= MIN_WORDS ? 'var(--color-sage)' : 'var(--color-terracotta)', borderRadius: 'var(--radius-full)', transition: 'width 0.2s ease' }} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: wordCount >= MIN_WORDS ? 'var(--color-sage)' : 'var(--color-text-light)' }}>
                {wordCount} / {MIN_WORDS} words {wordCount >= MIN_WORDS ? '✓' : ''}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 'var(--space-md)', background: 'var(--color-cream)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSubmitTap} disabled={!canSubmit} style={{ flex: 2, padding: 'var(--space-md)', background: canSubmit ? 'var(--color-terracotta)' : 'var(--color-tan)', color: canSubmit ? 'white' : 'var(--color-text-light)', border: 'none', borderRadius: 'var(--radius-md)', cursor: canSubmit ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '1rem' }}>
            Save Memory ✨
          </button>
        </div>
        {/* Word count warning — shown when kid submits under 75 words */}
        {showWordWarning && !isParent && (
          <div style={{ marginTop: 'var(--space-md)', background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', animation: 'slideUp 0.2s ease-out' }}>
            <div style={{ fontWeight: 600, color: '#E65100', fontSize: '0.9rem', marginBottom: '4px' }}>
              ✍️ {wordCount} words — {MIN_WORDS - wordCount} more to earn €{(1).toFixed(2)}!
            </div>
            <div style={{ fontSize: '0.85rem', color: '#bf4500', marginBottom: 'var(--space-md)', lineHeight: 1.4 }}>
              Write a bit more and earn a Euro. Or save now and skip the reward.
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button onClick={() => setShowWordWarning(false)} style={{ flex: 2, padding: '10px', background: 'var(--color-terracotta)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                ✍️ Keep Writing
              </button>
              <button onClick={() => { setShowWordWarning(false); onSubmit(entryText.trim(), mood, city) }} style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid #E65100', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: '#E65100', fontWeight: 500, fontSize: '0.85rem' }}>
                Save Anyway
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MemoriesScreen ──────────────────────────────────────────────────────────

const Lightbox = ({ photos, initialIndex, onClose }) => {
  const [idx, setIdx] = useState(initialIndex)
  const [dir, setDir] = useState(0) // -1 = going back, 1 = going forward
  const touchStartX = useRef(null)
  const entry = photos[idx]

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
    <div onClick={onClose} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out', overflow: 'hidden' }}>
      <style>{`
        @keyframes slideInFromRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInFromLeft  { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
      {/* Close */}
      <button onClick={onClose} style={{ position: 'absolute', top: 'calc(var(--space-xl) + env(safe-area-inset-top, 0px))', right: '16px', zIndex: 10, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <Icon name="X" size={20} color="white" />
      </button>
      {/* Prev */}
      {photos.length > 1 && (
        <button onClick={prev} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 20, background: 'rgba(0,0,0,0.55)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="ChevronLeft" size={26} color="white" />
        </button>
      )}
      {/* Image */}
      <img key={idx} src={getThumbUrl(entry.photoUrl, 1600)} alt={entry.entryText || 'Photo'} onClick={e => e.stopPropagation()}
        style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', position: 'relative', zIndex: 5,
          animation: dir === 0 ? 'fadeIn 0.2s ease-out' : dir > 0 ? 'slideInFromRight 0.25s ease-out' : 'slideInFromLeft 0.25s ease-out'
        }} />
      {/* Next */}
      {photos.length > 1 && (
        <button onClick={next} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 20, background: 'rgba(0,0,0,0.55)', border: '1.5px solid rgba(255,255,255,0.35)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="ChevronRight" size={26} color="white" />
        </button>
      )}
      {/* Caption + meta */}
      {entry.entryText && <p style={{ color: 'white', marginTop: 'var(--space-md)', fontSize: '0.95rem', lineHeight: 1.6, textAlign: 'center', maxWidth: '500px', padding: '0 60px' }}>{entry.entryText}</p>}
      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginTop: 'var(--space-sm)' }}>
        📍 {entry.city}{photos.length > 1 ? ` · ${idx + 1} / ${photos.length}` : ''}
      </div>
    </div>
  )
}

export const MemoriesScreen = ({ userId, user, itinerary, journalEntries, onAddEntry, onAddPhotoEntry, onBack, initialPrompt, onOpenSlideshow }) => {
  const [showCompose, setShowCompose] = useState(!!initialPrompt)
  const [checkInPrompt] = useState(initialPrompt || null)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [lightbox, setLightbox] = useState(null) // { photos, index }
  const [pendingEuroReward, setPendingEuroReward] = useState(0)
  const photoEarnedRef = useRef(0) // accumulates euros during a photo upload batch

  // Auto-dismiss the euro splash after 3 seconds
  useEffect(() => {
    if (pendingEuroReward > 0) {
      const t = setTimeout(() => setPendingEuroReward(0), 3000)
      return () => clearTimeout(t)
    }
  }, [pendingEuroReward])

  const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
  const today = new Date().toISOString().split('T')[0]
  const currentCity = tripItinerary.find(c => c.startDate <= today && today <= c.endDate)

  const myEntries = journalEntries.filter(e => e.userId === userId && (e.entryText || e.photoUrl))
  const allPhotos = myEntries.filter(e => e.entryType === 'photo' || e.photoUrl)
  const allFamilyPhotos = journalEntries.filter(e => e.photoUrl)
  const slideshowReady = allFamilyPhotos.length >= 15

  const grouped = myEntries.reduce((acc, e) => {
    const key = e.date || (e.timestamp ? e.timestamp.split('T')[0] : 'Unknown')
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const formatDay = (dateStr) => {
    if (!dateStr) return 'Unknown Date'
    const dt = new Date(dateStr + 'T00:00:00')
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-cream)' }}>
      <div style={{ background: 'var(--color-navy)', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
          <Icon name="ArrowLeft" size={20} color="white" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>{user.emoji} {user.name}'s Memories</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{myEntries.length} {myEntries.length === 1 ? 'moment' : 'moments'}</div>
        </div>
      </div>

      {/* Action sub-bar — stacked */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-sm) var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button onClick={() => setShowPhotoUpload(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: 'var(--space-sm)', background: 'var(--color-cream)', color: 'var(--color-navy)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            📸 Add Photos
          </button>
          <button onClick={() => setShowCompose(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: 'var(--space-sm)', background: 'var(--color-terracotta)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            ✍️ Write Entry
          </button>
        </div>
        <button
          onClick={slideshowReady ? onOpenSlideshow : undefined}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: 'var(--space-sm)', background: slideshowReady ? 'linear-gradient(135deg, #1a1a2e 0%, #2e3b6e 100%)' : 'var(--color-cream)', color: slideshowReady ? 'white' : 'var(--color-text-light)', border: slideshowReady ? 'none' : '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: slideshowReady ? 'pointer' : 'default', fontWeight: 600, fontSize: '0.9rem' }}
        >
          {slideshowReady ? '▶ Play Slideshow' : `▶ Slideshow — ${allFamilyPhotos.length}/15 photos`}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
        {myEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-lg)', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ fontSize: '52px', marginBottom: 'var(--space-md)' }}>📖</div>
            <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>No memories yet</p>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
              {currentCity ? `You're in ${currentCity.city} — write your first entry!` : 'Start writing when the adventure begins!'}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
              <button onClick={() => setShowPhotoUpload(true)} style={{ padding: 'var(--space-md) var(--space-lg)', background: 'white', color: 'var(--color-navy)', border: '2px solid var(--color-navy)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>
                📸 Add Photos
              </button>
              <button onClick={() => setShowCompose(true)} style={{ padding: 'var(--space-md) var(--space-lg)', background: 'var(--color-terracotta)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }}>
                ✍️ Write Entry
              </button>
            </div>
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
                {photos.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: 'var(--space-sm)' }}>
                    {photos.map(entry => (
                      <div key={entry.id} onClick={() => setLightbox({ photos: allPhotos, index: allPhotos.findIndex(p => p.id === entry.id) })} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'var(--color-tan)' }}>
                        <img src={getThumbUrl(entry.photoUrl, 400)} alt={entry.entryText || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {entry.entryText && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '16px 6px 6px' }}>
                            <div style={{ color: 'white', fontSize: '0.7rem', lineHeight: 1.3 }}>{entry.entryText}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {journals.map(entry => (
                  <div key={entry.id} style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-sm)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                        {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {entry.mood && <span style={{ fontSize: '20px', lineHeight: 1 }}>{entry.mood}</span>}
                        {entry.heartCount > 0 && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-terracotta)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                            ❤️ {entry.heartCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--color-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{entry.entryText}</p>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>

      {showCompose && (
        <JournalComposeModal
          user={user}
          itinerary={tripItinerary}
          checkInPrompt={checkInPrompt}
          onSubmit={async (entryText, mood, city) => {
            const result = await onAddEntry(userId, user.name, city, entryText, mood, null, null)
            setShowCompose(false)
            if (result?.euroEarned > 0) setPendingEuroReward(result.euroEarned)
          }}
          onCancel={() => setShowCompose(false)}
        />
      )}
      {showPhotoUpload && (
        <PhotoUploadModal
          user={user}
          itinerary={tripItinerary}
          onUploadComplete={async (city, caption, lat, lng, photoUrl) => {
            const result = await onAddPhotoEntry(userId, user.name, city, caption, lat, lng, photoUrl)
            photoEarnedRef.current += result?.euroEarned || 0
          }}
          onCancel={() => {
            setShowPhotoUpload(false)
            if (photoEarnedRef.current > 0) {
              setPendingEuroReward(parseFloat(photoEarnedRef.current.toFixed(2)))
              photoEarnedRef.current = 0
            }
          }}
        />
      )}
      {lightbox && <Lightbox photos={lightbox.photos} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />}

      {/* Euro earned splash — auto-dismisses after 3s, tap to dismiss early */}
      {pendingEuroReward > 0 && (
        <div onClick={() => setPendingEuroReward(0)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.25s ease-out' }}>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '40px 32px', textAlign: 'center', maxWidth: '280px', width: '85%', animation: 'slideUp 0.3s ease-out', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>💶</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '8px' }}>Nice work!</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#2a7a45', letterSpacing: '-1px', lineHeight: 1, marginBottom: '8px' }}>+€{pendingEuroReward.toFixed(2)}</div>
            <div style={{ fontSize: '0.95rem', color: 'var(--color-text-light)', marginBottom: '24px' }}>added to your balance</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>Tap anywhere to continue</div>
          </div>
        </div>
      )}
    </div>
  )
}
