import { useState, useRef, useCallback } from 'react'

// Returns { isListening, isSupported, startListening, stopListening }
// onTranscript(text) is called once with the final result
// Appends to existing text rather than replacing it — parent handles the append
export function useSpeechInput({ onTranscript }) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  const isSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const startListening = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1]
      if (last.isFinal) {
        const text = last[0].transcript.trim()
        if (text) onTranscript(text)
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    try {
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }, [isSupported, onTranscript])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (_) {}
    }
    setIsListening(false)
  }, [])

  return { isListening, isSupported, startListening, stopListening }
}
