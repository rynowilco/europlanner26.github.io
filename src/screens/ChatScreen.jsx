import React, { useState, useEffect, useRef } from 'react'
import { CONFIG, marked } from '../config'
import { EmailService } from '../emailService'
import { Icon } from '../components/Icon'

const generateSystemPrompt = (user, userId, activities, itinerary) => {
    const userActivities = activities.filter(a => a.kidId === userId && !a.isSample)
    const otherActivities = activities.filter(a => a.kidId !== userId && !a.isSample)
    const tripItinerary = itinerary || CONFIG.itinerary
    const cities = tripItinerary.map(i => i.city).join(', ')
    const isParent = user.isParent || false

    const allKids = ['abby', 'tyler']
    const familyStatus = allKids.map(kidId => {
        const kidProfile = CONFIG.users[kidId]
        const kidActivities = activities.filter(a => a.kidId === kidId && !a.isSample)
        const approved = kidActivities.filter(a => a.status === 'approved').length
        const submitted = kidActivities.filter(a => a.status === 'submitted').length
        const emoji = kidId === 'abby' ? '⚽' : '🏈'
        return emoji + ' ' + (kidProfile?.name || kidId) + ': ' + approved + '/3 approved, ' + submitted + ' pending review'
    }).join('\n')

    const deadlineDate = new Date('2026-05-11')
    const today = new Date()
    const daysToDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24))

    return `You are a friendly travel planning assistant helping ${user.name} (age ${user.age}) plan activities for their family's Europe trip in summer 2026.

## Your Role & Scope
You are a Europe trip planning assistant for Team Wonder & Awe's summer 2026 trip. You help with:
✅ Planning and researching activities, restaurants, and experiences in ${cities}
✅ Train routes, journey times, connections, and booking tips (Trenitalia, SNCF, SBB, Interrail, etc.)
✅ Ferries, buses, taxis, and all other transit between and within cities
✅ Transfer day stops — what to see or do between Point A and Point B
✅ Logistics: costs, timing, what to book in advance, what to wing
✅ Packing, cultural norms, tipping, language basics
✅ Any question about European travel, culture, food, or geography
${isParent ? '✅ Full trip coordination — hotels, timing, budgeting, itinerary review, anything they need\n' : ''}
You do NOT help with:
❌ Homework or academic questions unrelated to the trip
❌ Personal advice with no connection to the trip or travel
${isParent ? '' : '❌ Anything inappropriate for kids\n'}❌ Topics with zero connection to Europe or the trip

## Web Search
You have web search capability. Use it when:
- Asked for specific booking links, current prices, or opening hours
- Recommending a specific restaurant, brewery, or venue (search for their website)
- Asked about something you're not confident about
Always prefer including a direct booking or info link when recommending something specific.

## Train & Transit Research (IMPORTANT)
When asked about trains, ferries, or transit — answer confidently using your training knowledge of European rail and transit. You know:
- Typical journey times and common routes across Italy, France, Switzerland, Germany, and beyond
- Which operators run which routes (Trenitalia, Frecciarossa, SNCF TGV, SBB, Deutsche Bahn, etc.)
- General booking strategy (book Frecciarossa/TGV well in advance, regional trains are fine last-minute)
- Rough ticket price ranges and where to book (Trenitalia.com, SNCF-connect.com, Rome2Rio)
- Connection points, major transfer stations, and what to watch out for

Be upfront that you can't pull live schedules or real-time prices if pressed for exact departure times — but always give your best knowledge FIRST and never deflect or refuse a transit question.

If ${user.name} asks about something genuinely off-topic, redirect warmly:
- "Ha, that's outside my wheelhouse — I'm your Europe trip brain! Want to tackle something trip-related?"

${isParent ? `## Tone & Style (ADULT MODE 🔞)
- ${user.name} is an adult who likes to laugh and doesn't scare easily
- Feel free to curse occasionally, use sexual innuendo, and be irreverent — keep it fun, not cringe
- Dark humor and sarcasm welcome
- Be direct, witty, and treat ${user.name} like a fellow adult making fun happen for their family
- No need to sanitize anything — if a sardine joke wants to come out, let it breathe
` : `## Content Safety (IMPORTANT)
- Keep all conversations appropriate for ${user.age === 11 ? 'an 11-year-old' : 'a 14-year-old'}
- Never discuss violent, scary, or adult content
- Don't ask for or encourage sharing personal information (addresses, passwords, etc.)
- If anything feels off, redirect to trip planning
`}
## Your Style
- Warm, encouraging, genuinely excited about travel
- Use ${user.name}'s name naturally
- ${user.name} likes humor and jokes - be fun and playful!
- ${isParent ? 'Adult humor, cursing, and innuendo are encouraged and welcome' : user.age === 14 ? "Casual teen language is totally fine (\"that's sick\", \"no cap\", \"bro\")" : 'Keep it friendly and fun, but age-appropriate (not babyish)'}
- Be helpful but realistic about constraints

${isParent ? `## Session Pacing (Parent Mode)
- No need to push toward activity submission — parents have full visibility and are coordinating, not proposing
- If they seem to be wrapping up, offer a useful summary or next action: "Want me to flag anything for the booking list, or is there something else to sort out?"
` : `## Session Pacing
- After about 15-20 exchanges, gently suggest wrapping up or submitting an activity idea
- Example: "We've covered a lot! Want to polish up one of these ideas and submit it for your parents to review? Or we can pick this up next time!"
- Encourage breaks: "Nice planning session! Maybe take a break and come back with fresh ideas?"
`}

## Trip Details
${tripItinerary.map(i => `- ${i.city}, ${i.country}: ${i.startDate} to ${i.endDate} (${i.transport})`).join('\n')}

${isParent ? `## Transfer Days
Transfer days are marked "Transfer - Kids Choice" — the kids get to pick a stop between destinations. As a parent, you can:
- Research what's feasible between Point A and Point B given drive/train time
- Suggest stops to discuss with the kids
- Think about logistics: parking, luggage storage, how long a stop is realistic
` : `## TRANSFER DAYS - Kids Choice! 🚂
Some days are marked as "Transfer - Kids Choice" - these are YOUR chance to help shape the trip! On transfer days:
- You're traveling between two destinations and get to pick a cool stop along the way
- Research what cities, towns, or attractions are between Point A and Point B
- Suggest stops based on ${user.name}'s interests
- Think about: museums, food experiences, scenic spots, sports venues, shopping areas, unique attractions
- The stop could be a quick 2-hour visit or a longer half-day adventure
- Parents will handle accommodations, so focus on the fun stuff to see and do!

For example, if traveling Frankfurt → Switzerland, you might discover:
- The Rhine Falls (Europe's largest waterfall!)
- Basel (great chocolate shops, cool architecture)
- Lucerne (beautiful lake, Swiss Transport Museum)

Be proactive about suggesting transfer day discoveries - this is where ${user.name} can really make the trip unique!
`}

## About ${user.name}
- **Interests:** ${user.interests?.join(', ') || 'Not specified'}
- **Preferences:** ${user.preferences || 'Not specified'}

${isParent ? `## Family Planning Status
${familyStatus}
- Deadline for kid activities: May 11, 2026 (${daysToDeadline} days away)
- All submitted activities need parent approval before the deadline
- You can approve or give feedback on activities in the Dashboard
` : `## ${user.name}'s Planning Status
- Activities approved: ${userActivities.filter(a => a.status === 'approved').length}/3 required
- Deadline: 3 activities need parent approval by May 11, 2026
`}

## Activity Guidelines
- Guide toward creative, outdoorsy, off-the-beaten-path activities (touristy is OK too)
- **CITY FIELD RULE (IMPORTANT):** In the [SUBMIT_ACTIVITY] City field, always use the exact city name from the trip itinerary (e.g. "Basel", "Florence", "Rome"). Never append qualifiers like "(Transfer Day)", "- Day Trip", "Near", etc. If an activity is near a city or part of a transfer day, still use just the plain city name so it shows up correctly on the trip map.
- Budget guideline: ~€100 per activity (flexible)  
- When discussing costs, mention both euros and USD (~€1 = $1.08)
- Include meals and transport in cost estimates
${isParent ? '- You have full visibility across all family activities. Help think through budget, logistics, and sequencing across the whole trip.' : userId === 'abby' ? '- Remember: Abby wants to AVOID really long hikes and long car rides. She is good for a few hours of walking. She loves shopping, food experiences, and trying new activities she has never done.' : userId === 'tyler' ? '- Remember: Tyler wants to AVOID long car rides. He prefers shorter walks with breaks. He loves trying new foods, sports, and learning about new places. He wants family bonding time.' : ''}

${isParent ? `## All Family Activities
${activities.filter(a => !a.isSample).length > 0
    ? activities.filter(a => !a.isSample).map(a => '- ' + a.kidName + ': "' + a.title + '" in ' + a.city + ' (' + a.status + ')').join('\n')
    : 'No activities submitted yet'}
` : `## ${user.name}'s Activities So Far
${userActivities.length > 0 ? userActivities.map(a => '- "' + a.title + '" in ' + a.city + ' (' + a.status + ')').join('\n') : 'None yet - fresh start!'}

## What the Rest of the Family Is Planning
${otherActivities.length > 0 ? otherActivities.map(a => '- "' + a.title + '" in ' + a.city + ' (' + a.status + ')').join('\n') : 'Nothing submitted yet'}
(Suggest combining activities if there's overlap - family bonding matters!)
`}

## Conflict Detection
Before suggesting or submitting an activity, check for potential conflicts:
- **SCHEDULING:** Is there already an activity submitted or approved for the same city? Flag it if so.
- **LOGISTICS:** Does this require advance booking and the trip is coming up fast? Is travel time over 2 hours?
- **DUPLICATION:** Has anyone in the family already planned something very similar?

If you detect a conflict, mention it naturally and briefly in conversation first — don't make it a big deal:
"Quick heads up — Tyler already has something in Florence that week. Might be worth coordinating, but still a great idea!"

Then when submitting, add a ConflictNote field to the block if relevant:

[SUBMIT_ACTIVITY]
Title: ...
City: ...
Description: ...
Cost: ...
Travel Method: ...
Travel Time: ...
Duration: ...
Considerations: ...
ConflictNote: Potential scheduling overlap with Tyler's Florence activity. Parents should review.
[/SUBMIT_ACTIVITY]

ConflictNote is optional — only include it when there's a genuine concern. Keep it under 20 words.

## Language Learning
Naturally weave in useful German (Switzerland/Austria), Italian (Italy), or French phrases. The whole family is interested in learning languages!

## Booking List
When you mention something that requires advance booking or purchasing tickets — trains between cities, operas, cooking classes, tours, ferries, skip-the-line tickets, restaurants that need reservations, etc. — output this block:

[ADD_BOOKING]
Title: (what needs to be booked)
City: (where)
Notes: (why it needs advance booking, best timing to book)
Link: (direct booking URL if you know it — search for it if needed)
[/ADD_BOOKING]

This silently adds it to Mom's booking checklist. Don't make a big deal of it — just a brief mention: "I've added that to the booking list!" is fine. Only output this block once per item.

## SAVING IDEAS FOR LATER
When discussing an idea that ${user.name} seems interested in but isn't ready to submit yet, PROACTIVELY offer to save it:
- "That sounds cool! Want me to save this idea for later, or are you ready to submit it for your parents to review?"
- "Nice find! Should I bookmark this so you can think about it more?"

When ${user.name} wants to save an idea (says "save it", "bookmark that", "save for later", etc.), output this block:

[SAVE_IDEA]
Title: (short catchy name)
City: (location)
Notes: (key details, why it's interesting, rough cost estimate if known)
Cost: (estimated euros, just the number, or 0 if unknown)
[/SAVE_IDEA]

After saving, confirm: "Got it! I saved that to your ideas list. You can check it out later in the Dashboard, or we can keep exploring!"

## SUBMITTING ACTIVITIES (CRITICAL - READ CAREFULLY!)
When ${user.name} describes an activity they want to do and provides enough details (or when you have enough info to fill in reasonable defaults), you MUST output the submission block. DO NOT just describe the activity - you must OUTPUT THE BLOCK for it to be saved!

Trigger phrases that mean "submit this":
- "I want to submit..."
- "Let's do this one"
- "Submit this activity"
- "Add this to my list"
- "I want to do this"
- "Book this" / "Plan this"
- Any clear indication they've decided on an activity

When submitting, output this EXACT format (the app parses this automatically):

[SUBMIT_ACTIVITY]
Title: (activity name)
City: (city or stop name - can be a transfer day stop too!)
Description: (2-3 sentence description)
Cost: (number in euros, just the number like 65, not €65)
Travel Method: (how to get there - Walking, Train, Bus, etc.)
Travel Time: (e.g., "20 minutes")
Duration: (e.g., "2 hours")
Considerations: (booking requirements, what to bring, best timing, etc.)
[/SUBMIT_ACTIVITY]

IMPORTANT: 
- The [SUBMIT_ACTIVITY] and [/SUBMIT_ACTIVITY] tags MUST be on their own lines
- Fill in ALL fields, even if you need to make reasonable estimates
- After the block, confirm: "I've submitted that for your parents to review!"

Keep it fun and focused on making this Europe trip amazing! 🎉`
}

const callClaudeAPI = async (messages, systemPrompt) => {
    try {
        const response = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CONFIG.CLAUDE_MODEL,
                max_tokens: 1024,
                system: systemPrompt,
                messages: messages.map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text }))
            })
        })

        if (!response.ok) {
            let errorDetail = ''
            try {
                const errorData = await response.json()
                errorDetail = JSON.stringify(errorData)
                console.error('API Error Details:', errorData)
            } catch (e) {
                errorDetail = await response.text()
            }
            throw new Error(`API error ${response.status}: ${errorDetail}`)
        }

        const data = await response.json()

        console.log('API response stop_reason:', data.stop_reason)
        console.log('API response content types:', data.content?.map(b => b.type))

        if (!data || !data.content || !Array.isArray(data.content)) {
            console.error('Unexpected API response structure:', JSON.stringify(data))
            const msg = data?.error?.message || data?.message || JSON.stringify(data)
            return `Something went wrong with the AI connection: ${msg}`
        }

        const textBlocks = data.content.filter(block => block.type === 'text')

        if (textBlocks.length === 0) {
            console.error('No text blocks in response. Full content:', JSON.stringify(data.content))
            return `I got a response but couldn't read it (no text blocks). Check the browser console for details.`
        }

        return textBlocks.map(block => block.text).join('')

    } catch (error) {
        console.error('Claude API error:', error)
        if (error.message.includes('401')) {
            return `Authentication issue with the AI. (Error: 401 Unauthorized)`
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return `Can't reach the AI right now. Check your internet connection and try again.`
        }
        return `Connection error: ${error.message}`
    }
}

const ChatMessage = ({ message, isUser, isTyping }) => (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 'var(--space-md)', animation: 'slideIn 0.3s ease-out' }}>
        <div style={{ maxWidth: '85%', padding: 'var(--space-md)', borderRadius: isUser ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)', background: isUser ? 'var(--color-navy)' : 'white', color: isUser ? 'white' : 'var(--color-text)', boxShadow: 'var(--shadow-sm)', fontSize: '1rem', lineHeight: 1.5 }}>
            {isTyping ? (
                <div style={{ display: 'flex', gap: '4px', padding: '4px 8px' }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-text-light)', animation: `pulse 1s ease-in-out ${i * 0.15}s infinite` }} />)}
                </div>
            ) : (
                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(message || '') }} />
            )}
        </div>
    </div>
)

export const ChatScreen = ({ userId, user, onBack, onOpenDashboard, onOpenMap, store }) => {
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [started, setStarted] = useState(false)
    const [sessionActivities, setSessionActivities] = useState([])
    const [showResumePrompt, setShowResumePrompt] = useState(false)
    const [previousSummary, setPreviousSummary] = useState(null)
    const [pendingActivity, setPendingActivity] = useState(null)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const messagesEndRef = useRef(null)
    const idleTimerRef = useRef(null)

    const messagesRef = useRef(messages)
    const sessionActivitiesRef = useRef(sessionActivities)
    useEffect(() => { messagesRef.current = messages }, [messages])
    useEffect(() => { sessionActivitiesRef.current = sessionActivities }, [sessionActivities])

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, pendingActivity])

    const resetIdleTimer = () => {
        store.updateLastActivity(userId)
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        idleTimerRef.current = setTimeout(() => {
            saveSessionToSheets('idle')
        }, 15 * 60 * 1000)
    }

    const saveSessionToSheets = (reason) => {
        const currentMessages = messagesRef.current
        const currentActivities = sessionActivitiesRef.current
        const userMessages = currentMessages.filter(m => m.isUser)
        if (userMessages.length === 0) return

        const topics = userMessages.map(m => m.text).slice(-5)
        const activitiesSubmitted = currentActivities.map(a => `${a.title} in ${a.city}`)
        const recentContext = currentMessages.slice(-4).map(m =>
            m.isUser ? `You asked: "${m.text.substring(0, 100)}${m.text.length > 100 ? '...' : ''}"`
                     : `We discussed: "${m.text.substring(0, 100)}${m.text.length > 100 ? '...' : ''}"`
        )

        const summary = { topics, activitiesSubmitted, recentContext, messageCount: currentMessages.length }
        store.saveSessionSummary(userId, summary)
        store.saveConversationSummaryToSheets(userId, {
            topics: `[${reason}] ` + topics.join(', '),
            ideas: activitiesSubmitted.join(', '),
            notes: recentContext.join(' | ')
        }).catch(err => console.log('Sheets save error:', err))
    }

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                saveSessionToSheets('visibility-hidden')
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
            saveSessionToSheets('unmount')
        }
    }, [])

    const sendActivityEmail = async (activity) => {
        await EmailService.sendDigestToBothParents(
            user.name,
            `Submitted a new activity for review!`,
            `• ${activity.title} in ${activity.city} (€${activity.estimatedCost})\n\n${activity.description}`
        )
    }

    const generateSessionSummary = () => {
        const userMessages = messagesRef.current.filter(m => m.isUser)
        if (userMessages.length === 0) return null
        const topics = userMessages.map(m => m.text).slice(-5)
        const activitiesSubmitted = sessionActivitiesRef.current.map(a => `${a.title} in ${a.city}`)
        const recentContext = messagesRef.current.slice(-4).map(m =>
            m.isUser ? `You asked: "${m.text.substring(0, 100)}${m.text.length > 100 ? '...' : ''}"`
                     : `We discussed: "${m.text.substring(0, 100)}${m.text.length > 100 ? '...' : ''}"`
        )
        return { topics, activitiesSubmitted, recentContext, messageCount: messagesRef.current.length }
    }

    const handleSessionEnd = (reason) => {
        saveSessionToSheets(reason)

        const summary = generateSessionSummary()
        if (summary) {
            const topicsText = summary.topics.join('\n• ')
            const activitiesText = summary.activitiesSubmitted.length > 0
                ? summary.activitiesSubmitted.map(a => `• ${a}`).join('\n')
                : 'No new activities submitted this session'
            EmailService.sendDigestToBothParents(
                user.name,
                `Topics discussed:\n• ${topicsText}`,
                activitiesText
            ).catch(err => console.log('Email send error:', err))
        }

        if (reason === 'back') onBack()
    }

    const handleBack = () => { handleSessionEnd('back') }

    const handleResume = () => {
        setShowResumePrompt(false)
        store.clearSessionSummary(userId)

        const summaryText = previousSummary.recentContext.join('\n')
        const resumeMsg = { id: Date.now(), text: `Last time we chatted, here's what we covered:\n\n${summaryText}\n\nWant to pick up where we left off, or explore something new?`, isUser: false }
        setMessages([resumeMsg])
        resetIdleTimer()
    }

    const handleStartFresh = () => {
        setShowResumePrompt(false)
        store.clearSessionSummary(userId)

        const cities = (store.itinerary || CONFIG.itinerary).map(i => i.city).join(', ')
        const freshMsg = { id: Date.now(), text: `Hey ${user.name}! 👋 Fresh start! Ready to plan some adventures for Europe?\n\nWe can explore ideas for ${cities}. What sounds fun to you?`, isUser: false }
        setMessages([freshMsg])
        resetIdleTimer()
    }

    useEffect(() => {
        if (!started) {
            setStarted(true)

            const existingSummary = store.getSessionSummary(userId)
            const sessionExpired = store.isSessionExpired(userId)

            const needsRevision = store.activities.filter(a =>
                a.kidId === userId && a.status === 'needs-revision' && !a.isSample
            )

            const refiningIdea = store.refiningIdea

            setIsLoading(true)
            setTimeout(async () => {
                const cities = (store.itinerary || CONFIG.itinerary).map(i => i.city).join(', ')

                if (refiningIdea && refiningIdea.kidId === userId) {
                    const ideaDetails = refiningIdea.notes ? `\n\nHere's what we had:\n• **${refiningIdea.title}** in ${refiningIdea.city}\n• Notes: ${refiningIdea.notes}${refiningIdea.estimatedCost ? `\n• Estimated cost: ~€${refiningIdea.estimatedCost}` : ''}` : ''
                    const greeting = `Hey ${user.name}! 👋 You wanted to revisit your saved idea for **${refiningIdea.title}**.${ideaDetails}\n\nWhat would you like to explore or change about this idea? We can dig into more details, adjust the plan, or get it ready to submit!`
                    const msg = { id: Date.now(), text: greeting, isUser: false }
                    setMessages([msg])
                    store.clearSessionSummary(userId)
                    store.setRefiningIdea(null)
                } else if (needsRevision.length > 0) {
                    const feedbackItems = needsRevision.map(a =>
                        `**${a.title}**: "${a.parentFeedback}"`
                    ).join('\n\n')
                    const greeting = `Hey ${user.name}! 👋 Quick heads up - your parents left some feedback on ${needsRevision.length === 1 ? 'an activity' : 'some activities'}:\n\n${feedbackItems}\n\nWant to work on revising ${needsRevision.length === 1 ? 'it' : 'one of them'}, or explore something new?`
                    const msg = { id: Date.now(), text: greeting, isUser: false }
                    setMessages([msg])
                    store.clearSessionSummary(userId)
                } else if (user.isParent) {
                    store.clearSessionSummary(userId)
                    const allActivities = store.activities.filter(a => !a.isSample)
                    const abbyApproved = allActivities.filter(a => a.kidId === 'abby' && a.status === 'approved').length
                    const abbyPending = allActivities.filter(a => a.kidId === 'abby' && a.status === 'submitted').length
                    const tylerApproved = allActivities.filter(a => a.kidId === 'tyler' && a.status === 'approved').length
                    const tylerPending = allActivities.filter(a => a.kidId === 'tyler' && a.status === 'submitted').length
                    const deadlineDays = Math.ceil((new Date('2026-05-11') - new Date()) / (1000 * 60 * 60 * 24))

                    const statusLines = [
                        '⚽ **Abby:** ' + abbyApproved + '/3 approved' + (abbyPending > 0 ? ', ' + abbyPending + ' waiting on you' : ' ✓'),
                        '🏈 **Tyler:** ' + tylerApproved + '/3 approved' + (tylerPending > 0 ? ', ' + tylerPending + ' waiting on you' : ' ✓'),
                        '📅 **Deadline:** May 11 (' + deadlineDays + ' days away)'
                    ].join('\n')

                    const greeting = 'Hey ' + user.name + '! 👋 Here\'s where things stand:\n\n' + statusLines + '\n\nWhat do you want to work on? I can help with logistics, train routes, reviewing submitted activities, the booking list — whatever\'s on your mind.'
                    const msg = { id: Date.now(), text: greeting, isUser: false }
                    setMessages([msg])
                } else if (existingSummary) {
                    setPreviousSummary(existingSummary.summary)
                    setShowResumePrompt(true)
                } else {
                    const greeting = 'Hey ' + user.name + '! 👋 Ready to plan some adventures for Europe?\n\nWe can explore ideas for ' + cities + '. What sounds fun to you?'
                    const msg = { id: Date.now(), text: greeting, isUser: false }
                    setMessages([msg])
                }

                setIsLoading(false)
                resetIdleTimer()
            }, 500)
        }
    }, [started, userId, user.name, store])

    const parseActivitySubmission = (text) => {
        const match = text.match(/\[SUBMIT_ACTIVITY\]([\s\S]*?)\[\/SUBMIT_ACTIVITY\]/)
        if (!match) return null
        const content = match[1]
        const getValue = (field) => {
            const regex = new RegExp(`${field}:\\s*(.+?)(?:\\n|$)`, 'i')
            const m = content.match(regex)
            return m ? m[1].trim() : ''
        }
        return {
            title: getValue('Title'),
            city: getValue('City'),
            description: getValue('Description'),
            estimatedCost: parseFloat(getValue('Cost')) || 0,
            travelMethod: getValue('Travel Method'),
            travelTime: getValue('Travel Time'),
            duration: getValue('Duration'),
            otherConsiderations: getValue('Considerations'),
            conflictNote: getValue('ConflictNote') || null
        }
    }

    const parseIdeaSave = (text) => {
        const match = text.match(/\[SAVE_IDEA\]([\s\S]*?)\[\/SAVE_IDEA\]/)
        if (!match) return null
        const content = match[1]
        const getValue = (field) => {
            const regex = new RegExp(`${field}:\\s*(.+?)(?:\\n|$)`, 'i')
            const m = content.match(regex)
            return m ? m[1].trim() : ''
        }
        return {
            title: getValue('Title'),
            city: getValue('City'),
            notes: getValue('Notes'),
            estimatedCost: parseFloat(getValue('Cost')) || 0
        }
    }

    const parseBookingSave = (text) => {
        const match = text.match(/\[ADD_BOOKING\]([\s\S]*?)\[\/ADD_BOOKING\]/)
        if (!match) return null
        const content = match[1]
        const getValue = (field) => {
            const regex = new RegExp(field + ':\\s*(.+?)(?:\\n|$)', 'i')
            const m = content.match(regex)
            return m ? m[1].trim() : ''
        }
        return {
            title: getValue('Title'),
            city: getValue('City'),
            notes: getValue('Notes'),
            link: getValue('Link') || null
        }
    }

    const cleanResponseForDisplay = (text) => {
        return text
            .replace(/\[SUBMIT_ACTIVITY\][\s\S]*?\[\/SUBMIT_ACTIVITY\]/g, '')
            .replace(/\[SAVE_IDEA\][\s\S]*?\[\/SAVE_IDEA\]/g, '')
            .replace(/\[ADD_BOOKING\][\s\S]*?\[\/ADD_BOOKING\]/g, '')
            .trim()
    }

    const sendMessage = async (overrideText) => {
        const text = typeof overrideText === 'string' ? overrideText : inputValue
        if (!text.trim() || isLoading) return
        resetIdleTimer()

        const userMsg = { id: Date.now(), text: text.trim(), isUser: true }
        setMessages(prev => [...prev, userMsg])
        setInputValue('')
        setIsLoading(true)

        const systemPrompt = generateSystemPrompt(user, userId, store.activities, store.itinerary)
        const response = await callClaudeAPI([...messages, userMsg], systemPrompt)

        if (!response) {
            console.error('callClaudeAPI returned null/undefined')
            setMessages(prev => [...prev, { id: Date.now() + 1, text: 'Sorry, something went wrong. Please try again.', isUser: false }])
            setIsLoading(false)
            return
        }

        const activityData = parseActivitySubmission(response)
        if (activityData && activityData.title) {
            console.log('Activity detected - showing confirmation:', activityData.title)
            setPendingActivity({ ...activityData, kidId: userId, kidName: user.name })
        }

        const ideaData = parseIdeaSave(response)
        if (ideaData && ideaData.title) {
            console.log('Idea detected - saving:', ideaData.title)
            store.addSavedIdea({ ...ideaData, kidId: userId, kidName: user.name })
        }

        const bookingData = parseBookingSave(response)
        if (bookingData && bookingData.title) {
            console.log('Booking item detected - saving:', bookingData.title)
            store.addBookingItem(bookingData)
        }

        const displayResponse = cleanResponseForDisplay(response)
        const assistantMsg = { id: Date.now() + 1, text: displayResponse, isUser: false }
        setMessages(prev => [...prev, assistantMsg])
        setIsLoading(false)
    }

    const handleConfirmActivity = async () => {
        if (!pendingActivity) return
        console.log('✅ User confirmed activity submission:', pendingActivity.title)
        const newActivity = await store.addActivity(pendingActivity)
        console.log('Activity submitted:', newActivity)
        setSessionActivities(prev => [...prev, newActivity])
        await sendActivityEmail(newActivity)
        setPendingActivity(null)
        const confirmMsg = {
            id: Date.now(),
            text: `✅ **${newActivity.title}** has been submitted for parent review! You can check its status in the Dashboard.`,
            isUser: false
        }
        setMessages(prev => [...prev, confirmMsg])
    }

    const handleKeepPlanning = () => {
        console.log('User chose to keep planning, dismissing confirmation card')
        setPendingActivity(null)
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-cream)' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', paddingTop: 'calc(var(--space-sm) + env(safe-area-inset-top, 0px))', background: 'white', borderBottom: '1px solid var(--color-border)', minHeight: '60px' }}>
                <button onClick={handleBack} style={{ background: 'var(--color-cream)', border: '1px solid var(--color-border)', padding: '8px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', minHeight: '40px' }}>
                    <Icon name="ArrowLeft" size={20} />
                </button>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{user.emoji}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{user.name}'s Planning</div>
                </div>
                <button onClick={onOpenMap} style={{ background: 'var(--color-cream)', border: '1px solid var(--color-border)', padding: '8px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', minHeight: '40px' }}>
                    <Icon name="Map" size={20} />
                </button>
                <button onClick={onOpenDashboard} style={{ background: 'var(--color-cream)', border: '1px solid var(--color-border)', padding: '8px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', minHeight: '40px' }}>
                    <Icon name="List" size={20} />
                </button>
            </header>

            {/* Resume prompt overlay */}
            {showResumePrompt && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)', background: 'var(--color-cream)' }}>
                    <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', maxWidth: '400px', width: '100%', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>👋</div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Welcome back, {user.name}!</h2>
                        <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--space-lg)', fontSize: '0.95rem' }}>
                            You had a planning session on {previousSummary?.date || 'recently'}. Want to pick up where you left off?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            <button onClick={handleResume} style={{ padding: 'var(--space-md)', background: user.color, color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 }}>
                                Continue where I left off
                            </button>
                            <button onClick={handleStartFresh} style={{ padding: 'var(--space-md)', background: 'var(--color-cream)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 }}>
                                Start fresh
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Regular chat view */}
            {!showResumePrompt && (
                <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
                        {messages.map(msg => <ChatMessage key={msg.id} message={msg.text} isUser={msg.isUser} />)}
                        {isLoading && <ChatMessage isTyping />}

                        {/* Activity Confirmation Card */}
                        {pendingActivity && (
                            <div style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginTop: 'var(--space-md)', border: '2px solid var(--color-success)', boxShadow: 'var(--shadow-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-success)' }}>Ready to Submit?</h3>
                                </div>
                                <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>{pendingActivity.title}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: 'var(--space-sm)' }}>📍 {pendingActivity.city}</p>
                                    <p style={{ fontSize: '0.9rem', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>{pendingActivity.description}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Icon name="DollarSign" size={14} /> €{pendingActivity.estimatedCost} (~${(pendingActivity.estimatedCost * CONFIG.softParams.eurToUsdRate).toFixed(0)})
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Icon name="Clock" size={14} /> {pendingActivity.duration}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Icon name="MapPin" size={14} /> {pendingActivity.travelMethod} ({pendingActivity.travelTime})
                                        </span>
                                    </div>
                                    {pendingActivity.otherConsiderations && (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: 'var(--space-sm)', fontStyle: 'italic' }}>
                                            💡 {pendingActivity.otherConsiderations}
                                        </p>
                                    )}
                                    {pendingActivity.conflictNote && (
                                        <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)', background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                                            <p style={{ fontSize: '0.85rem', color: '#E65100', margin: 0, lineHeight: 1.4 }}>{pendingActivity.conflictNote}</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <button onClick={handleConfirmActivity} style={{ flex: 1, padding: 'var(--space-md)', background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}>
                                        <Icon name="Send" size={18} /> Submit for Review
                                    </button>
                                    <button onClick={handleKeepPlanning} style={{ flex: 1, padding: 'var(--space-md)', background: 'white', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)' }}>
                                        Keep Planning
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: 'var(--space-md)', paddingBottom: 'calc(var(--space-md) + env(safe-area-inset-bottom, 0px))', background: 'white', borderTop: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} placeholder="Tell me what you're thinking..." rows={1} style={{ flex: 1, padding: 'var(--space-md)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontSize: '1rem', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', minHeight: '48px', maxHeight: '120px' }} onFocus={(e) => e.target.style.borderColor = user.color} onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'} disabled={!!pendingActivity} />
                            <button onClick={sendMessage} disabled={!inputValue.trim() || isLoading || !!pendingActivity} style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', border: 'none', background: inputValue.trim() && !pendingActivity ? user.color : 'var(--color-tan)', color: inputValue.trim() ? 'white' : 'var(--color-text-light)', cursor: inputValue.trim() && !isLoading && !pendingActivity ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="Send" size={20} />
                            </button>
                        </div>
                        {/* Collapsible suggestions */}
                        <div style={{ marginTop: 'var(--space-sm)' }}>
                            <button
                                onClick={() => setShowSuggestions(s => !s)}
                                disabled={!!pendingActivity || isLoading}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', background: showSuggestions ? 'var(--color-navy)' : 'var(--color-cream)', color: showSuggestions ? 'white' : 'var(--color-text-light)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 500, cursor: (pendingActivity || isLoading) ? 'not-allowed' : 'pointer', opacity: (pendingActivity || isLoading) ? 0.5 : 1, transition: 'all 0.15s' }}
                            >
                                💡 Suggestions {showSuggestions ? '▴' : '▾'}
                            </button>
                            {showSuggestions && (
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', overflowX: 'auto', paddingBottom: '4px' }}>
                        {/* PLACEHOLDER_CHIPS */}
                                    {(user.isParent ? [
                                        { label: 'Family Status', icon: 'Users', prompt: 'Give me a full family status update — what activities have been submitted and approved for each kid, who still needs more, and what needs my attention.' },
                                        { label: "What's the Plan", icon: 'Calendar', prompt: "Walk me through the full trip plan — cities, dates, transfer days, and anything notable we need to prepare for." },
                                        { label: 'All Activities', icon: 'List', prompt: 'Show me all submitted and approved activities across the whole family.' },
                                        { label: 'Trip Logistics', icon: 'Map', prompt: 'Help me think through the logistics of this trip — trains between cities, what needs booking in advance, transfer day plans, and anything I might be missing.' },
                                        { label: 'Booking List', icon: 'Book', prompt: 'What things do we still need to book or reserve for this trip? Check what has already been flagged and suggest anything else I should be thinking about.' },
                                        { label: "What's the Story", icon: 'BookOpen', prompt: "Tell me the story of our trip so far — what are we doing, what's been proposed, what are we most excited about? Give it to me as a fun narrative, not a list." }
                                    ] : [
                                        { label: 'Give me Ideas', icon: 'Sparkles', prompt: 'Give me some activity ideas for this trip based on my interests!' },
                                        { label: "What's the Plan", icon: 'Calendar', prompt: "What's the full trip plan? Walk me through the cities, transfer days, and dates." },
                                        { label: 'My Activities', icon: 'List', prompt: 'Show me all the activities I have submitted or that have been approved so far.' },
                                        { label: 'All Activities', icon: 'Users', prompt: 'Show me all approved activities for the whole family so I can see what everyone is doing and avoid conflicts.' },
                                        { label: "What's the Story", icon: 'BookOpen', prompt: "Tell me the story of our trip so far — what are we doing, what's been proposed, what are we most excited about? Give it to me as a fun narrative, not a list." },
                                        { label: 'Trip Logistics', icon: 'Map', prompt: 'Help me think through how we get between cities — trains, travel times, what to book in advance.' }
                                    ]).map(({ label, icon, prompt }, i) => (
                                        <button key={i} onClick={() => { setShowSuggestions(false); sendMessage(prompt) }} disabled={!!pendingActivity || isLoading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: 'var(--space-sm) var(--space-md)', background: 'var(--color-cream)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', whiteSpace: 'nowrap', cursor: (pendingActivity || isLoading) ? 'not-allowed' : 'pointer', opacity: (pendingActivity || isLoading) ? 0.5 : 1 }}>
                                            <Icon name={icon} size={14} /> {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
