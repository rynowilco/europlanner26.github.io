import React, { useState } from 'react'
import { useStore } from './useStore'
import { SheetsStatusBanner } from './components/SheetsStatusBanner'
import { FingerprintModal } from './components/FingerprintModal'
import { FeedbackModal } from './components/FeedbackModal'
import { AddBookingModal } from './components/AddBookingModal'
import { HomeScreen } from './screens/HomeScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { ChatScreen } from './screens/ChatScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { MapScreen } from './screens/MapScreen'
import { TrackerScreen } from './screens/TrackerScreen'
import { MemoriesScreen } from './screens/MemoriesScreen'
import { FamilyFeedScreen } from './screens/FamilyFeedScreen'

const App = () => {
    const [screen, setScreen] = useState('home')
    const [currentUser, setCurrentUser] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [showFingerprintModal, setShowFingerprintModal] = useState(false)
    const [feedbackActivity, setFeedbackActivity] = useState(null)
    const [showAddBooking, setShowAddBooking] = useState(false)
    const [previousScreen, setPreviousScreen] = useState('welcome')
    const [bannerDismissed, setBannerDismissed] = useState(false)
    const store = useStore()

    const handleSelectUser = (userId) => { setCurrentUser(userId); setScreen('chat') }
    const handleSelectMemories = (userId) => { setCurrentUser(userId); setScreen('memories') }
    const handleBack = () => {
        if (screen === 'welcome') { setScreen('home') }
        else if (screen === 'chat') { setScreen('welcome'); setCurrentUser(null); store.setRefiningIdea(null) }
        else if (screen === 'memories') { setScreen('welcome'); setCurrentUser(null) }
        else if (screen === 'familyFeed') { setScreen('welcome') }
        else if (screen === 'dashboard') { setScreen(currentUser ? 'chat' : 'welcome') }
        else if (screen === 'map') { setScreen(previousScreen) }
    }
    const handleOpenAdmin = () => setShowFingerprintModal(true)
    const handleOpenDashboard = () => setScreen('dashboard')
    const handleOpenMap = () => { setPreviousScreen(screen); setScreen('map') }
    const handleOpenFamilyFeed = () => setScreen('familyFeed')
    const handleFingerprintSuccess = () => { setShowFingerprintModal(false); setIsAdmin(true); setScreen('dashboard') }
    const handleApprove = (id) => store.approveActivity(id)
    const handleFeedback = (id) => setFeedbackActivity(store.activities.find(a => a.id === id))
    const handleSubmitFeedback = async (feedback) => {
        if (feedbackActivity) await store.updateActivity(feedbackActivity.id, { status: 'needs-revision', parentFeedback: feedback })
        setFeedbackActivity(null)
    }

    const handleToggleBooked = (id) => store.toggleBookingStatus(id)
    const handleDeleteBooking = (id) => { if (confirm('Remove this booking item?')) store.deleteBookingItem(id) }
    const handleAddBooking = () => setShowAddBooking(true)
    const handleSubmitManualBooking = async (item) => { await store.addBookingItem(item); setShowAddBooking(false) }

    const handleRefineIdea = (idea) => {
        store.setRefiningIdea(idea)
        setCurrentUser(idea.kidId)
        setScreen('chat')
    }
    const handleSubmitIdea = async (ideaId) => {
        const activity = await store.convertIdeaToActivity(ideaId)
        if (activity) { alert('"' + activity.title + '" has been submitted for parent review!') }
    }
    const handleDeleteIdea = (ideaId) => {
        if (confirm('Delete this saved idea?')) store.deleteSavedIdea(ideaId)
    }

    // Photo entry handler — wraps addJournalEntry with entryType='photo'
    const handleAddPhotoEntry = async (userId, userName, city, caption, lat, lng, photoUrl) => {
        await store.addJournalEntry(userId, userName, city, caption, '', lat, lng, 'photo', photoUrl)
    }

    return (
        <div style={{ height: '100%' }}>
            <SheetsStatusBanner
                error={!bannerDismissed && store.sheetsError ? store.sheetsError : null}
                onDismiss={() => setBannerDismissed(true)}
            />
            {screen === 'home' && <HomeScreen onExplorer={() => setScreen('welcome')} onFollowAlong={() => setScreen('tracker')} />}
            {screen === 'welcome' && <WelcomeScreen onSelectUser={handleSelectUser} onSelectMemories={handleSelectMemories} userProfiles={store.userProfiles} activities={store.activities} onOpenAdmin={handleOpenAdmin} onOpenDashboard={handleOpenDashboard} onOpenMap={handleOpenMap} onOpenFamilyFeed={handleOpenFamilyFeed} onBack={handleBack} />}
            {screen === 'chat' && currentUser && <ChatScreen userId={currentUser} user={store.userProfiles[currentUser]} onBack={handleBack} onOpenDashboard={handleOpenDashboard} onOpenMap={handleOpenMap} store={store} />}
            {screen === 'memories' && currentUser && <MemoriesScreen userId={currentUser} user={store.userProfiles[currentUser]} itinerary={store.itinerary} journalEntries={store.journalEntries} onAddEntry={store.addJournalEntry} onAddPhotoEntry={handleAddPhotoEntry} onBack={handleBack} />}
            {screen === 'familyFeed' && <FamilyFeedScreen onBack={handleBack} journalEntries={store.journalEntries} onHeartEntry={store.heartJournalEntry} />}
            {screen === 'dashboard' && <DashboardScreen onBack={handleBack} activities={store.activities} savedIdeas={store.savedIdeas} bookingItems={store.bookingItems} userProfiles={store.userProfiles} isAdmin={isAdmin} currentUserId={currentUser} onApprove={handleApprove} onFeedback={handleFeedback} onRefineIdea={handleRefineIdea} onSubmitIdea={handleSubmitIdea} onDeleteIdea={handleDeleteIdea} onToggleBooked={handleToggleBooked} onDeleteBooking={handleDeleteBooking} onAddBooking={handleAddBooking} />}
            {screen === 'map' && <MapScreen onBack={handleBack} activities={store.activities} userProfiles={store.userProfiles} itinerary={store.itinerary} />}
            {screen === 'tracker' && <TrackerScreen onBack={() => setScreen('home')} activities={store.activities} itinerary={store.itinerary} journalEntries={store.journalEntries} onHeartEntry={store.heartJournalEntry} />}
            {showFingerprintModal && <FingerprintModal onSuccess={handleFingerprintSuccess} onCancel={() => setShowFingerprintModal(false)} />}
            {feedbackActivity && <FeedbackModal activity={feedbackActivity} onSubmit={handleSubmitFeedback} onCancel={() => setFeedbackActivity(null)} />}
            {showAddBooking && <AddBookingModal onSubmit={handleSubmitManualBooking} onCancel={() => setShowAddBooking(false)} />}
        </div>
    )
}

export default App
