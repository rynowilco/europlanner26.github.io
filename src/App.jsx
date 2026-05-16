import React, { useState, useEffect } from 'react'
import { useStore } from './useStore'
import { SheetsStatusBanner } from './components/SheetsStatusBanner'
import { FingerprintModal } from './components/FingerprintModal'
import { FeedbackModal } from './components/FeedbackModal'
import { AddBookingModal } from './components/AddBookingModal'
import { BottomNav } from './components/BottomNav'
import { CityGuidesModal } from './screens/CityGuidesModal'
import { QuickToolsModal } from './screens/PersonalHomeScreen'
import { HomeScreen } from './screens/HomeScreen'
import { FamilyLandingScreen } from './screens/FamilyLandingScreen'
import { PersonalHomeScreen } from './screens/PersonalHomeScreen'
import { ChatScreen } from './screens/ChatScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { MapScreen } from './screens/MapScreen'
import { TrackerScreen } from './screens/TrackerScreen'
import { MemoriesScreen } from './screens/MemoriesScreen'
import { FamilyFeedScreen } from './screens/FamilyFeedScreen'
import { PollsScreen } from './screens/PollsScreen'
import { ScavengerHuntScreen } from './screens/ScavengerHuntScreen'
import { DailyStoriesScreen } from './screens/DailyStoriesScreen'
import { SlideshowScreen } from './screens/SlideshowScreen'

// ── Tools hub — module-level component for the Tools tab ─────────────────────

const toolCardStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '28px 16px', background: 'white', border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'center',
    boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s', width: '100%',
}

const ToolsHub = ({ onOpenMap, onOpenPolls, onOpenHunt, onOpenCityGuides, onOpenQuickTools, newPollAvailable }) => (
    <div style={{ height: '100%', overflowY: 'auto', padding: 'var(--space-lg)', paddingTop: 'calc(var(--space-xl) + env(safe-area-inset-top, 0px))', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-navy)', marginBottom: 'var(--space-lg)' }}>🧰 Tools</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <button onClick={onOpenMap} style={toolCardStyle}>
                <div style={{ fontSize: '34px', marginBottom: '8px' }}>🗺️</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>Trip Map</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '3px' }}>Cities &amp; activities</div>
            </button>
            <button onClick={onOpenPolls} style={{ ...toolCardStyle, position: 'relative' }}>
                {newPollAvailable && <div style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', background: 'var(--color-terracotta)', borderRadius: '50%' }} />}
                <div style={{ fontSize: '34px', marginBottom: '8px' }}>🗳️</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>Polls</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '3px' }}>Family decisions</div>
            </button>
            <button onClick={onOpenHunt} style={toolCardStyle}>
                <div style={{ fontSize: '34px', marginBottom: '8px' }}>🔍</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>Scavenger Hunt</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '3px' }}>Find &amp; explore</div>
            </button>
            <button onClick={onOpenCityGuides} style={toolCardStyle}>
                <div style={{ fontSize: '34px', marginBottom: '8px' }}>🏛️</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>Our Cities</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '3px' }}>Guides &amp; phrases</div>
            </button>
            <button onClick={onOpenQuickTools} style={{ ...toolCardStyle, gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '34px', marginBottom: '8px' }}>🧰</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-navy)' }}>Quick Tools</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginTop: '3px' }}>Currency converter · Local phrases</div>
            </button>
        </div>
    </div>
)

const fabItemStyle = {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '11px 20px', background: 'var(--color-navy)',
    color: 'white', border: 'none', borderRadius: 'var(--radius-full)',
    cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)', whiteSpace: 'nowrap',
}

// ── App ───────────────────────────────────────────────────────────────────────

const App = () => {
    // screen: 'loading' | 'home' | 'familyLanding' | 'explorer' | 'tracker'
    const [screen, setScreen] = useState('loading')
    const [currentUser, setCurrentUser] = useState(null)

    // Explorer sub-routing
    const [activeTab, setActiveTab]   = useState('home')       // 'home' | 'memories' | 'feed' | 'plan' | 'tools'
    const [planView, setPlanView]     = useState('chat')       // 'chat' | 'dashboard'
    const [feedView, setFeedView]     = useState('feed')       // 'feed' | 'slideshow' | 'dailyStories'
    const [toolsView, setToolsView]   = useState('hub')        // 'hub' | 'map' | 'polls' | 'hunt'

    // FAB
    const [fabOpen, setFabOpen]               = useState(false)
    const [fabPendingAction, setFabPendingAction] = useState(null) // 'journal' | 'photo' | null

    // Modals / admin
    const [isAdmin, setIsAdmin]                   = useState(false)
    const [showFingerprintModal, setShowFingerprintModal] = useState(false)
    const [feedbackActivity, setFeedbackActivity] = useState(null)
    const [showAddBooking, setShowAddBooking]     = useState(false)
    const [showCityGuides, setShowCityGuides]     = useState(false)
    const [showQuickTools, setShowQuickTools]     = useState(false)
    const [bannerDismissed, setBannerDismissed]   = useState(false)

    const store = useStore()

    // ── Badges ────────────────────────────────────────────────────────────────
    const newStoryAvailable = (() => {
        if (!store.journalDigest?.length) return false
        const latest = [...store.journalDigest].sort((a, b) => b.date.localeCompare(a.date))[0]?.date
        const lastSeen = localStorage.getItem('euroPlanner_lastSeenStory')
        return !lastSeen || latest > lastSeen
    })()

    const newPollAvailable = (() => {
        if (!store.polls?.length) return false
        const latest = [...store.polls].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt
        const lastSeen = localStorage.getItem('euroPlanner_lastSeenPoll')
        return !lastSeen || latest > lastSeen
    })()

    // ── Persisted user — restore on mount ─────────────────────────────────────
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('ep26_currentUser')
            if (savedUser) {
                setCurrentUser(savedUser)
                setScreen('explorer')
            } else {
                setScreen('home')
            }
        } catch {
            setScreen('home')
        }
    }, [])

    // ── Navigation ────────────────────────────────────────────────────────────
    const handleSelectUser = (userId) => {
        setCurrentUser(userId)
        try { localStorage.setItem('ep26_currentUser', userId) } catch {}
        setActiveTab('home')
        setPlanView('chat')
        setFeedView('feed')
        setToolsView('hub')
        setFabOpen(false)
        setScreen('explorer')
    }

    const handleSwitchUser = () => {
        setCurrentUser(null)
        try { localStorage.removeItem('ep26_currentUser') } catch {}
        setScreen('familyLanding')
    }

    const handleTabChange = (tab) => {
        if (tab !== activeTab) {
            setPlanView('chat')
            setFeedView('feed')
            setToolsView('hub')
        }
        setActiveTab(tab)
        setFabOpen(false)
    }

    const handleOpenDailyStories = () => { setFeedView('dailyStories'); setActiveTab('feed') }
    const handleOpenSlideshow    = () => { setFeedView('slideshow');    setActiveTab('feed') }

    const handleFingerprintSuccess = () => {
        setShowFingerprintModal(false)
        setIsAdmin(true)
        if (!currentUser) {
            const parentId = Object.entries(store.userProfiles || {}).find(([, u]) => u.isParent)?.[0] || 'ryan'
            setCurrentUser(parentId)
            try { localStorage.setItem('ep26_currentUser', parentId) } catch {}
        }
        setScreen('explorer')
        setActiveTab('plan')
        setPlanView('dashboard')
    }

    // ── Activity / booking handlers ───────────────────────────────────────────
    const handleApprove        = (id) => store.approveActivity(id)
    const handleFeedback       = (id) => setFeedbackActivity(store.activities.find(a => a.id === id))
    const handleSubmitFeedback = async (feedback) => {
        if (feedbackActivity) await store.updateActivity(feedbackActivity.id, { status: 'needs-revision', parentFeedback: feedback })
        setFeedbackActivity(null)
    }
    const handleToggleBooked       = (id) => store.toggleBookingStatus(id)
    const handleDeleteBooking      = (id) => { if (confirm('Remove this booking item?')) store.deleteBookingItem(id) }
    const handleAddBooking         = () => setShowAddBooking(true)
    const handleSubmitManualBooking = async (item) => { await store.addBookingItem(item); setShowAddBooking(false) }

    const handleRefineIdea = (idea) => {
        store.setRefiningIdea(idea)
        const userId = idea.kidId || currentUser
        if (userId !== currentUser) {
            setCurrentUser(userId)
            try { localStorage.setItem('ep26_currentUser', userId) } catch {}
        }
        setActiveTab('plan')
        setPlanView('chat')
    }
    const handleSubmitIdea = async (ideaId) => {
        const activity = await store.convertIdeaToActivity(ideaId)
        if (activity) alert(`"${activity.title}" has been submitted for parent review!`)
    }
    const handleDeleteIdea = (ideaId) => {
        if (confirm('Delete this saved idea?')) store.deleteSavedIdea(ideaId)
    }
    const handleAddPhotoEntry = async (userId, userName, city, caption, lat, lng, photoUrl) =>
        store.addJournalEntry(userId, userName, city, caption, '', lat, lng, 'photo', photoUrl)

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ height: '100%' }}>
            <SheetsStatusBanner
                error={!bannerDismissed && store.sheetsError ? store.sheetsError : null}
                onDismiss={() => setBannerDismissed(true)}
            />

            {/* Loading — blank while localStorage is checked */}
            {screen === 'loading' && <div style={{ height: '100%', background: 'var(--color-warm-white)' }} />}

            {/* Home gate */}
            {screen === 'home' && (
                <HomeScreen
                    onExplorer={() => setScreen('familyLanding')}
                    onFollowAlong={() => setScreen('tracker')}
                    onOpenCityGuides={() => setShowCityGuides(true)}
                />
            )}

            {/* Family Landing */}
            {screen === 'familyLanding' && (
                <FamilyLandingScreen
                    userProfiles={store.userProfiles}
                    activities={store.activities}
                    onSelectUser={handleSelectUser}
                    onOpenAdmin={() => setShowFingerprintModal(true)}
                    onBack={() => setScreen('home')}
                    euroLedger={store.euroLedger}
                />
            )}

            {/* Explorer — bottom nav shell */}
            {screen === 'explorer' && currentUser && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

                    {/* Tab content area */}
                    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>

                        {/* ── Home tab ─────────────────────────────────────── */}
                        {activeTab === 'home' && (
                            <PersonalHomeScreen
                                userId={currentUser}
                                user={store.userProfiles[currentUser] || {}}
                                activities={store.activities}
                                euroLedger={store.euroLedger}
                                newStoryAvailable={newStoryAvailable}
                                onOpenDailyStories={handleOpenDailyStories}
                                onOpenJournal={() => { setFabPendingAction('journal'); setActiveTab('memories') }}
                                onSwitchUser={handleSwitchUser}
                                itinerary={store.itinerary}
                            />
                        )}

                        {/* ── Memories tab ─────────────────────────────────── */}
                        {activeTab === 'memories' && (
                            <MemoriesScreen
                                userId={currentUser}
                                user={store.userProfiles[currentUser] || {}}
                                itinerary={store.itinerary}
                                journalEntries={store.journalEntries}
                                onAddEntry={store.addJournalEntry}
                                onAddPhotoEntry={handleAddPhotoEntry}
                                onBack={() => {}}
                                showBack={false}
                                onOpenSlideshow={handleOpenSlideshow}
                                euroLedger={store.euroLedger}
                                awardEuros={store.awardEuros}
                                fabAction={fabPendingAction}
                                onFabActionHandled={() => setFabPendingAction(null)}
                            />
                        )}

                        {/* ── Feed tab ─────────────────────────────────────── */}
                        {activeTab === 'feed' && feedView === 'feed' && (
                            <FamilyFeedScreen
                                onBack={() => setActiveTab('home')}
                                journalEntries={store.journalEntries}
                                onHeartEntry={store.heartJournalEntry}
                                comments={store.comments}
                            />
                        )}
                        {activeTab === 'feed' && feedView === 'slideshow' && (
                            <SlideshowScreen
                                onBack={() => setFeedView('feed')}
                                journalEntries={store.journalEntries}
                                userProfiles={store.userProfiles}
                            />
                        )}
                        {activeTab === 'feed' && feedView === 'dailyStories' && (
                            <DailyStoriesScreen
                                onBack={() => setFeedView('feed')}
                                journalDigest={store.journalDigest}
                                journalEntries={store.journalEntries}
                                itinerary={store.itinerary}
                                currentUser={currentUser}
                                userProfiles={store.userProfiles}
                                onSaveStory={store.saveJournalStory}
                                canGenerate={true}
                            />
                        )}

                        {/* ── Plan tab ─────────────────────────────────────── */}
                        {activeTab === 'plan' && planView === 'chat' && (
                            <ChatScreen
                                userId={currentUser}
                                user={store.userProfiles[currentUser]}
                                onBack={() => setActiveTab('home')}
                                onOpenDashboard={() => setPlanView('dashboard')}
                                onOpenMap={() => { setToolsView('map'); setActiveTab('tools') }}
                                store={store}
                            />
                        )}
                        {activeTab === 'plan' && planView === 'dashboard' && (
                            <DashboardScreen
                                onBack={() => setPlanView('chat')}
                                activities={store.activities}
                                savedIdeas={store.savedIdeas}
                                bookingItems={store.bookingItems}
                                userProfiles={store.userProfiles}
                                isAdmin={isAdmin}
                                currentUserId={currentUser}
                                onApprove={handleApprove}
                                onFeedback={handleFeedback}
                                onRefineIdea={handleRefineIdea}
                                onSubmitIdea={handleSubmitIdea}
                                onDeleteIdea={handleDeleteIdea}
                                onToggleBooked={handleToggleBooked}
                                onDeleteBooking={handleDeleteBooking}
                                onAddBooking={handleAddBooking}
                                euroLedger={store.euroLedger}
                                awardEuros={store.awardEuros}
                                processWithdrawal={store.processWithdrawal}
                            />
                        )}

                        {/* ── Tools tab ────────────────────────────────────── */}
                        {activeTab === 'tools' && toolsView === 'hub' && (
                            <ToolsHub
                                onOpenMap={() => setToolsView('map')}
                                onOpenPolls={() => setToolsView('polls')}
                                onOpenHunt={() => setToolsView('hunt')}
                                onOpenCityGuides={() => setShowCityGuides(true)}
                                onOpenQuickTools={() => setShowQuickTools(true)}
                                newPollAvailable={newPollAvailable}
                            />
                        )}
                        {activeTab === 'tools' && toolsView === 'map' && (
                            <MapScreen
                                onBack={() => setToolsView('hub')}
                                activities={store.activities}
                                userProfiles={store.userProfiles}
                                itinerary={store.itinerary}
                            />
                        )}
                        {activeTab === 'tools' && toolsView === 'polls' && (
                            <PollsScreen
                                onBack={() => setToolsView('hub')}
                                polls={store.polls}
                                currentUser={currentUser}
                                userProfiles={store.userProfiles}
                                itinerary={store.itinerary}
                                onCreatePoll={store.createPoll}
                                onCastVote={store.castVote}
                                onResolvePoll={store.resolvePoll}
                                onRefresh={store.refreshPolls}
                            />
                        )}
                        {activeTab === 'tools' && toolsView === 'hunt' && (
                            <ScavengerHuntScreen
                                onBack={() => setToolsView('hub')}
                                itinerary={store.itinerary}
                            />
                        )}
                    </div>

                    {/* Bottom Nav */}
                    <BottomNav
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        newStoryAvailable={newStoryAvailable}
                        newPollAvailable={newPollAvailable}
                    />

                    {/* FAB — hidden on Plan tab */}
                    {activeTab !== 'plan' && (
                        <>
                            {/* Tap-outside dismiss */}
                            {fabOpen && (
                                <div onClick={() => setFabOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 888 }} />
                            )}

                            {/* Popover card */}
                            {fabOpen && (
                                <div style={{ position: 'fixed', bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))', right: 'var(--space-lg)', zIndex: 889, background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 28px rgba(0,0,0,0.18)', overflow: 'hidden', minWidth: '160px', animation: 'slideUp 0.15s ease-out' }}>
                                    <button onClick={() => { setFabPendingAction('journal'); setActiveTab('memories'); setFabOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'none', border: 'none', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', width: '100%', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                                        📝 Journal
                                    </button>
                                    <button onClick={() => { setFabPendingAction('photo'); setActiveTab('memories'); setFabOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                                        📸 Photo
                                    </button>
                                </div>
                            )}

                            {/* FAB button */}
                            <button
                                onClick={() => setFabOpen(f => !f)}
                                aria-label="Quick capture"
                                style={{ position: 'fixed', bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))', right: 'var(--space-lg)', width: '44px', height: '44px', background: 'var(--color-terracotta)', color: 'white', border: 'none', borderRadius: '50%', fontSize: '24px', fontWeight: 300, lineHeight: 1, cursor: 'pointer', boxShadow: '0 3px 12px rgba(200,96,58,0.45)', zIndex: 890, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {fabOpen ? '×' : '+'}
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Tracker path — unchanged */}
            {screen === 'tracker' && (
                <TrackerScreen
                    onBack={() => setScreen('home')}
                    activities={store.activities}
                    itinerary={store.itinerary}
                    journalEntries={store.journalEntries}
                    onHeartEntry={store.heartJournalEntry}
                    comments={store.comments}
                    onAddComment={store.addComment}
                    journalDigest={store.journalDigest}
                />
            )}

            {/* Global modals — render above everything */}
            {showFingerprintModal && <FingerprintModal onSuccess={handleFingerprintSuccess} onCancel={() => setShowFingerprintModal(false)} />}
            {feedbackActivity && <FeedbackModal activity={feedbackActivity} onSubmit={handleSubmitFeedback} onCancel={() => setFeedbackActivity(null)} />}
            {showAddBooking && <AddBookingModal onSubmit={handleSubmitManualBooking} onCancel={() => setShowAddBooking(false)} />}
            {showCityGuides && <CityGuidesModal onClose={() => setShowCityGuides(false)} itinerary={store.itinerary} activities={store.activities} journalEntries={store.journalEntries} />}
            {showQuickTools && <QuickToolsModal onClose={() => setShowQuickTools(false)} itinerary={store.itinerary} />}
        </div>
    )
}

export default App
