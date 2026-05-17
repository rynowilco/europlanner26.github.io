import { useState, useEffect } from 'react'
import { CONFIG, localDate } from './config'
import { SheetsAPI } from './sheetsApi'
import { EmailService } from './emailService'

export const safeParseJSON = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key)
        if (raw === null || raw === undefined) return fallback
        const parsed = JSON.parse(raw)
        if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback
        return parsed
    } catch (e) {
        console.warn(`safeParseJSON: corrupt key "${key}", using fallback.`, e)
        return fallback
    }
}

export const useStore = () => {
    const [activities, setActivities]         = useState(() => safeParseJSON('euroPlanner_activities', []))
    const [savedIdeas, setSavedIdeas]         = useState(() => safeParseJSON('euroPlanner_savedIdeas', []))
    const [sessionSummaries, setSessionSummaries] = useState(() =>
        safeParseJSON('euroPlanner_sessionSummaries', { abby: null, tyler: null, ryan: null, mom: null })
    )
    const [lastActivity, setLastActivity]     = useState(() =>
        safeParseJSON('euroPlanner_lastActivity', { abby: null, tyler: null, ryan: null, mom: null })
    )
    const [refiningIdea, setRefiningIdea]     = useState(null)
    const [bookingItems, setBookingItems]     = useState(() => safeParseJSON('euroPlanner_bookingItems', []))
    const [journalEntries, setJournalEntries] = useState(() => safeParseJSON('euroPlanner_journalEntries', []))
    const [comments, setComments]             = useState(() => safeParseJSON('euroPlanner_comments', []))
    const [journalDigest, setJournalDigest]   = useState(() => safeParseJSON('euroPlanner_journalDigest', []))
    const [euroLedger, setEuroLedger]         = useState(() => safeParseJSON('euroPlanner_euroLedger', []))
    const [userProfiles, setUserProfiles]     = useState(() => safeParseJSON('euroPlanner_profiles', CONFIG.users))
    const [itinerary, setItinerary]           = useState(CONFIG.itinerary)
    const [sheetsLoaded, setSheetsLoaded]     = useState(false)
    const [sheetsError, setSheetsError]       = useState(null)

    // ── Load from Sheets on mount ─────────────────────────────────────────────
    useEffect(() => {
        const loadFromSheets = async () => {
            try {
                const [
                    activitiesResult, profilesResult, itineraryResult,
                    ideasResult, bookingResult, journalResult,
                    commentsResult, digestResult, euroLedgerResult
                ] = await Promise.allSettled([
                    SheetsAPI.read(CONFIG.SHEET_NAMES.activities),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.userProfiles),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.itinerary),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.savedIdeas),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.bookingList),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.journal),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.comments),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.journalDigest),
                    SheetsAPI.read(CONFIG.SHEET_NAMES.euroLedger)
                ])

                if (activitiesResult.status === 'fulfilled' && activitiesResult.value?.length > 1) {
                    try {
                        const sheetsActivities = SheetsAPI.parseActivities(activitiesResult.value)
                        if (sheetsActivities.length > 0) {
                            const sheetsIds = new Set(sheetsActivities.map(a => a.id))
                            setActivities(prev => {
                                const updated = prev.map(a => sheetsIds.has(a.id) ? { ...a, syncedToSheets: true } : a)
                                const localOnlyIds = updated.filter(a => !sheetsIds.has(a.id) && !a.isSample).map(a => a.id)
                                const samples = updated.filter(a => a.isSample)
                                return [...samples, ...sheetsActivities, ...updated.filter(a => localOnlyIds.includes(a.id))]
                            })
                        }
                    } catch (e) { console.warn('parseActivities error:', e) }
                }

                if (profilesResult.status === 'fulfilled' && profilesResult.value?.length > 1) {
                    try {
                        const parsed = SheetsAPI.parseUserProfiles(profilesResult.value)
                        if (parsed && Object.keys(parsed).length > 0) setUserProfiles(prev => ({ ...prev, ...parsed }))
                    } catch (e) { console.warn('parseUserProfiles error:', e) }
                }

                if (itineraryResult.status === 'fulfilled' && itineraryResult.value?.length > 1) {
                    try {
                        const parsed = SheetsAPI.parseItinerary(itineraryResult.value)
                        if (parsed?.length > 0) setItinerary(parsed)
                    } catch (e) { console.warn('parseItinerary error:', e) }
                }

                if (ideasResult.status === 'fulfilled' && ideasResult.value?.length > 1) {
                    try {
                        const parsedIdeas = SheetsAPI.parseSavedIdeas(ideasResult.value)
                        if (parsedIdeas.length > 0) setSavedIdeas(parsedIdeas)
                    } catch (e) { console.warn('parseSavedIdeas error:', e) }
                }

                if (bookingResult.status === 'fulfilled' && bookingResult.value?.length > 1) {
                    try {
                        const parsedBookings = SheetsAPI.parseBookingItems(bookingResult.value)
                        if (parsedBookings.length > 0) setBookingItems(parsedBookings)
                    } catch (e) { console.warn('parseBookingItems error:', e) }
                }

                if (journalResult.status === 'fulfilled' && journalResult.value?.length > 1) {
                    try {
                        const parsedJournal = SheetsAPI.parseJournalEntries(journalResult.value)
                        if (parsedJournal.length > 0) setJournalEntries(parsedJournal)
                    } catch (e) { console.warn('parseJournalEntries error:', e) }
                }

                if (commentsResult.status === 'fulfilled' && commentsResult.value?.length > 1) {
                    try { setComments(SheetsAPI.parseComments(commentsResult.value)) }
                    catch (e) { console.warn('parseComments error:', e) }
                }

                if (digestResult.status === 'fulfilled' && digestResult.value?.length > 1) {
                    try {
                        const parsedDigest = SheetsAPI.parseJournalDigest(digestResult.value)
                        if (parsedDigest.length > 0) setJournalDigest(parsedDigest)
                    } catch (e) { console.warn('parseJournalDigest error:', e) }
                }

                if (euroLedgerResult.status === 'fulfilled' && euroLedgerResult.value?.length > 1) {
                    try { setEuroLedger(SheetsAPI.parseEuroLedger(euroLedgerResult.value)) }
                    catch (e) { console.warn('parseEuroLedger error:', e) }
                }

                const localActivities = safeParseJSON('euroPlanner_activities', [])
                const unsynced = localActivities.filter(a => !a.syncedToSheets && !a.isSample)
                if (unsynced.length > 0) await syncUnsyncedActivities(unsynced)

                setSheetsLoaded(true)
            } catch (error) {
                console.error('loadFromSheets error:', error)
                setSheetsError(error.message)
                setSheetsLoaded(true)
            }
        }
        loadFromSheets()
    }, [])

    // ── Persist to localStorage ───────────────────────────────────────────────
    useEffect(() => { localStorage.setItem('euroPlanner_activities',      JSON.stringify(activities))      }, [activities])
    useEffect(() => { localStorage.setItem('euroPlanner_savedIdeas',      JSON.stringify(savedIdeas))      }, [savedIdeas])
    useEffect(() => { localStorage.setItem('euroPlanner_sessionSummaries', JSON.stringify(sessionSummaries)) }, [sessionSummaries])
    useEffect(() => { localStorage.setItem('euroPlanner_lastActivity',    JSON.stringify(lastActivity))    }, [lastActivity])
    useEffect(() => { localStorage.setItem('euroPlanner_profiles',        JSON.stringify(userProfiles))    }, [userProfiles])
    useEffect(() => { localStorage.setItem('euroPlanner_bookingItems',    JSON.stringify(bookingItems))    }, [bookingItems])
    useEffect(() => { localStorage.setItem('euroPlanner_journalEntries',  JSON.stringify(journalEntries))  }, [journalEntries])
    useEffect(() => { localStorage.setItem('euroPlanner_comments',        JSON.stringify(comments))        }, [comments])
    useEffect(() => { localStorage.setItem('euroPlanner_journalDigest',   JSON.stringify(journalDigest))   }, [journalDigest])
    useEffect(() => { localStorage.setItem('euroPlanner_euroLedger',      JSON.stringify(euroLedger))      }, [euroLedger])

    // ── Saved Ideas ───────────────────────────────────────────────────────────
    const addSavedIdea = async (idea) => {
        const newIdea = { ...idea, id: 'IDEA-' + Date.now(), dateSaved: localDate(), dateUpdated: localDate(), syncedToSheets: false }
        setSavedIdeas(prev => [...prev, newIdea])
        try {
            await SheetsAPI.append(CONFIG.SHEET_NAMES.savedIdeas, SheetsAPI.ideaToRow(newIdea))
            setSavedIdeas(prev => prev.map(i => i.id === newIdea.id ? { ...i, syncedToSheets: true } : i))
        } catch (e) { console.error('Failed to sync idea:', e) }
        return newIdea
    }

    const updateSavedIdea = async (id, updates) => {
        const updated = savedIdeas.map(i => i.id === id ? { ...i, ...updates, dateUpdated: localDate() } : i)
        setSavedIdeas(updated)
        const item = updated.find(i => i.id === id)
        if (item) {
            try { await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.savedIdeas, id, SheetsAPI.ideaToRow(item)) }
            catch (e) { console.error('Failed to update idea:', e) }
        }
    }

    const deleteSavedIdea = async (id) => {
        const idea = savedIdeas.find(i => i.id === id)
        setSavedIdeas(prev => prev.filter(i => i.id !== id))
        if (idea) {
            try { await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.savedIdeas, id, SheetsAPI.ideaToRow(idea, 'deleted')) }
            catch (e) { console.error('Failed to delete idea:', e) }
        }
    }

    const convertIdeaToActivity = async (ideaId) => {
        const idea = savedIdeas.find(i => i.id === ideaId)
        if (!idea) return null
        const newActivity = await addActivity({
            title: idea.title, city: idea.city,
            description: idea.notes || idea.description || '',
            estimatedCost: idea.estimatedCost || 0,
            travelMethod: idea.travelMethod || 'TBD', travelTime: idea.travelTime || 'TBD',
            duration: idea.duration || 'TBD', otherConsiderations: idea.considerations || '',
            kidId: idea.kidId, kidName: idea.kidName
        })
        await deleteSavedIdea(ideaId)
        return newActivity
    }

    // ── Activities ────────────────────────────────────────────────────────────
    const addActivity = async (activity) => {
        const newActivity = { ...activity, id: `ACT-${Date.now()}`, dateSubmitted: localDate(), dateUpdated: localDate(), status: 'submitted', syncedToSheets: false }
        setActivities(prev => [...prev, newActivity])
        try {
            await SheetsAPI.append(CONFIG.SHEET_NAMES.activities, SheetsAPI.activityToRow(newActivity))
            setActivities(prev => prev.map(a => a.id === newActivity.id ? { ...a, syncedToSheets: true } : a))
        } catch (e) { console.error('Failed to sync activity:', e) }
        return newActivity
    }

    const syncUnsyncedActivities = async (currentActivities) => {
        const unsynced = (currentActivities || []).filter(a => !a.syncedToSheets && !a.isSample)
        if (unsynced.length === 0) return 0
        let existingIds = new Set(), existingTitleKeys = new Set()
        try {
            const sheetsData = await SheetsAPI.read(CONFIG.SHEET_NAMES.activities)
            if (sheetsData?.length > 1) {
                sheetsData.slice(1).forEach(row => {
                    if (row[0]) existingIds.add(row[0])
                    if (row[1] && row[2]) existingTitleKeys.add(row[1].toLowerCase() + '|' + row[2].toLowerCase())
                })
            }
        } catch (e) { console.warn('Dedup check failed:', e) }
        let synced = 0
        for (const activity of unsynced) {
            const titleKey = activity.kidName.toLowerCase() + '|' + activity.title.toLowerCase()
            if (existingIds.has(activity.id) || existingTitleKeys.has(titleKey)) {
                setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, syncedToSheets: true } : a))
                continue
            }
            try {
                await SheetsAPI.append(CONFIG.SHEET_NAMES.activities, SheetsAPI.activityToRow(activity))
                setActivities(prev => prev.map(a => a.id === activity.id ? { ...a, syncedToSheets: true } : a))
                synced++
            } catch (e) { console.error('Failed to sync activity:', activity.title, e) }
        }
        return synced
    }

    const updateActivity = async (id, updates) => {
        const activity = activities.find(a => a.id === id)
        if (!activity) return
        const updated = { ...activity, ...updates, dateUpdated: localDate() }
        setActivities(prev => prev.map(a => a.id === id ? updated : a))
        try { await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.activities, id, SheetsAPI.activityToRow(updated)) }
        catch (e) { console.error('Failed to sync activity update:', e) }
    }

    const approveActivity = async (id) => {
        const activity = activities.find(a => a.id === id)
        if (!activity || activity.isSample) return
        const updated = { ...activity, status: 'approved', dateUpdated: localDate() }
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
            if (data?.length >= 2) {
                const rowIndex = data.slice(1).findIndex(row => row[0] === id)
                if (rowIndex !== -1) {
                    await SheetsAPI.update(CONFIG.SHEET_NAMES.activities, `A${rowIndex + 2}:N${rowIndex + 2}`, [SheetsAPI.activityToRow(updated)])
                }
            }
        } catch (e) { console.error('Failed to sync approval:', e) }
    }

    // ── Session ───────────────────────────────────────────────────────────────
    const updateLastActivity    = (userId) => setLastActivity(prev => ({ ...prev, [userId]: Date.now() }))
    const isSessionExpired      = (userId) => { const t = lastActivity[userId]; return t ? Date.now() - t > 3600000 : false }
    const saveSessionSummary    = (userId, summary) => setSessionSummaries(prev => ({ ...prev, [userId]: { summary, timestamp: Date.now(), date: new Date().toLocaleDateString() } }))
    const getSessionSummary     = (userId) => sessionSummaries[userId]
    const clearSessionSummary   = (userId) => setSessionSummaries(prev => ({ ...prev, [userId]: null }))

    const saveConversationSummaryToSheets = async (userId, summary) => {
        try {
            await SheetsAPI.append(CONFIG.SHEET_NAMES.conversations, [
                userProfiles[userId]?.name || userId, localDate(),
                summary.topics || '', summary.ideas || '', summary.notes || '', 'N'
            ])
        } catch (e) { console.error('Failed to save conversation summary:', e) }
    }

    // ── Booking ───────────────────────────────────────────────────────────────
    const addBookingItem = async (item) => {
        const newItem = { ...item, id: 'BOOK-' + Date.now(), status: 'pending', dateAdded: localDate(), dateBooked: null, syncedToSheets: false }
        setBookingItems(prev => [...prev, newItem])
        try {
            await SheetsAPI.append(CONFIG.SHEET_NAMES.bookingList, [
                newItem.id, newItem.title, newItem.city || '', newItem.notes || '',
                newItem.link || '', newItem.status, newItem.dateAdded, newItem.dateBooked || '', newItem.activityId || ''
            ])
            setBookingItems(prev => prev.map(b => b.id === newItem.id ? { ...b, syncedToSheets: true } : b))
        } catch (e) { console.error('Failed to sync booking:', e) }
        return newItem
    }

    const toggleBookingStatus = async (id) => {
        const item = bookingItems.find(b => b.id === id)
        if (!item) return
        const updated = { ...item, status: item.status === 'booked' ? 'pending' : 'booked', dateBooked: item.status === 'booked' ? null : localDate() }
        setBookingItems(prev => prev.map(b => b.id === id ? updated : b))
        try {
            await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.bookingList, id, [
                updated.id, updated.title, updated.city || '', updated.notes || '',
                updated.link || '', updated.status, updated.dateAdded, updated.dateBooked || '', updated.activityId || ''
            ])
        } catch (e) { console.error('Failed to sync booking toggle:', e) }
    }

    const deleteBookingItem = async (id) => {
        const item = bookingItems.find(b => b.id === id)
        setBookingItems(prev => prev.filter(b => b.id !== id))
        if (item) {
            try {
                await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.bookingList, id, [
                    item.id, item.title, item.city || '', item.notes || '',
                    item.link || '', 'deleted', item.dateAdded, item.dateBooked || '', item.activityId || ''
                ])
            } catch (e) { console.error('Failed to delete booking:', e) }
        }
    }

    // ── Euro Ledger ───────────────────────────────────────────────────────────
    const getEuroBalance = (userId) => {
        const total = euroLedger.filter(e => e.userId === userId).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
        return Math.max(0, parseFloat(total.toFixed(2)))
    }

    const awardEuros = async (userId, amount, reason) => {
        if (!userId || !amount) return
        const entry = { id: 'EUR-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5), userId, amount: parseFloat(amount.toFixed(2)), reason, timestamp: new Date().toISOString() }
        setEuroLedger(prev => [entry, ...prev])
        try { await SheetsAPI.append(CONFIG.SHEET_NAMES.euroLedger, SheetsAPI.ledgerEntryToRow(entry)) }
        catch (e) { console.error('Failed to sync euro award:', e) }
        return entry
    }

    const processWithdrawal = async (userId, amount, reason) => awardEuros(userId, -Math.abs(parseFloat(amount)), reason || 'withdrawal')

    // ── Journal ───────────────────────────────────────────────────────────────
    const addJournalEntry = async (userId, userName, city, entryText, mood, lat, lng, entryType = 'journal', photoUrl = '') => {
        const entry = { id: 'JRNL-' + Date.now(), userId, userName, city, date: localDate(), entryText: entryText || '', mood: mood || '', lat: lat || null, lng: lng || null, timestamp: new Date().toISOString(), heartCount: 0, entryType, photoUrl: photoUrl || '' }
        setJournalEntries(prev => [entry, ...prev])
        try { await SheetsAPI.append(CONFIG.SHEET_NAMES.journal, SheetsAPI.journalEntryToRow(entry)) }
        catch (e) { console.error('Failed to save journal entry:', e) }
        let euroEarned = 0
        if (!CONFIG.users[userId]?.isParent) {
            if (entryType === 'journal') {
                const wordCount = (entryText || '').trim().split(/\s+/).filter(Boolean).length
                if (wordCount >= 75) { await awardEuros(userId, CONFIG.EURO_RATES.journalEntry, 'journal_entry'); euroEarned += CONFIG.EURO_RATES.journalEntry }
            } else if (entryType === 'photo') {
                const todayEarnings = euroLedger.filter(e => e.userId === userId && e.reason === 'photo_upload' && e.timestamp.startsWith(entry.date)).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
                if (todayEarnings < CONFIG.EURO_RATES.photoDailyCap) { await awardEuros(userId, CONFIG.EURO_RATES.photoUpload, 'photo_upload'); euroEarned += CONFIG.EURO_RATES.photoUpload }
            }
        }
        return { ...entry, euroEarned }
    }

    const heartJournalEntry = async (entryId) => {
        const storageKey = 'euroPlanner_heartedEntries'
        const hearted = safeParseJSON(storageKey, [])
        const alreadyHearted = hearted.includes(entryId)
        localStorage.setItem(storageKey, JSON.stringify(alreadyHearted ? hearted.filter(id => id !== entryId) : [...hearted, entryId]))
        const current = journalEntries.find(e => e.id === entryId)
        if (!current) return
        const newCount = Math.max(0, (current.heartCount || 0) + (alreadyHearted ? -1 : 1))
        setJournalEntries(prev => prev.map(e => e.id === entryId ? { ...e, heartCount: newCount } : e))
        try { await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.journal, entryId, SheetsAPI.journalEntryToRow({ ...current, heartCount: newCount })) }
        catch (e) { console.error('Failed to sync heart:', e) }
    }

    const saveJournalStory = async (date, storyText, generatedBy) => {
        const entry = { date, story: storyText, generatedAt: new Date().toISOString(), generatedBy: generatedBy || '' }
        const exists = journalDigest.some(d => d.date === date)
        if (exists) {
            setJournalDigest(prev => prev.map(d => d.date === date ? entry : d))
            try { await SheetsAPI.findAndUpdateRow(CONFIG.SHEET_NAMES.journalDigest, date, SheetsAPI.digestToRow(entry)) }
            catch (e) { console.error('Failed to update story:', e) }
        } else {
            setJournalDigest(prev => [entry, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
            try { await SheetsAPI.append(CONFIG.SHEET_NAMES.journalDigest, SheetsAPI.digestToRow(entry)) }
            catch (e) { console.error('Failed to save story:', e) }
        }
        return entry
    }

    const addComment = async (entryId, entryType, commenterName, commentText) => {
        const comment = { id: 'CMT-' + Date.now(), entryId, entryType, commenterName, commentText, timestamp: new Date().toISOString(), read: 'N' }
        setComments(prev => [...prev, comment])
        try { await SheetsAPI.append(CONFIG.SHEET_NAMES.comments, SheetsAPI.commentToRow(comment)) }
        catch (e) { console.error('Failed to save comment:', e) }
        return comment
    }

    return {
        activities, savedIdeas, sessionSummaries, lastActivity, refiningIdea,
        userProfiles, itinerary, sheetsLoaded, sheetsError,
        addActivity, updateActivity, approveActivity,
        addSavedIdea, updateSavedIdea, deleteSavedIdea, convertIdeaToActivity,
        setRefiningIdea,
        updateLastActivity, isSessionExpired, saveSessionSummary, getSessionSummary, clearSessionSummary,
        saveConversationSummaryToSheets, syncUnsyncedActivities, setUserProfiles,
        bookingItems, addBookingItem, toggleBookingStatus, deleteBookingItem,
        journalEntries, addJournalEntry, heartJournalEntry,
        comments, addComment,
        journalDigest, saveJournalStory,
        euroLedger, awardEuros, processWithdrawal, getEuroBalance,
        EmailService
    }
}
