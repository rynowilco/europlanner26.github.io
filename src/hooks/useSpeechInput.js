import { useState, useRef, useCallback, useEffect } from 'react'

// Returns { isListening, isSupported, startListening, stopListening }
// onTranscript(text) — called with each final result; parent appends to field value
// continuous = true — mic stays open until stopListening() or user taps to stop
export function useSpeechInput({ onTranscript }) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  // Keep the callback ref always current — avoids stale closures without
  // needing it as a useCallback dependency
  const onTranscriptRef = useRef(onTranscript)
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  })

  const isSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const startListening = useCallback(() => {
    if (!isSupported) return

    // Abort any existing instance before creating a new one.
    // iOS Safari locks up if you try to start a new session without this.
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch (_) {}
      recognitionRef.current = null
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = true      // mic stays open; user taps to stop
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      // With continuous=true, iterate only the new results since last event
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim()
          if (text) onTranscriptRef.current(text)
        }
      }
    }

    recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error)
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    try {
      recognition.start()
    } catch (e) {
      console.warn('recognition.start() failed:', e)
      setIsListening(false)
      recognitionRef.current = null
    }
  }, [isSupported]) // onTranscript intentionally omitted — accessed via ref

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (_) {}
    }
    setIsListening(false)
  }, [])

  return { isListening, isSupported, startListening, stopListening }
}
