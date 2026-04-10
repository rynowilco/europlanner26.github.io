import React, { useState, useMemo } from 'react'
import { CONFIG } from '../config'
import { Icon } from '../components/Icon'

const ActivityCard = ({ activity, isAdmin, onApprove, onFeedback }) => {
    const statusColors = {
        draft: { bg: 'var(--color-tan)', color: 'var(--color-text-light)' },
        submitted: { bg: '#FFF3E0', color: 'var(--color-warning)' },
        approved: { bg: '#E8F5E9', color: 'var(--color-success)' },
        'needs-revision': { bg: '#FFF3E0', color: 'var(--color-warning)' },
        rejected: { bg: '#FFEBEE', color: 'var(--color-error)' }
    }
    const status = statusColors[activity.status] || statusColors.draft
    const costUSD = (activity.estimatedCost * CONFIG.softParams.eurToUsdRate).toFixed(0)

    return (
        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>{activity.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{activity.kidName} • {activity.city}</div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 500, background: status.bg, color: status.color }}>{activity.status.replace('-', ' ')}</span>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>{activity.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: 'var(--space-md)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="DollarSign" size={14} /> €{activity.estimatedCost} (~${costUSD})</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="Clock" size={14} /> {activity.duration}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="MapPin" size={14} /> {activity.travelTime}</span>
            </div>
            {activity.parentFeedback && <div style={{ background: '#FFF3E0', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}><strong>Feedback:</strong> {activity.parentFeedback}</div>}
            {isAdmin && activity.status === 'submitted' && (
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button onClick={() => onApprove(activity.id)} style={{ flex: 1, padding: 'var(--space-sm) var(--space-md)', background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 500 }}><Icon name="Check" size={16} /> Approve</button>
                    <button onClick={() => onFeedback(activity.id)} style={{ flex: 1, padding: 'var(--space-sm) var(--space-md)', background: 'var(--color-warning)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 500 }}>Feedback</button>
                </div>
            )}
            {activity.conflictNote && (
                <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>⚠️</span>
                    <p style={{ fontSize: '0.8rem', color: '#E65100', margin: 0, lineHeight: 1.4 }}>{activity.conflictNote}</p>
                </div>
            )}
            {activity.isSample && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontStyle: 'italic', marginTop: 'var(--space-sm)', textAlign: 'center' }}>📝 Sample activity</div>}
        </div>
    )
}

const IdeaCard = ({ idea, isOwner, onRefine, onSubmit, onDelete, userProfiles }) => {
    const user = userProfiles[idea.kidId]
    const costUSD = idea.estimatedCost ? (idea.estimatedCost * CONFIG.softParams.eurToUsdRate).toFixed(0) : '?'

    return (
        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', borderLeft: `4px solid ${user?.color || 'var(--color-gold)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>{idea.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                        {user?.emoji} {idea.kidName} • {idea.city}
                    </div>
                </div>
                {idea.estimatedCost > 0 && (
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-sage)' }}>~€{idea.estimatedCost}</span>
                )}
            </div>
            {idea.notes && (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: 'var(--space-md)', lineHeight: 1.4 }}>{idea.notes}</p>
            )}
            {isOwner && (
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button onClick={() => onRefine(idea)} style={{ flex: 1, padding: '8px 12px', background: 'var(--color-cream)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        ✏️ Refine
                    </button>
                    <button onClick={() => onSubmit(idea.id)} style={{ flex: 1, padding: '8px 12px', background: 'var(--color-sage)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Icon name="Send" size={14} /> Submit
                    </button>
                    <button onClick={() => onDelete(idea.id)} style={{ padding: '8px', background: 'none', color: 'var(--color-text-light)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="X" size={14} />
                    </button>
                </div>
            )}
        </div>
    )
}

export const DashboardScreen = ({ onBack, activities, savedIdeas, bookingItems, userProfiles, isAdmin, currentUserId, onApprove, onFeedback, onRefineIdea, onSubmitIdea, onDeleteIdea, onToggleBooked, onDeleteBooking, onAddBooking }) => {
    const [filter, setFilter] = useState('all')
    const [activeTab, setActiveTab] = useState('ideas')

    const filtered = useMemo(() => {
        if (filter === 'abby') return activities.filter(a => a.kidId === 'abby')
        if (filter === 'tyler') return activities.filter(a => a.kidId === 'tyler')
        if (filter === 'pending') return activities.filter(a => a.status === 'submitted')
        return activities
    }, [activities, filter])

    const ideasByUser = savedIdeas.reduce((acc, i) => {
        if (!acc[i.kidId]) acc[i.kidId] = []
        acc[i.kidId].push(i)
        return acc
    }, {})

    const handleResetCache = () => {
        if (confirm('This will clear all cached data and reload from Google Sheets. Continue?')) {
            localStorage.removeItem('euroPlanner_activities')
            localStorage.removeItem('euroPlanner_savedIdeas')
            localStorage.removeItem('euroPlanner_conversations')
            localStorage.removeItem('euroPlanner_sessionSummaries')
            localStorage.removeItem('euroPlanner_lastActivity')
            localStorage.removeItem('euroPlanner_profiles')
            window.location.reload()
        }
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-cream)' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md)', paddingTop: 'calc(var(--space-md) + env(safe-area-inset-top, 0px))', background: 'white', borderBottom: '1px solid var(--color-border)' }}>
                <button onClick={onBack} style={{ background: 'var(--color-cream)', border: '1px solid var(--color-border)', padding: '8px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', minHeight: '40px' }}><Icon name="ArrowLeft" size={20} /></button>
                <h1 style={{ flex: 1, fontSize: '1.25rem', fontWeight: 600 }}>Planning Hub</h1>
                {isAdmin && <span style={{ background: 'var(--color-sage)', color: 'white', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 500 }}>Admin</span>}
            </header>

            {/* Tab switcher */}
            <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid var(--color-border)' }}>
                <button onClick={() => setActiveTab('ideas')} style={{ flex: 1, padding: 'var(--space-md)', background: activeTab === 'ideas' ? 'var(--color-cream)' : 'white', border: 'none', borderBottom: activeTab === 'ideas' ? '3px solid var(--color-gold)' : '3px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: activeTab === 'ideas' ? 600 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    💡 Ideas ({savedIdeas.length})
                </button>
                <button onClick={() => setActiveTab('activities')} style={{ flex: 1, padding: 'var(--space-md)', background: activeTab === 'activities' ? 'var(--color-cream)' : 'white', border: 'none', borderBottom: activeTab === 'activities' ? '3px solid var(--color-sage)' : '3px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: activeTab === 'activities' ? 600 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    ✅ Submitted ({activities.filter(a => !a.isSample).length})
                </button>
                <button onClick={() => setActiveTab('approved')} style={{ flex: 1, padding: 'var(--space-md)', background: activeTab === 'approved' ? 'var(--color-cream)' : 'white', border: 'none', borderBottom: activeTab === 'approved' ? '3px solid var(--color-terracotta)' : '3px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: activeTab === 'approved' ? 600 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    ⭐ Approved ({activities.filter(a => a.status === 'approved' && !a.isSample).length})
                </button>
                {isAdmin && (
                    <button onClick={() => setActiveTab('bookings')} style={{ flex: 1, padding: 'var(--space-md)', background: activeTab === 'bookings' ? 'var(--color-cream)' : 'white', border: 'none', borderBottom: activeTab === 'bookings' ? '3px solid var(--color-terracotta)' : '3px solid transparent', cursor: 'pointer', fontSize: '0.9rem', fontWeight: activeTab === 'bookings' ? 600 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        🎟️ Book ({bookingItems.length})
                    </button>
                )}
            </div>

            {/* Ideas Tab */}
            {activeTab === 'ideas' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
                    {savedIdeas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-light)' }}>
                            <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>💡</div>
                            <p style={{ marginTop: 'var(--space-md)' }}>No saved ideas yet!</p>
                            <p style={{ fontSize: '0.85rem' }}>Chat with the assistant and say "save that idea" to bookmark things for later.</p>
                        </div>
                    ) : (
                        <>
                            {Object.entries(ideasByUser).map(([kidId, ideas]) => {
                                const profile = userProfiles[kidId] || {}
                                const isOwner = currentUserId === kidId || isAdmin
                                return (
                                    <div key={kidId} style={{ marginBottom: 'var(--space-lg)' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '1.25rem' }}>{profile.emoji || '💡'}</span> {profile.name || kidId}'s Ideas ({ideas.length})
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                            {ideas.map(idea => (
                                                <IdeaCard
                                                    key={idea.id}
                                                    idea={idea}
                                                    isOwner={isOwner}
                                                    onRefine={onRefineIdea}
                                                    onSubmit={onSubmitIdea}
                                                    onDelete={onDeleteIdea}
                                                    userProfiles={userProfiles}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    )}
                </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
                <>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', padding: 'var(--space-md)', overflowX: 'auto' }}>
                        {[{ key: 'all', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'abby', label: "Abby's" }, { key: 'tyler', label: "Tyler's" }].map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: 'var(--space-sm) var(--space-md)', background: filter === f.key ? 'var(--color-navy)' : 'white', color: filter === f.key ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{f.label}</button>
                        ))}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {filtered.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-light)' }}>
                                <Icon name="List" size={48} color="var(--color-border)" />
                                <p style={{ marginTop: 'var(--space-md)' }}>No activities yet!</p>
                            </div>
                        ) : filtered.map(a => <ActivityCard key={a.id} activity={a} isAdmin={isAdmin} onApprove={onApprove} onFeedback={onFeedback} />)}
                    </div>
                </>
            )}

            {/* Approved Tab */}
            {activeTab === 'approved' && (
                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {(() => {
                        const approvedAll = activities.filter(a => a.status === 'approved' && !a.isSample)
                        if (approvedAll.length === 0) return (
                            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-light)' }}>
                                <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>⭐</div>
                                <p style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>No approved activities yet</p>
                                <p style={{ fontSize: '0.85rem' }}>Approve submitted activities from the Submitted tab.</p>
                            </div>
                        )
                        const grouped = approvedAll.reduce((acc, a) => {
                            if (!acc[a.kidId]) acc[a.kidId] = []
                            acc[a.kidId].push(a)
                            return acc
                        }, {})
                        return Object.entries(grouped).map(([kidId, kidActivities], idx) => {
                            const profile = userProfiles[kidId] || {}
                            const isKid = !profile.isParent
                            const label = (profile.emoji ? profile.emoji + ' ' : '') + (profile.name || kidId) + (isKid ? ' (' + kidActivities.length + '/3)' : ' (' + kidActivities.length + ')')
                            return (
                                <div key={kidId} style={{ marginTop: idx > 0 ? 'var(--space-md)' : 0 }}>
                                    <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-sm)' }}>
                                        {label}
                                    </h3>
                                    {kidActivities.map(a => <ActivityCard key={a.id} activity={a} isAdmin={isAdmin} onApprove={onApprove} onFeedback={onFeedback} />)}
                                </div>
                            )
                        })
                    })()}
                </div>
            )}

            {/* Booking List Tab — admin only */}
            {activeTab === 'bookings' && isAdmin && (
                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
                    <button onClick={() => onAddBooking()} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', width: '100%', padding: 'var(--space-md)', background: 'white', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-light)', justifyContent: 'center', marginBottom: 'var(--space-md)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-terracotta)'; e.currentTarget.style.color = 'var(--color-terracotta)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-light)' }}>
                        + Add booking item
                    </button>
                    {bookingItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--color-text-light)' }}>
                            <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🎟️</div>
                            <p style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>No bookings yet</p>
                            <p style={{ fontSize: '0.85rem' }}>Chat with Claude about activities that need advance booking — trains, tickets, tours, restaurants — and they'll appear here automatically.</p>
                        </div>
                    ) : (
                        <>
                            {bookingItems.filter(b => b.status !== 'booked').length > 0 && (
                                <div style={{ marginBottom: 'var(--space-lg)' }}>
                                    <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-sm)' }}>
                                        To Book ({bookingItems.filter(b => b.status !== 'booked').length})
                                    </h3>
                                    {bookingItems.filter(b => b.status !== 'booked').map(item => (
                                        <div key={item.id} style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-sm)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)', borderLeft: '4px solid var(--color-terracotta)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '2px' }}>{item.title}</div>
                                                    {item.city && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 'var(--space-xs)' }}>📍 {item.city}</div>}
                                                    {item.notes && <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.4, marginBottom: 'var(--space-xs)' }}>{item.notes}</div>}
                                                    {item.link && (
                                                        <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--color-navy)', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            🔗 Book now
                                                        </a>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
                                                    <button onClick={() => onToggleBooked(item.id)} style={{ padding: '6px 12px', background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>✓ Done</button>
                                                    <button onClick={() => onDeleteBooking(item.id)} style={{ padding: '6px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--color-text-light)' }}>
                                                        <Icon name="X" size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {bookingItems.filter(b => b.status === 'booked').length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--space-sm)' }}>
                                        Booked ✓ ({bookingItems.filter(b => b.status === 'booked').length})
                                    </h3>
                                    {bookingItems.filter(b => b.status === 'booked').map(item => (
                                        <div key={item.id} style={{ background: '#F1F8F1', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-sm)', border: '1px solid #C8E6C9', borderLeft: '4px solid var(--color-success)', opacity: 0.8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', textDecoration: 'line-through', color: 'var(--color-text-light)' }}>{item.title}</div>
                                                    {item.city && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>📍 {item.city} · booked {item.dateBooked}</div>}
                                                </div>
                                                <button onClick={() => onToggleBooked(item.id)} style={{ padding: '4px 10px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                                                    Undo
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {isAdmin && (
                <footer style={{ padding: 'var(--space-md)', paddingBottom: 'calc(var(--space-md) + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--color-border)', background: 'white', textAlign: 'center', flexShrink: 0 }}>
                    <button onClick={handleResetCache} style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', fontSize: '0.85rem', cursor: 'pointer', padding: 'var(--space-sm) var(--space-md)' }}>
                        Reset cached data
                    </button>
                </footer>
            )}
        </div>
    )
}
