import React, { useState } from 'react'
import { Icon } from '../components/Icon'

// ─── Booking Data ─────────────────────────────────────────────────────────────

const BOOKINGS = [
    {
        id: 'milan',
        type: 'hotel',
        name: 'Residenza delle Città',
        emoji: '🏨',
        city: 'Milan',
        dates: 'June 19–20',
        address: 'Via Mauro Macchi 79, Milan, MI, 20124 Italy',
        phone: null,
        email: null,
        confirmation: '73385684149443',
        confirmationLabel: 'Expedia Itinerary',
        notes: 'Booked via Expedia',
        mapQuery: 'Via Mauro Macchi 79, Milan, Italy',
    },
    {
        id: 'lucca',
        type: 'hotel',
        name: 'Hotel Ilaria',
        emoji: '🏨',
        city: 'Lucca',
        dates: 'June 23–24',
        address: 'Via Del Fosso 26, Lucca, Italy 55100',
        phone: '+390583476150',
        phoneDisplay: '+39 05-83 47615',
        email: null,
        confirmation: '9090802432164',
        confirmationLabel: 'Hotel Confirmation',
        notes: 'Booked via Amex',
        website: 'https://www.hotelilaria.com/',
        mapQuery: 'Via Del Fosso 26, Lucca, Italy',
    },
    {
        id: 'verona',
        type: 'hotel',
        name: 'Relais La Torre – Domus Verona',
        emoji: '🏨',
        city: 'Verona',
        dates: 'June 27–28',
        address: 'Via Quattro Spade 9, Verona Historical Centre, Verona 37121, Italy',
        phone: '+393518489390',
        phoneDisplay: '+39 351 848 9390',
        email: null,
        confirmation: '6693609001',
        confirmationLabel: 'Booking.com Confirmation',
        pin: '0182',
        notes: 'Booked via Booking.com',
        mapQuery: 'Via Quattro Spade 9, Verona, Italy',
    },
    {
        id: 'rivadelgarda',
        type: 'hotel',
        name: 'Hotel Luise',
        emoji: '🏨',
        city: 'Riva del Garda',
        dates: 'June 28 – July 1',
        address: 'Viale Rovereto 9, 38066 Riva del Garda TN, Italy',
        phone: '+390464550858',
        phoneDisplay: '+39 0464 550858',
        email: null,
        confirmation: null,
        notes: 'Breakfast included',
        website: 'https://www.hotelluise.com/en',
        mapQuery: 'Viale Rovereto 9, Riva del Garda, Italy',
    },
    {
        id: 'dolomiti',
        type: 'hotel',
        name: 'ADLER Spa Resort Dolomiti',
        emoji: '🏔️',
        city: 'Ortisei / South Tyrol',
        dates: 'July 1–4',
        address: '39046 Ortisei/St. Ulrich, South Tyrol, Italy',
        phone: '+390471775000',
        phoneDisplay: '+39 0471 775 000',
        email: 'info@adler-dolomiti.com',
        confirmation: 'R966765/2025',
        confirmationLabel: 'Confirmation No.',
        notes: '3 nights · 2 adults, 2 children · Breakfast included · Family Superior room',
        mapQuery: 'ADLER Spa Resort Dolomiti, Ortisei, Italy',
    },
    {
        id: 'ampass',
        type: 'hotel',
        name: 'Gasthof Badl',
        emoji: '🏡',
        city: 'Ampass bei Hall (Innsbruck area)',
        dates: 'July 4–5',
        address: 'Haller Innbrücke 4, 6070 Ampass bei Hall, Austria',
        phone: '+43052235678400',
        phoneDisplay: '+43/(0)5223/56784',
        email: null,
        confirmation: 'PDWDZQ',
        confirmationLabel: 'Reservation Number',
        notes: 'Bed & Breakfast',
        website: 'https://www.badl.at',
        mapQuery: 'Gasthof Badl, Ampass bei Hall, Austria',
    },
    {
        id: 'rentalcar',
        type: 'car',
        name: 'Europcar Rental',
        emoji: '🚗',
        city: 'La Spezia → Bolzano',
        dates: 'June 23 – July 4',
        address: null,
        phone: null,
        email: null,
        confirmation: '1200310194',
        confirmationLabel: 'Rental Confirmation',
        priceline: '293-165-963-95',
        notes: null,
        pickup: {
            label: 'Pick-up',
            when: 'Tue June 23, 12:00 PM',
            where: 'Europcar – Viale San Bartolomeo 457, La Spezia, Italy 19126',
            mapQuery: 'Europcar La Spezia, Viale San Bartolomeo 457',
        },
        dropoff: {
            label: 'Drop-off',
            when: 'Sat July 4, 12:00 PM',
            where: 'Europcar – Bolzano Dolomiti Airport (BZO), Via Aeroporto Francesco Baracca 1, Bolzano, Italy 39100',
            mapQuery: 'Bolzano Dolomiti Airport BZO, Italy',
        },
    },
]

// ─── BookingCard ──────────────────────────────────────────────────────────────

const InfoRow = ({ icon, children }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: 'var(--color-text)' }}>
        <span style={{ flexShrink: 0, marginTop: '1px', opacity: 0.55 }}>{icon}</span>
        <span style={{ lineHeight: 1.45 }}>{children}</span>
    </div>
)

const Chip = ({ label, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-cream)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--color-text-light)', marginBottom: '2px' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-navy)', wordBreak: 'break-all' }}>{value}</span>
    </div>
)

const ActionBtn = ({ href, icon, label, color }) => (
    <a href={href} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 8px', background: color || 'var(--color-navy)', color: 'white', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}>
        {icon} {label}
    </a>
)

const BookingCard = ({ booking }) => {
    const [expanded, setExpanded] = useState(false)
    const isCar = booking.type === 'car'

    const accentColor = isCar ? '#2a6496' : 'var(--color-navy)'
    const badgeColor  = isCar ? '#e8f0f8' : 'var(--color-cream)'
    const badgeText   = isCar ? '#2a6496' : 'var(--color-terracotta)'

    return (
        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            {/* Header — always visible */}
            <button
                onClick={() => setExpanded(e => !e)}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-md) var(--space-lg)' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: badgeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                        {booking.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{booking.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                            📍 {booking.city} · {booking.dates}
                        </div>
                    </div>
                    <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={18} color="var(--color-text-light)" />
                </div>
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-md) var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

                    {/* Confirmation chips */}
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                        {booking.confirmation && (
                            <Chip label={booking.confirmationLabel || 'Confirmation'} value={booking.confirmation} />
                        )}
                        {booking.pin && <Chip label="PIN" value={booking.pin} />}
                        {booking.priceline && <Chip label="Priceline Trip #" value={booking.priceline} />}
                    </div>

                    {/* Car: pickup/dropoff */}
                    {isCar && booking.pickup && (
                        <>
                            <div style={{ background: '#f0f7f0', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#2d7a3a', marginBottom: '6px' }}>🟢 {booking.pickup.label}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '3px' }}>{booking.pickup.when}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.4 }}>{booking.pickup.where}</div>
                                <a href={`https://maps.apple.com/?q=${encodeURIComponent(booking.pickup.mapQuery)}`} style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.78rem', color: '#2a6496', fontWeight: 600, textDecoration: 'none' }}>📍 Open in Maps</a>
                            </div>
                            <div style={{ background: '#fdf0f0', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#a0312d', marginBottom: '6px' }}>🔴 {booking.dropoff.label}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '3px' }}>{booking.dropoff.when}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.4 }}>{booking.dropoff.where}</div>
                                <a href={`https://maps.apple.com/?q=${encodeURIComponent(booking.dropoff.mapQuery)}`} style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.78rem', color: '#2a6496', fontWeight: 600, textDecoration: 'none' }}>📍 Open in Maps</a>
                            </div>
                        </>
                    )}

                    {/* Hotel: address */}
                    {!isCar && booking.address && (
                        <InfoRow icon="📍">
                            <a href={`https://maps.apple.com/?q=${encodeURIComponent(booking.mapQuery || booking.address)}`} style={{ color: 'var(--color-navy)', textDecoration: 'none', fontWeight: 500 }}>
                                {booking.address}
                            </a>
                        </InfoRow>
                    )}

                    {booking.notes && (
                        <InfoRow icon="ℹ️">{booking.notes}</InfoRow>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                        {booking.phone && (
                            <ActionBtn
                                href={`tel:${booking.phone}`}
                                icon="📞"
                                label={booking.phoneDisplay || booking.phone}
                                color="var(--color-terracotta)"
                            />
                        )}
                        {booking.email && (
                            <ActionBtn
                                href={`mailto:${booking.email}`}
                                icon="✉️"
                                label={booking.email}
                                color="#2d7a3a"
                            />
                        )}
                        {booking.website && (
                            <ActionBtn
                                href={booking.website}
                                icon="🌐"
                                label="Website"
                                color="var(--color-navy)"
                            />
                        )}
                        {!isCar && booking.mapQuery && !booking.phone && !booking.email && !booking.website && (
                            <ActionBtn
                                href={`https://maps.apple.com/?q=${encodeURIComponent(booking.mapQuery)}`}
                                icon="📍"
                                label="Open in Maps"
                                color="var(--color-navy)"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── BookingsScreen ───────────────────────────────────────────────────────────

export const BookingsScreen = ({ onBack }) => {
    const hotels = BOOKINGS.filter(b => b.type === 'hotel')
    const cars   = BOOKINGS.filter(b => b.type === 'car')

    return (
        <div style={{ height: '100%', overflowY: 'auto', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>

            {/* Header */}
            <div style={{ background: 'var(--color-navy)', padding: 'var(--space-md) var(--space-lg) var(--space-xl)', paddingTop: 'calc(var(--space-lg) + env(safe-area-inset-top, 0px))' }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                    <Icon name="ChevronLeft" size={16} color="white" /> Back
                </button>
                <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🗝️</div>
                <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>Bookings</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', margin: '4px 0 0' }}>Hotels, car rental &amp; confirmations</p>
            </div>

            <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>

                {/* Accommodations */}
                <section>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-light)', marginBottom: 'var(--space-md)' }}>
                        🏨 Accommodations
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {hotels.map(b => <BookingCard key={b.id} booking={b} />)}
                    </div>
                </section>

                {/* Car Rental */}
                <section>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-light)', marginBottom: 'var(--space-md)' }}>
                        🚗 Rental Car
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {cars.map(b => <BookingCard key={b.id} booking={b} />)}
                    </div>
                </section>

                <div style={{ height: 'var(--space-xl)' }} />
            </div>
        </div>
    )
}
