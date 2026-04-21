import React, { useState, useRef } from 'react'
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

const getNearestCity = (lat, lng, itinerary) => {
  const cities = itinerary.filter(c => !c.isTransfer && c.lat && c.lng)
  let nearest = null, minDist = Infinity
  for (const city of cities) {
    const d = getDistanceKm(lat, lng, city.lat, city.lng)
    if (d < minDist) { minDist = d; nearest = city }
  }
  return minDist < 120 ? nearest?.city : 'En Route'
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

const uploadToDrive = async (blob, filename) => {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result.split(',')[1])
    reader.onerror = () => reject(new Error('FileReader failed'))
    reader.readAsDataURL(blob)
  })
  const res = await fetch('/api/drive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData: base64, mimeType: 'image/jpeg', filename })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Drive upload failed')
  }
  return res.json()
}

const readExifGps = async (file) => {
  try {
    // Dynamically import exifr to avoid SSR issues
    const exifr = (await import('exifr')).default
    return await exifr.gps(file)
  } catch {
    return null
  }
}

const getThumbUrl = (url, size = 'w800') => {
  if (!url) return null
  const match = url.match(/[?&]id=([^&]+)/)
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=${size}` : url
}

// ─── PhotoUploadModal ────────────────────────────────────────────────────────

const PhotoUploadModal = ({ user, itinerary, onUploadComplete, onCancel }) => {
  const [step, setStep] = useState('select') // 'select' | 'review' | 'uploading'
  const [photos, setPhotos] = useState([]) // { file, previewUrl, caption, city, lat, lng, status }
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, errors: [] })
  const fileInputRef = useRef(null)

  const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
  const today = new Date().toISOString().split('T')[0]
  const currentCity = tripItinerary.find(c => c.startDate <= today && today <= c.endDate)
  const cityOptions = ['En Route', ...new Set(tripItinerary.filter(c => !c.isTransfer).map(c => c.city))]

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10)
    if (files.length === 0) return

    // Build initial photo state while EXIF reads happen in parallel
    const initialPhotos = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
      city: currentCity?.city || '',
      lat: null,
      lng: null,
      status: 'pending'
    }))
    setPhotos(initialPhotos)
    setStep('review')

    // Read EXIF GPS in the background and update city auto-detection
    files.forEach(async (file, i) => {
      const gps = await readExifGps(file)
      if (gps?.latitude && gps?.longitude) {
        const detectedCity = getNearestCity(gps.latitude, gps.longitude, tripItinerary)
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
        const { url } = await uploadToDrive(blob, filename)
        await onUploadComplete(photo.city, photo.caption.trim(), photo.lat, photo.lng, url)
      } catch (err) {
        console.error('Photo upload error:', err)
        errors.push(i + 1)
      }
    }

    // Cleanup preview URLs
    photos.forEach(p => URL.revokeObjectURL(p.previewUrl))

    if (errors.length > 0) {
      setUploadProgress(prev => ({ ...prev, errors }))
      alert(`${photos.length - errors.length} photo${photos.length - errors.length !== 1 ? 's' : ''} uploaded. ${errors.length} failed — try again later.`)
    }
    onCancel() // close modal regardless
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }}>

        {/* Header */}
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

        {/* Body */}
        {step === 'select' && (
          <div style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', padding: 'var(--space-2xl)', background: 'var(--color-cream)', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-terracotta)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
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
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={photo.previewUrl} alt={`Photo ${i + 1}`} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', display: 'block' }} />
                    <button
                      onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-error)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Icon name="X" size={12} color="white" />
                    </button>
                  </div>
                  {/* Fields */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <select
                      value={photo.city}
                      onChange={e => updatePhoto(i, 'city', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'var(--font-body)', background: 'white', outline: 'none' }}>
                      <option value="">Select city...</option>
                      {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <textarea
                      value={photo.caption}
                      onChange={e => updatePhoto(i, 'caption', e.target.value)}
                      placeholder="Add a caption... (optional)"
                      rows={2}
                      style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', lineHeight: 1.5, boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = 'var(--color-navy)'}
                      onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                    />
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
              <button
                onClick={handleUpload}
                disabled={photos.some(p => !p.city)}
                style={{ flex: 2, padding: 'var(--space-md)', background: photos.some(p => !p.city) ? 'var(--color-tan)' : 'var(--color-terracotta)', color: photos.some(p => !p.city) ? 'var(--color-text-light)' : 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: photos.some(p => !p.city) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem' }}>
                Upload {photos.length} Photo{photos.length !== 1 ? 's' : ''} 📸
              </button>
            </div>
          </>
        )}

        {step === 'uploading' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2xl)', gap: 'var(--space-lg)' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-tan)', borderTopColor: 'var(--color-terracotta)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '1.1rem' }}>
                Uploading photo {uploadProgress.current} of {uploadProgress.total}
              </div>
              <div style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '4px' }}>Don't close the app</div>
            </div>
            {/* Progress bar */}
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

const JournalComposeModal = ({ user, itinerary, onSubmit, onCancel }) => {
  const [entryText, setEntryText] = useState('')
  const [mood, setMood] = useState('')
  const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
  const today = new Date().toISOString().split('T')[0]
  const currentCity = tripItinerary.find(c => c.startDate <= today && today <= c.endDate)
  const cityOptions = [...new Set(tripItinerary.filter(c => !c.isTransfer).map(c => c.city))]
  const [city, setCity] = useState(currentCity ? currentCity.city : '')
  const moods = ['😊', '🤩', '😄', '😴', '😤', '😐']
  const canSubmit = entryText.trim().length > 0 && city
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', padding: 'var(--space-xl)', width: '100%', maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-navy)' }}>📖 New Memory</h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <Icon name="X" size={20} color="var(--color-text-light)" />
          </button>
        </div>
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
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'right', marginTop: '4px' }}>{entryText.length} chars</div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 'var(--space-md)', background: 'var(--color-cream)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={() => canSubmit && onSubmit(entryText.trim(), mood, city)} disabled={!canSubmit} style={{ flex: 2, padding: 'var(--space-md)', background: canSubmit ? 'var(--color-terracotta)' : 'var(--color-tan)', color: canSubmit ? 'white' : 'var(--color-text-light)', border: 'none', borderRadius: 'var(--radius-md)', cursor: canSubmit ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '1rem' }}>
            Save Memory ✨
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MemoriesScreen ──────────────────────────────────────────────────────────

const getThumbUrl = (url, size = 'w400') => {
  if (!url) return null
  const match = url.match(/[?&]id=([^&]+)/)
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=${size}` : url
}

const Lightbox = ({ entry, onClose }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)', animation: 'fadeIn 0.2s ease-out' }}>
    <button onClick={onClose} style={{ position: 'absolute', top: 'calc(var(--space-xl) + env(safe-area-inset-top, 0px))', right: 'var(--space-lg)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <Icon name="X" size={20} color="white" />
    </button>
    <img src={getThumbUrl(entry.photoUrl, 'w1600')} alt={entry.entryText || 'Photo'} onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
    {entry.entryText && <p style={{ color: 'white', marginTop: 'var(--space-md)', fontSize: '0.95rem', lineHeight: 1.6, textAlign: 'center', maxWidth: '500px' }}>{entry.entryText}</p>}
    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginTop: 'var(--space-sm)' }}>📍 {entry.city}</div>
  </div>
)

export const MemoriesScreen = ({ userId, user, itinerary, journalEntries, onAddEntry, onAddPhotoEntry, onBack }) => {
  const [showCompose, setShowCompose] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [lightboxEntry, setLightboxEntry] = useState(null)

  const tripItinerary = (itinerary && itinerary.length > 0) ? itinerary : CONFIG.itinerary
  const today = new Date().toISOString().split('T')[0]
  const currentCity = tripItinerary.find(c => c.startDate <= today && today <= c.endDate)

  const myEntries = journalEntries.filter(e => e.userId === userId && (e.entryText || e.photoUrl))

  // Group by date, newest first
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
      {/* Header */}
      <div style={{ background: 'var(--color-navy)', padding: 'var(--space-md) var(--space-lg)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
          <Icon name="ArrowLeft" size={20} color="white" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>{user.emoji} {user.name}'s Memories</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{myEntries.length} {myEntries.length === 1 ? 'moment' : 'moments'}</div>
        </div>
        <button onClick={() => setShowPhotoUpload(true)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
          📸
        </button>
        <button onClick={() => setShowCompose(true)} style={{ background: 'var(--color-terracotta)', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 16px', color: 'white', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
          + Write
        </button>
      </div>

      {/* Content */}
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

                {/* Photo grid */}
                {photos.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', marginBottom: 'var(--space-sm)' }}>
                    {photos.map(entry => (
                      <div key={entry.id} onClick={() => setLightboxEntry(entry)} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'var(--color-tan)' }}>
                        <img src={getThumbUrl(entry.photoUrl)} alt={entry.entryText || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {entry.entryText && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '16px 6px 6px' }}>
                            <div style={{ color: 'white', fontSize: '0.7rem', lineHeight: 1.3 }}>{entry.entryText}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Journal entries */}
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

      {/* Modals */}
      {showCompose && (
        <JournalComposeModal
          user={user}
          itinerary={tripItinerary}
          onSubmit={async (entryText, mood, city) => {
            await onAddEntry(userId, user.name, city, entryText, mood, null, null)
            setShowCompose(false)
          }}
          onCancel={() => setShowCompose(false)}
        />
      )}
      {showPhotoUpload && (
        <PhotoUploadModal
          user={user}
          itinerary={tripItinerary}
          onUploadComplete={async (city, caption, lat, lng, photoUrl) => {
            await onAddPhotoEntry(userId, user.name, city, caption, lat, lng, photoUrl)
          }}
          onCancel={() => setShowPhotoUpload(false)}
        />
      )}
      {lightboxEntry && <Lightbox entry={lightboxEntry} onClose={() => setLightboxEntry(null)} />}
    </div>
  )
}
