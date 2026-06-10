import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '../components/Icon'

// ─── Card Data ────────────────────────────────────────────────────────────────

const DECKS = {
    Italian: [
        { foreign: 'Ciao',                        phonetic: 'CHOW',                                         english: 'Hello' },
        { foreign: 'Arrivederci',                  phonetic: 'ah-ree-veh-DEHR-chee',                         english: 'Goodbye' },
        { foreign: 'Per favore',                   phonetic: 'pehr fah-VOH-reh',                             english: 'Please' },
        { foreign: 'Grazie',                       phonetic: 'GRAT-see-eh',                                  english: 'Thank you' },
        { foreign: 'Prego',                        phonetic: 'PREH-go',                                      english: "You're welcome" },
        { foreign: 'Scusi',                        phonetic: 'SKOO-zee',                                     english: 'Excuse me' },
        { foreign: 'Mi dispiace',                  phonetic: 'mee dees-PYAH-cheh',                           english: 'Sorry' },
        { foreign: 'Sì',                           phonetic: 'SEE',                                          english: 'Yes' },
        { foreign: 'No',                           phonetic: 'NOH',                                          english: 'No' },
        { foreign: 'Aiuto!',                       phonetic: 'ah-YOO-toh',                                   english: 'Help!' },
        { foreign: 'Gelato',                       phonetic: 'jeh-LAH-toh',                                  english: 'Gelato' },
        { foreign: 'Sardine',                      phonetic: 'sar-DEE-neh',                                  english: 'Sardines' },
        { foreign: 'Caffè',                        phonetic: 'kaf-FEH',                                      english: 'Coffee' },
        { foreign: 'Acqua',                        phonetic: 'AH-kwah',                                      english: 'Water' },
        { foreign: 'Pane',                         phonetic: 'PAH-neh',                                      english: 'Bread' },
        { foreign: 'Che buono!',                   phonetic: 'keh BWOH-noh',                                 english: 'Delicious!' },
        { foreign: 'Il conto, per favore',         phonetic: 'eel KON-toh pehr fah-VOH-reh',                 english: 'The bill, please' },
        { foreign: 'Menù',                         phonetic: 'meh-NOO',                                      english: 'Menu' },
        { foreign: 'Posso avere degli snack?',     phonetic: 'POH-so ah-VEH-reh DEL-yee snack',              english: 'May I have some snacks?' },
        { foreign: 'Vino',                         phonetic: 'VEE-noh',                                      english: 'Wine' },
        { foreign: "Dov'è il bagno?",              phonetic: "doh-VEH eel BAN-yoh",                          english: 'Where is the bathroom?' },
        { foreign: 'Dove possiamo nuotare?',       phonetic: 'DOH-veh pos-SYAH-moh nwoh-TAH-reh',            english: 'Where can we swim?' },
        { foreign: 'Stazione',                     phonetic: 'stah-TSYOH-neh',                               english: 'Train station' },
        { foreign: 'Quanto costa?',                phonetic: 'KWAHN-toh KOS-tah',                            english: 'How much does it cost?' },
        { foreign: "C'è un bar per vedere il Tour de France?", phonetic: "cheh oon bar pehr veh-DEH-reh eel tour deh FRAHNS", english: 'Is there a bar to watch the Tour de France?' },
        { foreign: 'Devo fare la cacca',           phonetic: 'DEH-voh FAH-reh lah KAH-kah',                  english: 'I need to poop' },
        { foreign: 'Mi scuso per la flatulenza',   phonetic: 'mee SKOO-zoh pehr lah flat-oo-LEN-tsah',       english: 'I apologize for farting' },
        { foreign: "Dov'è la spiaggia?",           phonetic: "doh-VEH lah SPYAH-jah",                        english: 'Where is the beach?' },
        { foreign: 'È incredibile!',               phonetic: 'eh een-kreh-DEE-bee-leh',                      english: 'This is amazing!' },
        { foreign: "C'è un bar per vedere i Mondiali?", phonetic: "cheh oon bar pehr veh-DEH-reh ee mon-DYAH-lee", english: 'Is there a bar to watch the World Cup?' },
        { foreign: 'Birra',                        phonetic: 'BEER-rah',                                     english: 'Beer' },
        { foreign: 'Albergo',                      phonetic: 'al-BEHR-goh',                                  english: 'Hotel' },
    ],
    German: [
        { foreign: 'Hallo',                        phonetic: 'HAH-loh',                                      english: 'Hello' },
        { foreign: 'Auf Wiedersehen',              phonetic: 'owf VEE-der-zay-en',                           english: 'Goodbye' },
        { foreign: 'Bitte',                        phonetic: 'BIT-teh',                                      english: 'Please' },
        { foreign: 'Danke',                        phonetic: 'DAHN-keh',                                     english: 'Thank you' },
        { foreign: 'Gern geschehen',               phonetic: 'gehrn geh-SHAY-en',                            english: "You're welcome" },
        { foreign: 'Entschuldigung',               phonetic: 'ent-SHOOL-dee-goong',                          english: 'Excuse me' },
        { foreign: 'Es tut mir leid',              phonetic: 'es toot meer lyd',                             english: 'Sorry' },
        { foreign: 'Ja',                           phonetic: 'YAH',                                          english: 'Yes' },
        { foreign: 'Nein',                         phonetic: 'NYN',                                          english: 'No' },
        { foreign: 'Hilfe!',                       phonetic: 'HIL-feh',                                      english: 'Help!' },
        { foreign: 'Eis',                          phonetic: 'ICE',                                          english: 'Gelato / Ice cream' },
        { foreign: 'Sardinen',                     phonetic: 'zar-DEE-nen',                                  english: 'Sardines' },
        { foreign: 'Kaffee',                       phonetic: 'KAH-feh',                                      english: 'Coffee' },
        { foreign: 'Wasser',                       phonetic: 'VAH-ser',                                      english: 'Water' },
        { foreign: 'Brot',                         phonetic: 'BROHT',                                        english: 'Bread' },
        { foreign: 'Lecker!',                      phonetic: 'LEK-er',                                       english: 'Delicious!' },
        { foreign: 'Die Rechnung, bitte',          phonetic: 'dee RECH-noong BIT-teh',                       english: 'The bill, please' },
        { foreign: 'Speisekarte',                  phonetic: 'SHPY-zeh-kar-teh',                             english: 'Menu' },
        { foreign: 'Darf ich ein paar Snacks haben?', phonetic: 'darf ish yn par snacks HAH-ben',            english: 'May I have some snacks?' },
        { foreign: 'Wein',                         phonetic: 'VYN',                                          english: 'Wine' },
        { foreign: 'Wo ist die Toilette?',         phonetic: 'voh ist dee toy-LET-eh',                       english: 'Where is the bathroom?' },
        { foreign: 'Wo können wir schwimmen?',     phonetic: 'voh KUR-nen veer SHVIM-en',                    english: 'Where can we swim?' },
        { foreign: 'Bahnhof',                      phonetic: 'BAHN-hohf',                                    english: 'Train station' },
        { foreign: 'Wie viel kostet das?',         phonetic: 'vee feel KOS-tet das',                         english: 'How much does it cost?' },
        { foreign: 'Gibt es eine Bar für die Tour de France?', phonetic: 'gipt es EYE-neh bar fyur dee tour deh FRAHNS', english: 'Is there a bar to watch the Tour de France?' },
        { foreign: 'Ich muss aufs Klo',            phonetic: 'ish moos owfs KLOH',                           english: 'I need to poop' },
        { foreign: 'Ich entschuldige mich fürs Furzen', phonetic: 'ish ent-SHOOL-dee-geh mish fyurs FOOR-tsen', english: 'I apologize for farting' },
        { foreign: 'Wo ist der Strand?',           phonetic: 'voh ist dehr SHTRAND',                         english: 'Where is the beach?' },
        { foreign: 'Das ist unglaublich!',         phonetic: 'das ist oon-GLOWP-lish',                       english: 'This is amazing!' },
        { foreign: 'Gibt es eine Bar für die Weltmeisterschaft?', phonetic: 'gipt es EYE-neh bar fyur dee VELT-my-ster-shaft', english: 'Is there a bar to watch the World Cup?' },
        { foreign: 'Bier',                         phonetic: 'BEER',                                         english: 'Beer' },
        { foreign: 'Hotel',                        phonetic: 'hoh-TEL',                                      english: 'Hotel' },
    ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

const getWrongOptions = (cards, correctCard, count = 3) => {
    const others = cards.filter(c => c.foreign !== correctCard.foreign)
    return shuffle(others).slice(0, count).map(c => c.foreign)
}

// ─── Level 1: Watch & Learn ───────────────────────────────────────────────────

const Level1 = ({ cards, onComplete }) => {
    const [index, setIndex] = useState(0)
    const [phase, setPhase] = useState('foreign') // 'foreign' | 'phonetic' | 'english' | 'done'
    const timerRef = useRef(null)

    const card = cards[index]

    useEffect(() => {
        setPhase('foreign')
        timerRef.current = setTimeout(() => setPhase('phonetic'), 3000)
        return () => clearTimeout(timerRef.current)
    }, [index])

    useEffect(() => {
        if (phase === 'phonetic') {
            timerRef.current = setTimeout(() => setPhase('english'), 2500)
            return () => clearTimeout(timerRef.current)
        }
    }, [phase])

    const handleNext = () => {
        if (index + 1 >= cards.length) { onComplete(); return }
        setIndex(i => i + 1)
    }

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)', gap: 'var(--space-lg)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-light)' }}>
                {index + 1} / {cards.length}
            </div>

            <div style={{ width: '100%', minHeight: '220px', background: 'white', borderRadius: 'var(--radius-xl)', border: '2px solid var(--color-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)', gap: 'var(--space-md)', transition: 'all 0.3s' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-navy)', textAlign: 'center', lineHeight: 1.2 }}>
                    {card.foreign}
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--color-terracotta)', fontStyle: 'italic', opacity: phase === 'foreign' ? 0 : 1, transition: 'opacity 0.5s', textAlign: 'center' }}>
                    {card.phonetic}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--color-text-light)', opacity: phase === 'english' ? 1 : 0, transition: 'opacity 0.5s', textAlign: 'center' }}>
                    {card.english}
                </div>
            </div>

            {phase === 'english' && (
                <button onClick={handleNext} style={{ width: '100%', padding: 'var(--space-md)', background: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', animation: 'fadeIn 0.3s ease-out' }}>
                    {index + 1 >= cards.length ? 'Finish Level 1 →' : 'Next →'}
                </button>
            )}
        </div>
    )
}

// ─── Level 2: Multiple Choice ─────────────────────────────────────────────────

const Level2 = ({ cards, onComplete }) => {
    const [index, setIndex] = useState(0)
    const [options, setOptions] = useState([])
    const [selected, setSelected] = useState(null)
    const [score, setScore] = useState(0)

    const card = cards[index]

    useEffect(() => {
        const wrongs = getWrongOptions(cards, card)
        setOptions(shuffle([card.foreign, ...wrongs]))
        setSelected(null)
    }, [index])

    const handleSelect = (opt) => {
        if (selected !== null) return
        setSelected(opt)
        if (opt === card.foreign) setScore(s => s + 1)
        setTimeout(() => {
            if (index + 1 >= cards.length) { onComplete(score + (opt === card.foreign ? 1 : 0)); return }
            setIndex(i => i + 1)
        }, 900)
    }

    const getOptionStyle = (opt) => {
        const base = { width: '100%', padding: '14px var(--space-lg)', border: '2px solid', borderRadius: 'var(--radius-lg)', fontSize: '0.95rem', fontWeight: 600, cursor: selected ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s' }
        if (selected === null) return { ...base, background: 'white', borderColor: 'var(--color-border)', color: 'var(--color-navy)' }
        if (opt === card.foreign) return { ...base, background: '#e8f8ee', borderColor: '#2d7a3a', color: '#2d7a3a' }
        if (opt === selected) return { ...base, background: '#fde8e8', borderColor: '#c0392b', color: '#c0392b' }
        return { ...base, background: 'white', borderColor: 'var(--color-border)', color: 'var(--color-text-light)', opacity: 0.5 }
    }

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--space-md) var(--space-lg)', gap: 'var(--space-sm)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-xs)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-light)' }}>{index + 1} / {cards.length}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-terracotta)' }}>⭐ {score}</div>
            </div>

            <div style={{ background: 'var(--color-navy)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md) var(--space-lg)', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>How do you say…</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', lineHeight: 1.25 }}>{card.english}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'center' }}>
                {options.map((opt, i) => (
                    <button key={i} onClick={() => handleSelect(opt)} style={{ ...getOptionStyle(opt), padding: '11px var(--space-md)', fontSize: opt.length > 30 ? '0.78rem' : '0.9rem' }}>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── Level 3: Flash Cards ─────────────────────────────────────────────────────

const Level3 = ({ cards, onComplete }) => {
    const [deck, setDeck] = useState(() => shuffle(cards))
    const [index, setIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [results, setResults] = useState({ got: 0, missed: 0 })
    const [showFront, setShowFront] = useState(null) // null = not yet revealed

    const card = deck[index]
    const isEnglishFront = index % 2 === 0

    const front = isEnglishFront ? card.english : card.foreign
    const back  = isEnglishFront ? card.foreign : card.english
    const backSub = isEnglishFront ? card.phonetic : null

    const handleFlip = () => {
        if (!flipped) setFlipped(true)
    }

    const handleGrade = (got) => {
        const newResults = { got: results.got + (got ? 1 : 0), missed: results.missed + (got ? 0 : 1) }
        setResults(newResults)
        if (index + 1 >= deck.length) { onComplete(newResults); return }
        setIndex(i => i + 1)
        setFlipped(false)
    }

    const progress = ((index) / deck.length) * 100

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--space-xl)', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-light)' }}>{index + 1} / {deck.length}</div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span style={{ color: '#2d7a3a' }}>👍 {results.got}</span>
                    <span style={{ color: '#c0392b' }}>👎 {results.missed}</span>
                </div>
            </div>

            <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-navy)', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>

            {/* Card */}
            <div onClick={handleFlip} style={{ flex: 1, minHeight: '200px', background: flipped ? 'var(--color-navy)' : 'white', border: flipped ? 'none' : '2px solid var(--color-border)', borderRadius: 'var(--radius-xl)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)', gap: 'var(--space-md)', cursor: flipped ? 'default' : 'pointer', transition: 'all 0.3s' }}>
                {!flipped ? (
                    <>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-light)' }}>
                            {isEnglishFront ? 'English' : 'Local language'} — tap to reveal
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-navy)', textAlign: 'center', lineHeight: 1.2 }}>{front}</div>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.45)' }}>Answer</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', textAlign: 'center', lineHeight: 1.2 }}>{back}</div>
                        {backSub && <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', textAlign: 'center' }}>{backSub}</div>}
                    </>
                )}
            </div>

            {flipped && (
                <div style={{ display: 'flex', gap: 'var(--space-md)', animation: 'fadeIn 0.2s ease-out' }}>
                    <button onClick={() => handleGrade(false)} style={{ flex: 1, padding: 'var(--space-md)', background: '#fde8e8', border: '2px solid #c0392b', borderRadius: 'var(--radius-lg)', fontSize: '1.2rem', fontWeight: 700, color: '#c0392b', cursor: 'pointer' }}>
                        👎 Missed it
                    </button>
                    <button onClick={() => handleGrade(true)} style={{ flex: 1, padding: 'var(--space-md)', background: '#e8f8ee', border: '2px solid #2d7a3a', borderRadius: 'var(--radius-lg)', fontSize: '1.2rem', fontWeight: 700, color: '#2d7a3a', cursor: 'pointer' }}>
                        👍 Got it
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── Results Screen ───────────────────────────────────────────────────────────

const ResultsScreen = ({ level, score, total, onReplay, onNextLevel, onHome, isLastLevel }) => {
    const pct = Math.round((score / total) * 100)
    const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'
    const msg   = pct >= 80 ? 'Fantastico!' : pct >= 50 ? 'Not bad!' : 'Keep practicing!'

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)', gap: 'var(--space-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem' }}>{emoji}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-navy)' }}>{msg}</div>
            {level === 3
                ? <div style={{ fontSize: '1.1rem', color: 'var(--color-text-light)' }}>Got it: {score} &nbsp;·&nbsp; Missed: {total - score}</div>
                : <div style={{ fontSize: '1.1rem', color: 'var(--color-text-light)' }}>{score} / {total} correct</div>
            }
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%', marginTop: 'var(--space-md)' }}>
                {!isLastLevel && (
                    <button onClick={onNextLevel} style={{ width: '100%', padding: 'var(--space-md)', background: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
                        Level {level + 1} →
                    </button>
                )}
                <button onClick={onReplay} style={{ width: '100%', padding: 'var(--space-md)', background: 'white', color: 'var(--color-navy)', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                    Replay Level {level}
                </button>
                <button onClick={onHome} style={{ width: '100%', padding: 'var(--space-md)', background: 'transparent', color: 'var(--color-text-light)', border: 'none', fontSize: '0.9rem', cursor: 'pointer' }}>
                    ← Back to Language Game
                </button>
            </div>
        </div>
    )
}

// ─── FlashCardScreen ──────────────────────────────────────────────────────────

export const FlashCardScreen = ({ onBack }) => {
    const [view, setView]       = useState('langPick')   // 'langPick' | 'levelPick' | 'playing' | 'results'
    const [language, setLanguage] = useState(null)
    const [level, setLevel]     = useState(null)
    const [resultData, setResultData] = useState(null)

    const cards = language ? DECKS[language] : []

    const startLevel = (lvl) => { setLevel(lvl); setView('playing') }

    const handleLevel1Complete = () => setView('results')
    const handleLevel2Complete = (score) => { setResultData({ score, total: cards.length }); setView('results') }
    const handleLevel3Complete = (results) => { setResultData(results); setView('results') }

    const levelMeta = [
        { num: 1, emoji: '👁️', title: 'Watch & Learn',     desc: 'See the word, hear it, learn it' },
        { num: 2, emoji: '🎯', title: 'Multiple Choice',    desc: 'Pick the right translation' },
        { num: 3, emoji: '🃏', title: 'Flash Cards',        desc: 'Self-grade your recall' },
    ]

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, var(--color-warm-white) 0%, var(--color-cream) 100%)' }}>

            {/* Header */}
            <div style={{ background: 'var(--color-navy)', padding: '0 var(--space-lg)', paddingTop: 'calc(var(--space-sm) + env(safe-area-inset-top, 0px))', paddingBottom: 'var(--space-sm)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button onClick={view === 'langPick' ? onBack : () => setView(view === 'results' ? 'levelPick' : view === 'playing' ? 'levelPick' : 'langPick')}
                        style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                        <Icon name="ChevronLeft" size={15} color="white" />
                        {view === 'langPick' ? 'Tools' : view === 'levelPick' ? 'Languages' : 'Levels'}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '1.1rem' }}>🗣️</span>
                        <span style={{ color: 'white', fontSize: '1rem', fontWeight: 700 }}>Language Game</span>
                        {language && <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', marginLeft: '4px' }}>{language === 'Italian' ? '🇮🇹' : '🇩🇪'}</span>}
                    </div>
                    <div style={{ width: '70px' }} />{/* spacer to center title */}
                </div>
            </div>

            {/* Language Pick */}
            {view === 'langPick' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', padding: 'var(--space-xl)', justifyContent: 'center' }}>
                    <p style={{ textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>Choose a language to practice</p>
                    {[{ lang: 'Italian', flag: '🇮🇹', sub: 'Switzerland, Italy' }, { lang: 'German', flag: '🇩🇪', sub: 'Germany, Switzerland, Austria' }].map(({ lang, flag, sub }) => (
                        <button key={lang} onClick={() => { setLanguage(lang); setView('levelPick') }}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', padding: 'var(--space-xl)', background: 'white', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-xl)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ fontSize: '3rem' }}>{flag}</div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-navy)' }}>{lang}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '2px' }}>{sub}</div>
                            </div>
                            <Icon name="ChevronRight" size={20} color="var(--color-text-light)" style={{ marginLeft: 'auto' }} />
                        </button>
                    ))}
                </div>
            )}

            {/* Level Pick */}
            {view === 'levelPick' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', padding: 'var(--space-xl)', justifyContent: 'center' }}>
                    <p style={{ textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>Start at Level 1 or jump in anywhere</p>
                    {levelMeta.map(({ num, emoji, title, desc }) => (
                        <button key={num} onClick={() => startLevel(num)}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', padding: 'var(--space-lg) var(--space-xl)', background: 'white', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-xl)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ width: '48px', height: '48px', background: 'var(--color-cream)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>{emoji}</div>
                            <div style={{ textAlign: 'left', flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-navy)' }}>Level {num}: {title}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: '2px' }}>{desc}</div>
                            </div>
                            <Icon name="ChevronRight" size={18} color="var(--color-text-light)" />
                        </button>
                    ))}
                </div>
            )}

            {/* Playing */}
            {view === 'playing' && level === 1 && (
                <Level1 cards={cards} onComplete={handleLevel1Complete} />
            )}
            {view === 'playing' && level === 2 && (
                <Level2 cards={cards} onComplete={handleLevel2Complete} />
            )}
            {view === 'playing' && level === 3 && (
                <Level3 cards={cards} onComplete={handleLevel3Complete} />
            )}

            {/* Results */}
            {view === 'results' && level === 1 && (
                <ResultsScreen level={1} score={cards.length} total={cards.length}
                    onReplay={() => startLevel(1)} onNextLevel={() => startLevel(2)}
                    onHome={() => setView('levelPick')} isLastLevel={false} />
            )}
            {view === 'results' && level === 2 && resultData && (
                <ResultsScreen level={2} score={resultData.score} total={resultData.total}
                    onReplay={() => startLevel(2)} onNextLevel={() => startLevel(3)}
                    onHome={() => setView('levelPick')} isLastLevel={false} />
            )}
            {view === 'results' && level === 3 && resultData && (
                <ResultsScreen level={3} score={resultData.got} total={resultData.got + resultData.missed}
                    onReplay={() => startLevel(3)} onNextLevel={null}
                    onHome={() => setView('levelPick')} isLastLevel={true} />
            )}
        </div>
    )
}
