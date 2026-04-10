import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import { CONFIG } from '../config'
import { Icon } from '../components/Icon'

export const MapScreen = ({ onBack, activities, userProfiles, itinerary }) => {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const [selectedCity, setSelectedCity] = useState(null)

    const tripItinerary = itinerary || CONFIG.itinerary

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return

        const map = L.map(mapRef.current, {
            center: [46, 10],
            zoom: 5,
            zoomControl: false
        })

        L.control.zoom({ position: 'bottomright' }).addTo(map)

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map)

        const mainCities = tripItinerary.filter(c => !c.isTransfer)
        if (mainCities.length > 1) {
            const bounds = L.latLngBounds(mainCities.map(c => [c.lat, c.lng]))
            map.fitBounds(bounds, { padding: [48, 48] })
        }

        const routeCoords = tripItinerary.map(c => [c.lat, c.lng])
        L.polyline(routeCoords, {
            color: '#E53935',
            weight: 2.5,
            dashArray: '8, 8',
            opacity: 0.65
        }).addTo(map)

        const createIcon = (isTransfer = false) => L.divIcon({
            className: 'custom-marker',
            html: isTransfer
                ? '<div style="background: var(--color-gold); width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; font-size: 13px;">🚂</div>'
                : '<div style="background: var(--color-terracotta); width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.25);"></div>',
            iconSize: isTransfer ? [26, 26] : [30, 30],
            iconAnchor: isTransfer ? [13, 13] : [15, 30],
            popupAnchor: [0, -32]
        })

        tripItinerary.forEach((city) => {
            const isTransfer = city.isTransfer || city.city.toLowerCase().includes('transfer') || city.city.toLowerCase().includes('kids choice')

            const marker = L.marker([city.lat, city.lng], {
                icon: createIcon(isTransfer)
            }).addTo(map)

            marker.on('click', () => {
                setSelectedCity(city)
                map.flyTo([city.lat, city.lng], 12, { duration: 0.4 })
            })

            const formatDate = (dateStr) => {
                if (!dateStr) return ''
                const d = new Date(dateStr + 'T00:00:00')
                return (d.getMonth() + 1) + '/' + d.getDate()
            }
            const dateRange = (city.startDate && city.endDate && !isTransfer)
                ? ' <span style="font-weight:400;opacity:0.7;font-size:9px;margin-left:3px;">' + formatDate(city.startDate) + '–' + formatDate(city.endDate) + '</span>'
                : ''
            const label = L.divIcon({
                className: 'city-label-container',
                html: '<div style="background: ' + (isTransfer ? 'var(--color-gold)' : 'white') + '; color: ' + (isTransfer ? 'white' : 'var(--color-text)') + '; padding: 3px 7px; border-radius: 4px; font-size: ' + (isTransfer ? '10px' : '11px') + '; font-weight: 600; white-space: nowrap; box-shadow: 0 1px 4px rgba(0,0,0,0.18); display: inline-block;">' + city.city + dateRange + '</div>',
                iconAnchor: [-18, 14]
            })
            L.marker([city.lat, city.lng], { icon: label, interactive: false }).addTo(map)
        })

        // Small dots for approved activities
        activities.filter(a => !a.isSample && a.status === 'approved').forEach(activity => {
            const cityInfo = tripItinerary.find(c => c.city === activity.city)
            if (cityInfo) {
                const dot = L.divIcon({
                    className: 'activity-marker',
                    html: '<div style="background: var(--color-success); width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2);"></div>',
                    iconSize: [10, 10],
                    iconAnchor: [5, 5]
                })
                const offset = 0.018
                L.marker([cityInfo.lat + offset, cityInfo.lng + offset], { icon: dot })
                    .bindPopup('<strong>' + activity.title + '</strong><br/>' + activity.kidName)
                    .addTo(map)
            }
        })

        mapInstanceRef.current = map

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [activities])

    const cityMatchesSafe = (activityCity, markerCity) => {
        if (!activityCity || !markerCity) return false
        const a = activityCity.toLowerCase()
        const b = markerCity.toLowerCase()
        return a === b || a.includes(b) || b.includes(a)
    }
    const cityActivities = selectedCity ? activities.filter(a => cityMatchesSafe(a.city, selectedCity.city) && !a.isSample) : []
    const phrases = selectedCity ? CONFIG.phrases[selectedCity.language] || [] : []

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-cream)' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)', paddingTop: 'calc(var(--space-md) + env(safe-area-inset-top, 0px))', background: 'white', borderBottom: '1px solid var(--color-border)', zIndex: 1000 }}>
                <button onClick={onBack} style={{ background: 'var(--color-cream)', border: '1px solid var(--color-border)', padding: '8px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', minHeight: '40px' }}>
                    <Icon name="ArrowLeft" size={20} />
                </button>
                <h1 style={{ flex: 1, fontSize: '1.25rem', fontWeight: 600 }}>Trip Map</h1>
                <Icon name="Globe" size={24} color="var(--color-navy)" />
            </header>

            <div style={{ flex: 1, position: 'relative' }}>
                <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

                {/* City Detail Panel */}
                {selectedCity && (
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'white', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)', maxHeight: '60%',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        animation: 'slideUp 0.3s ease-out', zIndex: 1000
                    }}>
                        <div style={{ padding: 'var(--space-sm)', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: '40px', height: '4px', background: 'var(--color-tan)', borderRadius: '2px' }} />
                        </div>

                        <div style={{ padding: '0 var(--space-md) var(--space-md)', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{selectedCity.city}</h2>
                                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                                        {selectedCity.country} · {selectedCity.startDate} to {selectedCity.endDate}
                                    </p>
                                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '4px' }}>
                                        🚗 {selectedCity.transport}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedCity(null)} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}>
                                    <Icon name="X" size={20} color="var(--color-text-light)" />
                                </button>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
                            {cityActivities.length > 0 && (
                                <div style={{ marginBottom: 'var(--space-lg)' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Planned Activities
                                    </h3>
                                    {cityActivities.map(a => {
                                        const userProfile = userProfiles[a.kidId]
                                        const statusColor = a.status === 'approved' ? '#E8F5E9' : a.status === 'submitted' ? '#FFF3E0' : 'var(--color-cream)'
                                        const statusLabel = a.status === 'approved' ? 'approved' : a.status === 'submitted' ? 'pending' : a.status
                                        const statusTextColor = a.status === 'approved' ? 'var(--color-success)' : a.status === 'submitted' ? 'var(--color-warning)' : 'var(--color-text-light)'
                                        return (
                                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: statusColor, borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-xs)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                <span style={{ fontSize: '1rem' }}>{userProfile?.emoji || '👤'}</span>
                                                <span style={{ fontSize: '0.9rem', flex: 1, fontWeight: 500 }}>{a.title}</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusTextColor, background: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: 'var(--radius-full)' }}>{statusLabel}</span>
                                                {a.estimatedCost > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>€{a.estimatedCost}</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icon name="Globe" size={14} /> {selectedCity.language} Phrases
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {phrases.map((phrase, i) => (
                                        <div key={i} style={{ background: 'var(--color-cream)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-md)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--color-navy)' }}>{phrase.local}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{phrase.english}</span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-terracotta)', fontStyle: 'italic' }}>{phrase.pronunciation}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '4px' }}>💡 {phrase.when}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!selectedCity && (
                    <div style={{ position: 'absolute', bottom: 'var(--space-lg)', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-md)', fontSize: '0.9rem', color: 'var(--color-text-light)', whiteSpace: 'nowrap', zIndex: 1000 }}>
                        👆 Tap a city to see details & phrases
                    </div>
                )}
            </div>
        </div>
    )
}
