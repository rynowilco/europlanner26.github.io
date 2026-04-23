import { useState, useEffect } from 'react'
import { CONFIG } from './config'
import { SheetsAPI } from './sheetsApi'
import { EmailService } from './emailService'

// Wraps JSON.parse so corrupted/stale localStorage never crashes the app.
export const safeParseJSON = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key)
        if (raw === null || raw === undefined) return fallback
        const parsed = JSON.parse(raw)
        if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback
        return parsed
    } catch (e) {
        console.warn(`safeParseJSON: corrupt localStorage key "${key}", using fallback.`, e)
        return fallback
    }
}

export const useStore = () => {
    const [activities, setActivities] = useState(() => safeParseJSON('euroPlanner_activities', []))
    const [savedIdeas, setSavedIdeas] = useState(() => safeParseJSON('euroPlanner_savedIdeas', []))
    const [sessionSummaries, setSessionSummaries] = useState(() =>
        safeParseJSON('euroPlanner_sessionSummaries', { abby: null, tyler: null, ryan: null, mom: null })
    )
    const [lastActivity, setLastActivity] = useState(() =>
        safeParseJSON('euroPlanner_lastActivity', { abby: null, tyler: null, ryan: null, mom: null })
    )
    const [refiningIdea, setRefiningIdea] = useState(null)
    const [bookingItems, setBookingItems] = useState(() => safeParseJSON('euroPlanner_bookingItems', []))
    const [journalEntries, setJournalEntries] = useState(() => safeParseJSON('euroPlanner_journalEntries', []))
    const [comments, setComments] = useState(() => safeParseJSON('euroPlanner_comments', []))
    const [userProfiles, setUserProfiles] = useState(() => safeParseJSON('euroPlanner_profiles', CONFIG.users))
    const [itinerary, setItinerary] = useState(CONFIG.itinerary)
    const [sheetsLoaded, setSheetsLoaded] = useState(false)
    const [sheetsError, setSheetsError] = useState(null)

    // Load all data from Google Sheets on mount — parallel, isolated per sheet
    useEffect(() => {
        const loadFromSheets = async () => {
            try {
                console.log('Loading data from Google Sheets (parallel)...')

                const [
                    activitiesResult,
                    profilesResult,
                    itineraryResult,
                    ideasResult,
                    bookingResult,
                    journalResult,
                    commentsResult
                ] = await Promise.allSettled([
                    SheetsAPI.read(CONFIG.SHEET_NAMES.activities),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.userProfiles),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.itinerary),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.savedIdeas),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.bookingList),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.journal),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.comments)
                ])

                // ── Activities ──────────────────────────────────────────────
                if (activitiesResult.status === 'fulfilled' && activitiesResult.value?.length > 1) {
                    try {
                        const sheetsActivities = SheetsAPI.parseActivities(activitiesResult.value)
                        if (sheetsActivities.length > 0) {
                            const sheetsIds = new Set(sheetsActivities.map(a => a.id))
                            setActivities(prev => {
                                const updated = prev.map(a =>
                                    sheetsIds.has(a.id) ? { ...a, syncedToSheets: true } : a
                                )
                                const localOnlyIds = updated
                                    .filter(a => !sheetsIds.has(a.id) && !a.isSample)
                                    .map(a => a.id)
                                const samples = updated.filter(a => a.isSample)
                                return [...samples, ...sheetsActivities, ...updated.filter(a => localOnlyIds.includes(a.id))]
                            })
                            console.log('Loaded activities:', sheetsActivities.length)
                        }
                    } catch (e) { console.warn('parseActivities error:', e) }
                } else if (activitiesResult.status === 'rejected') {
                    console.warn('Activities sheet read failed:', activitiesResult.reason)
                }

                // ── User Profiles ───────────────────────────────────────────
                if (profilesResult.status === 'fulfilled' && profilesResult.value?.length > 1) {
                    try {
                        const parsed = SheetsAPI.parseUserProfiles(profilesResult.value)
                        if (parsed && Object.keys(parsed).length > 0) {
                            setUserProfiles(prev => ({ ...prev, ...parsed }))
                            console.log('Loaded user profiles')
                        }
                    } catch (e) { console.warn('parseUserProfiles error:', e) }
                } else if (profilesResult.status === 'rejected') {
                    console.warn('User profiles sheet read failed:', profilesResult.reason)
                }

                // ── Itinerary ───────────────────────────────────────────────
                if (itineraryResult.status === 'fulfilled' && itineraryResult.value?.length > 1) {
                    try {
                        const parsed = SheetsAPI.parseItinerary(itineraryResult.value)
                        if (parsed?.length > 0) {
                            setItinerary(parsed)
                            console.log('Loaded itinerary:', parsed.length, 'cities')
                        }
                    } catch (e) { console.warn('parseItinerary error:', e) }
                } else if (itineraryResult.status === 'rejected') {
                    console.warn('Itinerary sheet read failed:', itineraryResult.reason)
                }

                // ── Saved Ideas ─────────────────────────────────────────────
                if (ideasResult.status === 'fulfilled' && ideasResult.value?.length > 1) {
                    try {
                        const parsedIdeas = SheetsAPI.parseSavedIdeas(ideasResult.value)
                        if (parsedIdeas.length > 0) {
                            setSavedIdeas(parsedIdeas)
                            console.log('Loaded saved ideas:', parsedIdeas.length)
                        }
                    } catch (e) { console.warn('parseSavedIdeas error:', e) }
                } else if (ideasResult.status === 'rejected') {
                    console.warn('Saved ideas sheet read failed:', ideasResult.reason)
                }

                // ── Booking Items ───────────────────────────────────────────
                if (bookingResult.status === 'fulfilled' && bookingResult.value?.length > 1) {
                    try {
                        const parsedBookings = SheetsAPI.parseBookingItems(bookingResult.value)
                        if (parsedBookings.length > 0) {
                            setBookingItems(parsedBookings)
                            console.log('Loaded booking items:', parsedBookings.length)
                        }
                    } catch (e) { console.warn('parseBookingItems error:', e) }
                } else if (bookingResult.status === 'rejected') {
                    console.warn('Booking items sheet read failed:', bookingResult.reason)
                }

                // ── Journal Entries ─────────────────────────────────────────
                if (journalResult.status === 'fulfilled' && journalResult.value?.length > 1) {
                    try {
                        const parsedJournal = SheetsAPI.parseJournalEntries(journalResult.value)
                        if (parsedJournal.length > 0) {
                            setJournalEntries(parsedJournal)
                            console.log('Loaded journal entries:', parsedJournal.length)
                        }
                    } catch (e) { console.warn('parseJournalEntries error:', e) }
                } else if (journalResult.status === 'rejected') {
                    console.warn('Journal sheet read failed:', journalResult.reason)
                }

                // ── Comments ────────────────────────────────────────────────
                if (commentsResult.status === 'fulfilled' && commentsResult.value?.length > 1) {
                    try {
                        const parsedComments = SheetsAPI.parseComments(commentsResult.value)
                        setComments(parsedComments)
                        console.log('Loaded comments:', parsedComments.length)
                    } catch (e) { console.warn('parseComments error:', e) }
                } else if (commentsResult.status === 'rejected') {
                    console.warn('Comments sheet read failed:', commentsResult.reason)
                }

                // ── Flush unsynced local activities ─────────────────────────
                const localActivities = safeParseJSON('euroPlanner_activities', [])
                const unsynced = localActivities.filter(a => !a.syncedToSheets && !a.isSample)
                if (unsynced.length > 0) {
                    console.log('Flushing', unsynced.length, 'unsynced local activities...')
                    await syncUnsyncedActivities(unsynced)
                }

                setSheetsLoaded(true)
            } catch (error) {
                console.error('Unexpected error in loadFromSheets:', error)
                setSheetsError(error.message)
                setSheetsLoaded(true)
            }
        }

        loadFromSheets()
    }, [])

    // Persist to localStorage
    useEffect(() => { localStorage.setItem('euroPlanner_activities', JSON.stringify(activities)) }, [activities])
    useEffect(() => { localStorage.setItem('euroPlanner_savedIdeas', JSON.stringify(savedIdeas)) }, [savedIdeas])
    useEffect(() => { localStorage.setItem('euroPlanner_sessionSummaries', JSON.stringify(sessionSummaries)) }, [sessionSummaries])
    useEffect(() => { localStorage.setItem('euroPlanner_lastActivity', JSON.stringify(lastActivity)) }, [lastActivity])
    useEffect(() => { localStorage.setItem('euroPlanner_profiles', JSON.stringify(userProfiles)) }, [userProfiles])
    useEffect(() => { localStorage.setItem('euroPlanner_bookingItems', JSON.stringify(bookingItems)) }, [bookingItems])
    useEffect(() => { localStorage.setItem('euroPlanner_journalEntries', JSON.stringify(journalEntries)) }, [journalEntries])
    useEffect(() => { localStorage.setItem('euroPlanner_comments', JSON.stringify(comments)) }, [comments])

    // ── Saved Ideas ─────────────────────────────────────────────────────────
    const addSavedIdea = async (idea) => {
        const newIdea = {
            ...idea,
            id: 'IDEA-' + Date.now(),
            dateSaved: new Date().toISOString().split('T')[0],
            dateUpdated: new Date().toISOString().split('T')[0],
            syncedToSheets: false
        }
        setSavedIdeas(prev => [...prev, newIdea])
        try {
            await SheetsAPI.append(CONFIG.SHEET_NAMES.savedIdeas, SheetsAPI.ideaToRow(newIdea))
            setSavedIdeas(prev => prev.map(i => i.id === newIdea.id ? { ...i, syncedToSheets: true } : i))
            console.log('Idea saved to Sheets:', newIdea.title)
        } catch (e) {
            console.error('Failed to sync idea to Sheets:', e)
        }
        return newIdea
    }

    const updateSavedIdea = async (id, updates) => {
        const updatedIdeas = savedIdeas.map(idea =>
            idea.id === id ? { ...idea, ...updates, dateUpdated: new Date().toISOString().split('T')[0] } : idea
        )
        setSavedIdeas(updatedIdeas)
        const updated = updatedIdeas.find(i => i.id === id)
        if (updated) {
            try {
                await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.savedIdeas, id, SheetsAPI.ideaToRow(updated))
            } catch (e) {
                console.error('Failed to update idea in Sheets:', e)
            }
        }
    }

    const deleteSavedIdea = async (id) => {
        const idea = savedIdeas.find(i => i.id === id)
        setSavedIdeas(prev => prev.filter(i => i.id !== id))
        if (idea) {
            try {
                await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.savedIdeas, id, SheetsAPI.ideaToRow(idea, 'deleted'))
            } catch (e) {
                console.error('Failed to mark idea deleted in Sheets:', e)
            }
        }
    }

    const convertIdeaToActivity = async (ideaId) => {
        const idea = savedIdeas.find(i => i.id === ideaId)
        if (!idea) return null
        const newActivity = await addActivity({
            title: idea.title,
            city: idea.city,
            description: idea.notes || idea.description || '',
            estimatedCost: idea.estimatedCost || 0,
            travelMethod: idea.travelMethod || 'TBD',
            travelTime: idea.travelTime || 'TBD',
            duration: idea.duration || 'TBD',
            otherConsiderations: idea.considerations || '',
            kidId: idea.kidId,
            kidName: idea.kidName
        })
        await deleteSavedIdea(ideaId)
        return newActivity
    }

    // ── Activities ──────────────────────────────────────────────────────────
    const addActivity = async (activity) => {
        const newActivity = {
            ...activity,
            id: `ACT-${Date.now()}`,
            dateSubmitted: new Date().toISOString().split('T')[0],
            dateUpdated: new Date().toISOString().split('T')[0],
            status: 'submitted',
            syncedToSheets: false
        }
        setActivities(prev => [...prev, newActivity])
        console.log('Adding activity:', newActivity.title)
        try {
            await SheetsAPI.append(CONFIG.SHEET_NAMES.activities, SheetsAPI.activityToRow(newActivity))
            console.log('Activity synced to Sheets:', newActivity.title)
            setActivities(prev => prev.map(a => a.id === newActivity.id ? { ...a, syncedToSheets: true } : a))
        } catch (error) {
            console.error('Error syncing activity to Sheets (will retry on next load):', error)
        }
        return newActivity
    }

    // Deduplicates by ID (primary) and by kidName+title (fallback for legacy activities)
    const syncUnsyncedActivities = async (currentActivities) => {
        const unsynced = (currentActivities || []).filter(a => !a.syncedToSheets && !a.isSample)
        if (unsynced.length === 0) return 0

        let existingIds = new Set()
        let existingTitleKeys = new Set()
        try {
            const sheetsData = await SheetsAPI.read(CONFIG.SHEET_NAMES.activities)
            if (sheetsData && sheetsData.length > 1) {
                sheetsData.slice(1).forEach(row => {
                    if (row[0]) existingIds.add(row[0])
                    if (row[1] && row[2]) existingTitleKeys.add(row[1].toLowerCase() + '|' + row[2].toLowerCase())
                })
            }
        } catch (e) {
            console.warn('Could not fetch existing IDs for dedup check:', e)
        }

        console.log('Dedup: ' + existingIds.size + ' IDs, ' + existingTitleKeys.size + ' title keys in Sheet')
        console.log('Attempting to sync ' + unsynced.length + ' local activities')

        let synced = 0
        let skipped = 0
        for (const activity of unsynced) {
            const titleKey = activity.kidName.toLowerCase() + '|' + activity.title.toLowerCase()
            if (existingIds.has(activity.id) || existingTitleKeys.has(titleKey)) {
                setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, syncedToSheets: true } : a))
                console.log('Skipped duplicate:', activity.title)
                skipped++
                continue
            }
            try {
                await SheetsAPI.append(CONFIG.SHEET_NAMES.activities, SheetsAPI.activityToRow(activity))
                setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, syncedToSheets: true } : a))
                synced++
            } catch (error) {
                console.error('Failed to sync activity:', activity.title, error)
            }
        }
        console.log('Sync complete: ' + synced + ' new, ' + skipped + ' duplicates skipped')
        return synced
    }

    const updateActivity = async (id, updates) => {
        const activity = activities.find(a => a.id === id)
        if (!activity) return
        const updated = { ...activity, ...updates, dateUpdated: new Date().toISOString().split('T')[0] }
        setActivities(prev => prev.map(a => a.id === id ? updated : a))
        try {
            await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.activities, id, SheetsAPI.activityToRow(updated))
        } catch (e) {
            console.error('Failed to sync activity update to Sheets:', e)
        }
    }

    const approveActivity = async (id) => {
        const activity = activities.find(a => a.id === id)
        if (!activity || activity.isSample) return
        const updated = { ...activity, status: 'approved', dateUpdated: new Date().toISOString().split('T')[0] }
        setActivities(prev => prev.map(a => a.id === id ? updated : a))
        setUserProfiles(prev => ({
            ...prev,
            [activity.kidId]: {
                ...prev[activity.kidId],
                budgetRemaining: prev[activity.kidId].budgetRemaining - (activity.estimatedCost * CONFIG.softParams.eurToUsdRate),
                approvedActivities: prev[activity.kidId].approvedActivities + 1
            }
        }))
        try {
            const data = await SheetsAPI.read(CONFIG.SHEET_NAMES.activities)
            if (data && data.length >= 2) {
                const rowIndex = data.slice(1).findIndex(row => row[0] === id)
                if (rowIndex !== -1) {
                    const sheetRow = rowIndex + 2
                    await SheetsAPI.update(CONFIG.SHEET_NAMES.activities, 'A' + sheetRow + ':N' + sheetRow, [SheetsAPI.activityToRow(updated)])
                    console.log('Approval synced to Sheets, row', sheetRow)
                }
            }
        } catch (e) {
            console.error('Failed to sync approval to Sheets:', e)
        }
    }

    // ── Session management ──────────────────────────────────────────────────
    const updateLastActivity = (userId) => {
        setLastActivity(prev => ({ ...prev, [userId]: Date.now() }))
    }

    const isSessionExpired = (userId) => {
        const lastTime = lastActivity[userId]
        if (!lastTime) return false
        return Date.now() - lastTime > 60 * 60 * 1000
    }

    const saveSessionSummary = (userId, summary) => {
        setSessionSummaries(prev => ({
            ...prev,
            [userId]: { summary, timestamp: Date.now(), date: new Date().toLocaleDateString() }
        }))
    }

    const getSessionSummary = (userId) => sessionSummaries[userId]

    const clearSessionSummary = (userId) => {
        setSessionSummaries(prev => ({ ...prev, [userId]: null }))
    }

    const saveConversationSummaryToSheets = async (userId, summary) => {
        try {
            const row = [
                userProfiles[userId]?.name || userId,
                new Date().toISOString().split('T')[0],
                summary.topics || '',
                summary.ideas || '',
                summary.notes || '',
                'N'
            ]
            await SheetsAPI.append(CONFIG.SHEET_NAMES.conversations, row)
            console.log('Conversation summary saved to Sheets')
        } catch (error) {
            console.error('Error saving conversation summary:', error)
        }
    }

    // ── Booking List ────────────────────────────────────────────────────────
    const addBookingItem = async (item) => {
        const newItem = {
            ...item,
            id: 'BOOK-' + Date.now(),
            status: 'pending',
            dateAdded: new Date().toISOString().split('T')[0],
            dateBooked: null,
            syncedToSheets: false
        }
        setBookingItems(prev => [...prev, newItem])
        try {
            const row = [
                newItem.id, newItem.title, newItem.city || '', newItem.notes || '',
                newItem.link || '', newItem.status, newItem.dateAdded,
                newItem.dateBooked || '', newItem.activityId || ''
            ]
            await SheetsAPI.append(CONFIG.SHEET_NAMES.bookingList, row)
            setBookingItems(prev => prev.map(b => b.id === newItem.id ? { ...b, syncedToSheets: true } : b))
            console.log('Booking item synced to Sheets:', newItem.title)
        } catch (e) {
            console.error('Failed to sync booking item:', e)
        }
        return newItem
    }

    const toggleBookingStatus = async (id) => {
        const item = bookingItems.find(b => b.id === id)
        if (!item) return
        const updated = {
            ...item,
            status: item.status === 'booked' ? 'pending' : 'booked',
            dateBooked: item.status === 'booked' ? null : new Date().toISOString().split('T')[0]
        }
        setBookingItems(prev => prev.map(b => b.id === id ? updated : b))
        try {
            const row = [
                updated.id, updated.title, updated.city || '', updated.notes || '',
                updated.link || '', updated.status, updated.dateAdded,
                updated.dateBooked || '', updated.activityId || ''
            ]
            await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.bookingList, id, row)
        } catch (e) {
            console.error('Failed to sync booking toggle to Sheets:', e)
        }
    }

    const deleteBookingItem = async (id) => {
        const item = bookingItems.find(b => b.id === id)
        setBookingItems(prev => prev.filter(b => b.id !== id))
        if (item) {
            try {
                const row = [
                    item.id, item.title, item.city || '', item.notes || '',
                    item.link || '', 'deleted', item.dateAdded,
                    item.dateBooked || '', item.activityId || ''
                ]
                await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.bookingList, id, row)
            } catch (e) {
                console.error('Failed to mark booking deleted in Sheets:', e)
            }
        }
    }

    // ── Journal ─────────────────────────────────────────────────────────────
    // entryType: 'journal' (default) or 'photo'
    // photoUrl: Drive URL for photo entries (empty string for journal entries)
    const addJournalEntry = async (userId, userName, city, entryText, mood, lat, lng, entryType = 'journal', photoUrl = '') => {
        const now = new Date()
        const entry = {
            id: 'JRNL-' + Date.now(),
            userId, userName, city,
            date: now.toISOString().split('T')[0],
            entryText: entryText || '',
            mood: mood || '',
            lat: lat || null,
            lng: lng || null,
            timestamp: now.toISOString(),
            heartCount: 0,
            entryType,
            photoUrl: photoUrl || ''
        }
        setJournalEntries(prev => [entry, ...prev])
        try {
            await SheetsAPI.append(CONFIG.SHEET_NAMES.journal, SheetsAPI.journalEntryToRow(entry))
            console.log('Journal entry saved to Sheets:', entry.id, '(' + entryType + ')')
        } catch (e) { console.error('Failed to save journal entry:', e) }
        return entry
    }

    const heartJournalEntry = async (entryId) => {
        const storageKey = 'euroPlanner_heartedEntries'
        const hearted = safeParseJSON(storageKey, [])
        const alreadyHearted = hearted.includes(entryId)
        const delta = alreadyHearted ? -1 : 1
        localStorage.setItem(storageKey, JSON.stringify(
            alreadyHearted ? hearted.filter(id => id !== entryId) : [...hearted, entryId]
        ))
        const current = journalEntries.find(e => e.id === entryId)
        if (!current) return
        const newCount = Math.max(0, (current.heartCount || 0) + delta)
        setJournalEntries(prev => prev.map(e =>
            e.id === entryId ? { ...e, heartCount: newCount } : e
        ))
        try {
            await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.journal, entryId,
                SheetsAPI.journalEntryToRow({ ...current, heartCount: newCount }))
        } catch (e) { console.error('Failed to sync heart to Sheets:', e) }
    }

    const addComment = async (entryId, entryType, commenterName, commentText) => {
        const comment = {
            id: 'CMT-' + Date.now(),
            entryId,
            entryType,
            commenterName,
            commentText,
            timestamp: new Date().toISOString(),
            read: 'N'
        }
        setComments(prev => [...prev, comment])
        try {
            await SheetsAPI.append(CONFIG.SHEET_NAMES.comments, SheetsAPI.commentToRow(comment))
            console.log('Comment saved to Sheets:', comment.id)
        } catch (e) {
            console.error('Failed to save comment:', e)
        }
        return comment
    }

    return {
        activities,
        savedIdeas,
        sessionSummaries,
        lastActivity,
        refiningIdea,
        userProfiles,
        itinerary,
        sheetsLoaded,
        sheetsError,
        addActivity,
        updateActivity,
        approveActivity,
        addSavedIdea,
        updateSavedIdea,
        deleteSavedIdea,
        convertIdeaToActivity,
        setRefiningIdea,
        updateLastActivity,
        isSessionExpired,
        saveSessionSummary,
        getSessionSummary,
        clearSessionSummary,
        saveConversationSummaryToSheets,
        syncUnsyncedActivities,
        setUserProfiles,
        bookingItems,
        addBookingItem,
        toggleBookingStatus,
        deleteBookingItem,
        journalEntries,
        addJournalEntry,
        heartJournalEntry,
        comments,
        addComment,
        EmailService
    }
}
