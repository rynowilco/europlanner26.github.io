import { CONFIG } from './config'

export const SheetsAPI = {
    async callSheets(payload) {
        const res = await fetch('/api/sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Sheets API error: ' + res.status)
        return res.json()
    },

    async read(sheetName, range = '') {
        try {
            const payload = { operation: 'read', sheet: sheetName, range: range || 'A:Z' }
            const data = await this.callSheets(payload)
            return data.values || []
        } catch (error) {
            console.error('Error reading from Sheets:', error)
            return null
        }
    },

    async append(sheetName, values) {
        try {
            await this.callSheets({ operation: 'append', sheet: sheetName, values })
            console.log('✅ Synced to Sheets')
            return true
        } catch (error) {
            console.error('Error appending to Sheets:', error)
            return null
        }
    },

    async update(sheetName, range, values) {
        try {
            await this.callSheets({ operation: 'update', sheet: sheetName, range, values })
            return true
        } catch (error) {
            console.error('Error updating Sheets:', error)
            return null
        }
    },

    parseActivities(rows) {
        if (!rows || rows.length < 2) return []
        return rows.slice(1).filter(row => row[0]).map(row => ({
            id: row[0] || '',
            kidId: (row[1] || '').toLowerCase(),
            kidName: row[1] || '',
            title: row[2] || '',
            city: row[3] || '',
            description: row[4] || '',
            estimatedCost: parseFloat(row[5]) || 0,
            travelMethod: row[6] || '',
            travelTime: row[7] || '',
            duration: row[8] || '',
            otherConsiderations: row[9] || '',
            status: (row[10] || 'draft').toLowerCase().replace(/ /g, '-'),
            dateSubmitted: row[11] || '',
            parentFeedback: row[12] || '',
            dateUpdated: row[13] || '',
            syncedToSheets: true
        }))
    },

    parseUserProfiles(rows) {
        if (!rows || rows.length < 2) return null
        const profiles = {}
        const emojiMap = { abby: '⚽', tyler: '🏈', ryan: '👨‍🍳', mom: '🧜‍♀️' }
        const colorMap = { abby: '#D64F8A', tyler: '#C0392B', ryan: '#2E6DA4', mom: '#2E8B57' }
        rows.slice(1).filter(row => row[0]).forEach(row => {
            const name = row[0]
            const id = name.toLowerCase()
            profiles[id] = {
                name,
                age: parseInt(row[1]) || 0,
                interests: (row[2] || '').split(',').map(s => s.trim()).filter(Boolean),
                preferences: row[3] || '',
                budgetTotal: parseFloat(row[4]) || 1000,
                budgetRemaining: parseFloat(row[5]) || 1000,
                approvedActivities: parseInt(row[6]) || 0,
                phrasesLearned: parseInt(row[7]) || 0,
                emoji: emojiMap[id] || '👤',
                color: colorMap[id] || '#666666',
                isParent: id === 'ryan' || id === 'mom'
            }
        })
        return profiles
    },

    parseItinerary(rows) {
        if (!rows || rows.length < 2) return null
        const cityCoords = {
            'florence':                { lat: 43.7696, lng: 11.2558 },
            'rome':                    { lat: 41.9028, lng: 12.4964 },
            'paris':                   { lat: 48.8566, lng:  2.3522 },
            'venice':                  { lat: 45.4408, lng: 12.3155 },
            'milan':                   { lat: 45.4642, lng:  9.1900 },
            'barcelona':               { lat: 41.3851, lng:  2.1734 },
            'amsterdam':               { lat: 52.3676, lng:  4.9041 },
            'london':                  { lat: 51.5074, lng: -0.1278 },
            'frankfurt':               { lat: 50.1109, lng:  8.6821 },
            'iseltwald':               { lat: 46.7167, lng:  7.9667 },
            'basel':                   { lat: 47.5596, lng:  7.5886 },
            'lucerne':                 { lat: 47.0502, lng:  8.3093 },
            'bern':                    { lat: 46.9480, lng:  7.4474 },
            'riomaggiore':             { lat: 44.0961, lng:  9.7378 },
            'noce':                    { lat: 46.3700, lng: 11.0300 },
            'verona':                  { lat: 45.4384, lng: 10.9916 },
            'lucca':                   { lat: 43.8430, lng: 10.5050 },
            'cinque terre':            { lat: 44.1461, lng:  9.6439 },
            'lake garda':              { lat: 45.6500, lng: 10.6333 },
            'dolomites':               { lat: 46.4102, lng: 11.8440 },
            'ortisei':                 { lat: 46.5744, lng: 11.6717 },
            'innbrücke':               { lat: 47.2800, lng: 11.4500 },
            'innsbruck':               { lat: 47.2692, lng: 11.4041 },
            'innbruck':                { lat: 47.2692, lng: 11.4041 },
            'ampass':                  { lat: 47.2667, lng: 11.4667 },
            'train day - kids choice': { lat: 46.0,    lng:  9.0    },
            'portland':                { lat: 45.5051, lng: -122.6750 }
        }
        const countryLanguages = {
            'italy': 'Italian', 'france': 'French', 'spain': 'Spanish',
            'netherlands': 'Dutch', 'uk': 'English', 'england': 'English',
            'germany': 'German', 'switzerland': 'German', 'austria': 'German',
            'switzerland/italy': 'Italian'
        }

        return rows.slice(1).filter(row => row[0]).map((row, index, allRows) => {
            const city = (row[0] || '').trim()
            const country = (row[1] || '').trim()
            const cityLower = city.toLowerCase()
            const isTransfer = cityLower.includes('transfer') || cityLower.includes('kids choice')

            let coords
            if (isTransfer) {
                const prevCity = index > 0 ? allRows[index - 1][0].toLowerCase() : null
                const nextCity = index < allRows.length - 1 ? allRows[index + 1][0].toLowerCase() : null
                const prevCoords = prevCity && cityCoords[prevCity] ? cityCoords[prevCity] : { lat: 48, lng: 8 }
                const nextCoords = nextCity && cityCoords[nextCity] ? cityCoords[nextCity] : { lat: 46, lng: 10 }
                coords = {
                    lat: (prevCoords.lat + nextCoords.lat) / 2,
                    lng: (prevCoords.lng + nextCoords.lng) / 2
                }
            } else {
                coords = cityCoords[cityLower] || { lat: 45, lng: 10 }
                if (!cityCoords[cityLower]) {
                    console.warn(`parseItinerary: no coords for "${city}" — using fallback`)
                }
            }

            return {
                city,
                country,
                startDate: row[2] || '',
                endDate: row[3] || '',
                accommodation: row[4] || 'TBD',
                address: row[5] || '',
                transport: row[6] || '',
                notes: row[7] || '',
                lat: coords.lat,
                lng: coords.lng,
                language: countryLanguages[country.toLowerCase()] || 'English',
                isTransfer
            }
        })
    },

    activityToRow(activity) {
        return [
            activity.id,
            activity.kidName,
            activity.title,
            activity.city,
            activity.description,
            activity.estimatedCost,
            activity.travelMethod,
            activity.travelTime,
            activity.duration,
            activity.otherConsiderations,
            activity.status
                ? activity.status.charAt(0).toUpperCase() + activity.status.slice(1).replace(/-/g, ' ')
                : 'Submitted',
            activity.dateSubmitted,
            activity.parentFeedback || '',
            activity.dateUpdated || activity.dateSubmitted
        ]
    },

    parseBookingItems(rows) {
        if (!rows || rows.length < 2) return []
        return rows.slice(1)
            .filter(row => row[0] && (row[5] || '').toLowerCase() !== 'deleted')
            .map(row => ({
                id: row[0] || '',
                title: row[1] || '',
                city: row[2] || '',
                notes: row[3] || '',
                link: row[4] || '',
                status: row[5] || 'pending',
                dateAdded: row[6] || '',
                dateBooked: row[7] || null,
                activityId: row[8] || '',
                syncedToSheets: true
            }))
    },

    parseSavedIdeas(rows) {
        if (!rows || rows.length < 2) return []
        return rows.slice(1)
            .filter(row => row[0] && (row[9] || '').toLowerCase() !== 'deleted')
            .map(row => ({
                id: row[0] || '',
                kidId: (row[1] || '').toLowerCase(),
                kidName: row[2] || '',
                title: row[3] || '',
                city: row[4] || '',
                notes: row[5] || '',
                estimatedCost: parseFloat(row[6]) || 0,
                dateSaved: row[7] || '',
                dateUpdated: row[8] || '',
                syncedToSheets: true
            }))
    },

    ideaToRow(idea, status = 'active') {
        return [
            idea.id, idea.kidId, idea.kidName, idea.title,
            idea.city || '', idea.notes || '', idea.estimatedCost || 0,
            idea.dateSaved, idea.dateUpdated || idea.dateSaved, status
        ]
    },

    parseJournalEntries(rows) {
        if (!rows || rows.length < 2) return []
        return rows.slice(1).filter(row => row[0]).map(row => ({
            id:         row[0]  || '',
            userId:     row[1]  || '',
            userName:   row[2]  || '',
            city:       row[3]  || '',
            date:       row[4]  || '',
            entryText:  row[5]  || '',
            mood:       row[6]  || '',
            lat:        parseFloat(row[7])  || null,
            lng:        parseFloat(row[8])  || null,
            timestamp:  row[9]  || '',
            heartCount: parseInt(row[10])   || 0,
            // row[11] = heartedBy (existing col, not used in frontend)
            entryType:  row[12] || 'journal',
            photoUrl:   row[13] || ''
        }))
    },

    journalEntryToRow(entry) {
        return [
            entry.id,
            entry.userId,
            entry.userName,
            entry.city,
            entry.date,
            entry.entryText || '',
            entry.mood || '',
            entry.lat || '',
            entry.lng || '',
            entry.timestamp,
            entry.heartCount || 0,
            '',                          // col 11: heartedBy placeholder (unused)
            entry.entryType || 'journal',
            entry.photoUrl  || ''
        ]
    },

    parseComments(rows) {
        if (!rows || rows.length < 2) return []
        return rows.slice(1).filter(row => row[0]).map(row => ({
            id:            row[0] || '',
            entryId:       row[1] || '',
            entryType:     row[2] || 'journal',
            commenterName: row[3] || '',
            commentText:   row[4] || '',
            timestamp:     row[5] || '',
            read:          row[6] || 'N'
        }))
    },

    commentToRow(comment) {
        return [
            comment.id,
            comment.entryId,
            comment.entryType,
            comment.commenterName,
            comment.commentText,
            comment.timestamp,
            comment.read || 'N'
        ]
    },

    parseJournalDigest(rows) {
        if (!rows || rows.length < 2) return []
        return rows.slice(1).filter(row => row[0]).map(row => ({
            date:        row[0] || '',
            story:       row[1] || '',
            generatedAt: row[2] || '',
            generatedBy: row[3] || ''
        }))
    },

    digestToRow(entry) {
        return [entry.date, entry.story, entry.generatedAt, entry.generatedBy || '']
    },

    parsePolls(rows) {
        if (!rows || rows.length < 2) return []
        return rows.slice(1).filter(row => row[0]).map(row => {
            let options = []
            let votes = {}
            try { options = JSON.parse(row[2] || '[]') } catch { options = [] }
            try { votes = JSON.parse(row[3] || '{}') } catch { votes = {} }
            return {
                pollId:    row[0] || '',
                question:  row[1] || '',
                options,
                votes,
                createdBy: row[4] || '',
                createdAt: row[5] || '',
                status:    row[6] || 'open'
            }
        })
    },

    pollToRow(poll) {
        return [
            poll.pollId,
            poll.question,
            JSON.stringify(poll.options || []),
            JSON.stringify(poll.votes || {}),
            poll.createdBy,
            poll.createdAt,
            poll.status || 'open'
        ]
    },

    async findAndUpdateRow(sheetName, id, values) {
        const data = await this.read(sheetName)
        if (!data || data.length < 2) return false
        const rowIndex = data.slice(1).findIndex(row => row[0] === id)
        if (rowIndex === -1) return false
        const sheetRow = rowIndex + 2
        const endCol = String.fromCharCode(64 + values.length)
        await this.update(sheetName, 'A' + sheetRow + ':' + endCol + sheetRow, [values])
        return true
    }
}
