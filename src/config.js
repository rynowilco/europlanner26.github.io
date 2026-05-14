import { marked, Renderer } from 'marked'

// Configure marked.js to open all links in a new tab
const renderer = new Renderer()
renderer.link = (href, title, text) => {
    const titleAttr = title ? ` title="${title}"` : ''
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`
}
marked.setOptions({ renderer })

export { marked }

export const CONFIG = {
    CLAUDE_MODEL: 'claude-sonnet-4-20250514',

    GOOGLE_API_KEY: 'AIzaSyDcsv7an4O4p2XsaE-Dk6kHs3bmesTckfk',
    SPREADSHEET_ID: '12ca-wAeLKrmfgdJQmxKjRFNAvptjdnJCobSkm1wk838',
    SHEET_NAMES: {
        itinerary: 'Itinerary',
        userProfiles: 'User Profiles',
        activities: 'Activity Proposals',
        conversations: 'Conversation Memory',
        phrases: 'Language Phrases',
        params: 'Soft Parameters',
        bookingList: 'Booking List',
        savedIdeas: 'Saved Ideas',
        journal: 'Journal',
        photos: 'Photos',
        messages: 'Messages',
        comments: 'Comments',
        journalDigest: 'Journal Digest',
        polls: 'Polls',
        euroLedger: 'Euro Ledger'
    },

    // Euro earning rates — Session 16
    EURO_RATES: {
        journalEntry: 1.00,      // per entry (min 100 words)
        photoUpload: 0.10,       // per photo uploaded
        photoDailyCap: 3.00,     // max photo earnings per day per kid
        postcard: 1.00,          // per postcard sent (wired when Postcards feature ships)
        postcardDailyCap: 3.00,  // max postcard earnings per day per kid
    },

    EMAILJS_SERVICE_ID: 'service_3uu6sr7',
    EMAILJS_TEMPLATE_ID: 'template_q5foa71',
    EMAILJS_PUBLIC_KEY: 'vp0WzqrRRXnzh_y58',
    JOURNAL_MODE_DATE: '2026-06-06',
    SLIDESHOW_MUSIC_URL: null, // Set to a hosted audio URL (MP3/OGG) to enable music in the slideshow
    PARENT_EMAILS: ['katieheindel@gmail.com', 'talentonian@gmail.com'],

    users: {
        abby: {
            name: 'Abby',
            age: 11,
            emoji: '⚽',
            color: '#D64F8A',
            interests: ['trying new foods', 'shopping', 'learning languages', 'swimming', 'culture', 'sports', 'baking', 'fashion', 'makeup & skincare'],
            preferences: 'Likes humor and jokes. Good for a few hours of walking. Sticks to familiar foods but wants to try cool food spots. Wants to avoid: long car rides, really long hikes. Perfect day: finding cool food spots, shopping, trying a new activity she has never done before.',
            budgetTotal: 1000,
            budgetRemaining: 1000,
            approvedActivities: 0,
            phrasesLearned: 0
        },
        tyler: {
            name: 'Tyler',
            age: 14,
            emoji: '🏈',
            color: '#C0392B',
            interests: ['seeing the world', 'food', 'human interaction', 'playing sports', 'learning on Duolingo', 'family bonding'],
            preferences: "Likes humor and jokes. Will try almost anything food-wise! Prefers shorter walks with breaks. Wants to avoid: long car rides. Perfect day: bonding with family, learning about a new place. Fun fact he knows: you don't tip in Europe.",
            budgetTotal: 1000,
            budgetRemaining: 1000,
            approvedActivities: 0,
            phrasesLearned: 0
        },
        ryan: {
            name: 'Ryan',
            age: 50,
            emoji: '👨‍🍳',
            color: '#2E6DA4',
            interests: ['seafood', 'sardines', 'fresh fish markets', 'hiking', 'cultural experiences', 'local food scenes', 'family bonding'],
            preferences: 'Loves a good laugh and dark humor. Obsessed with seafood — especially sardines, anchovies, and anything from the sea. Into hiking and soaking up local culture. Wants the family to have an epic, memorable trip. Adult — no need to tone anything down.',
            budgetTotal: 1000,
            budgetRemaining: 1000,
            approvedActivities: 0,
            phrasesLearned: 0,
            isParent: true
        },
        mom: {
            name: 'Mom',
            age: 48,
            emoji: '🧜‍♀️',
            color: '#2E8B57',
            interests: ['swimming', 'water activities', 'aquatic adventures', 'hiking', 'cultural experiences', 'local markets', 'family bonding'],
            preferences: 'Fun, loves to laugh, not easily offended. Obsessed with any water activity — swimming, lakes, rivers, waterfalls, coastal towns, you name it. Also loves hiking and cultural experiences. Adult — keep it real and fun.',
            budgetTotal: 1000,
            budgetRemaining: 1000,
            approvedActivities: 0,
            phrasesLearned: 0,
            isParent: true
        }
    },

    parentEmails: ['katieheindel@gmail.com', 'talentonian@gmail.com'],
    adminPassword: 'sardine',
    softParams: {
        maxTravelTimeMinutes: 120,
        perActivityBudgetGuideline: 100,
        activityDeadline: '2026-05-11',
        requiredActivitiesPerKid: 3,
        eurToUsdRate: 1.08
    },

    itinerary: [
        { city: 'Portland', country: 'USA', startDate: '2026-04-01', endDate: '2026-06-13', lat: 45.5051, lng: -122.6750, language: 'English' }, // TEMP - remove before trip
        { city: 'Frankfurt',              country: 'Germany',       startDate: '2026-06-14', endDate: '2026-06-14', lat: 50.1109, lng:  8.6821, language: 'German'  },
        { city: 'Basel',                  country: 'Switzerland',   startDate: '2026-06-14', endDate: '2026-06-16', lat: 47.5596, lng:  7.5886, language: 'German'  },
        { city: 'Iseltwald',              country: 'Switzerland',   startDate: '2026-06-16', endDate: '2026-06-19', lat: 46.7114, lng:  7.9839, language: 'German'  },
        { city: 'Milan',                  country: 'Italy',         startDate: '2026-06-19', endDate: '2026-06-20', lat: 45.4642, lng:  9.1900, language: 'Italian' },
        { city: 'Riomaggiore',            country: 'Italy',         startDate: '2026-06-20', endDate: '2026-06-23', lat: 44.0987, lng:  9.7370, language: 'Italian' },
        { city: 'Lucca',                  country: 'Italy',         startDate: '2026-06-23', endDate: '2026-06-24', lat: 43.8430, lng: 10.5050, language: 'Italian' },
        { city: 'Noce',                   country: 'Italy',         startDate: '2026-06-24', endDate: '2026-06-27', lat: 46.3700, lng: 11.0300, language: 'Italian' },
        { city: 'Verona',                 country: 'Italy',         startDate: '2026-06-27', endDate: '2026-06-28', lat: 45.4384, lng: 10.9916, language: 'Italian' },
        { city: 'TBD',                    country: 'Italy',         startDate: '2026-06-28', endDate: '2026-07-01', lat: 45.5000, lng: 11.5000, language: 'Italian' },
        { city: 'Dolomites',              country: 'Italy',         startDate: '2026-07-01', endDate: '2026-07-04', lat: 46.4102, lng: 11.8440, language: 'Italian' },
        { city: 'Transfer - Kids Choice', country: 'Italy/Austria', startDate: '2026-07-04', endDate: '2026-07-05', lat: 47.0011, lng: 11.5000, isTransfer: true, language: 'German' },
        { city: 'Innsbruck',              country: 'Austria',       startDate: '2026-07-05', endDate: '2026-07-07', lat: 47.2692, lng: 11.4041, language: 'German'  },
        { city: 'Transfer - Kids Choice', country: 'Austria/Germany', startDate: '2026-07-07', endDate: '2026-07-08', lat: 47.5000, lng: 12.2000, isTransfer: true, language: 'German' },
        { city: 'Frankfurt',              country: 'Germany',       startDate: '2026-07-09', endDate: '2026-07-09', lat: 50.1109, lng:  8.6821, language: 'German'  }
    ],

    phrases: {
        Italian: [
            { english: 'Hello',                  local: 'Ciao',                       pronunciation: 'CHOW',                              when: 'Greeting anyone' },
            { english: 'Good morning',            local: 'Buongiorno',                 pronunciation: 'bwon-JOUR-no',                      when: 'Morning greeting (more formal)' },
            { english: 'Thank you',               local: 'Grazie',                     pronunciation: 'GRAH-tsee-eh',                      when: 'After receiving help or service' },
            { english: 'Please',                  local: 'Per favore',                 pronunciation: 'pair fah-VOH-ray',                  when: 'When asking for something' },
            { english: 'Excuse me',               local: 'Scusi',                      pronunciation: 'SKOO-zee',                          when: 'Getting attention or apologizing' },
            { english: 'Where is...?',            local: "Dov'è...?",                  pronunciation: 'doh-VEH',                           when: 'Asking for directions' },
            { english: 'How much?',               local: 'Quanto costa?',              pronunciation: 'KWAHN-toh KOH-stah',                when: 'Asking prices' },
            { english: 'The check, please',       local: 'Il conto, per favore',       pronunciation: 'eel KON-toh pair fah-VOH-ray',      when: 'At restaurants' },
            { english: 'Delicious!',              local: 'Delizioso!',                 pronunciation: 'day-lee-TSYOH-zoh',                 when: 'Complimenting food' },
            { english: 'Do you speak English?',   local: 'Parla inglese?',             pronunciation: 'PAR-lah een-GLAY-zay',              when: 'Starting a conversation' }
        ],
        French: [
            { english: 'Hello',                   local: 'Bonjour',                    pronunciation: 'bohn-ZHOOR',                        when: 'Greeting anyone (daytime)' },
            { english: 'Good evening',            local: 'Bonsoir',                    pronunciation: 'bohn-SWAHR',                        when: 'Evening greeting' },
            { english: 'Thank you',               local: 'Merci',                      pronunciation: 'mair-SEE',                          when: 'After receiving help' },
            { english: 'Please',                  local: "S'il vous plaît",            pronunciation: 'seel voo PLAY',                     when: 'When asking for something' },
            { english: 'Excuse me',               local: 'Excusez-moi',                pronunciation: 'ex-koo-zay MWAH',                  when: 'Getting attention' },
            { english: 'Where is...?',            local: 'Où est...?',                 pronunciation: 'oo EH',                             when: 'Asking for directions' },
            { english: 'How much?',               local: "C'est combien?",             pronunciation: 'say kohm-BYEH',                     when: 'Asking prices' },
            { english: 'The check, please',       local: "L'addition, s'il vous plaît",pronunciation: 'lah-dee-SYOHN seel voo PLAY',       when: 'At restaurants' },
            { english: "It's beautiful!",         local: "C'est magnifique!",          pronunciation: 'say mah-nyee-FEEK',                 when: 'Admiring something' },
            { english: 'Do you speak English?',   local: 'Parlez-vous anglais?',       pronunciation: 'par-lay VOO ahn-GLAY',              when: 'Starting a conversation' }
        ],
        German: [
            { english: 'Hello',                   local: 'Hallo / Grüezi (Swiss)',     pronunciation: 'HAH-loh / GREW-tsee',               when: 'Greeting anyone' },
            { english: 'Good day',                local: 'Guten Tag',                  pronunciation: 'GOO-ten tahk',                      when: 'Formal daytime greeting' },
            { english: 'Thank you',               local: 'Danke',                      pronunciation: 'DAHN-kuh',                          when: 'After receiving help' },
            { english: 'Please',                  local: 'Bitte',                      pronunciation: 'BIT-tuh',                           when: 'When asking for something' },
            { english: 'Excuse me',               local: 'Entschuldigung',             pronunciation: 'ent-SHOOL-dee-goong',               when: 'Getting attention or apologizing' },
            { english: 'Where is...?',            local: 'Wo ist...?',                 pronunciation: 'voh ist',                           when: 'Asking for directions' },
            { english: 'How much?',               local: 'Wie viel kostet?',           pronunciation: 'vee feel KOS-tet',                  when: 'Asking prices' },
            { english: 'The check, please',       local: 'Die Rechnung, bitte',        pronunciation: 'dee REKH-noong BIT-tuh',            when: 'At restaurants' },
            { english: 'Delicious!',              local: 'Lecker!',                    pronunciation: 'LEK-er',                            when: 'Complimenting food' },
            { english: 'Do you speak English?',   local: 'Sprechen Sie Englisch?',     pronunciation: 'SHPREKH-en zee ENG-lish',           when: 'Starting a conversation' }
        ]
    }
}
