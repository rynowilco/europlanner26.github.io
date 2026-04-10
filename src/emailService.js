import emailjs from '@emailjs/browser'
import { CONFIG } from './config'

export const EmailService = {
    initialized: false,

    init() {
        if (this.initialized) return
        emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY)
        this.initialized = true
    },

    async sendDigest(kidName, sessionSummary, activitiesSubmitted, toEmail) {
        this.init()
        try {
            const result = await emailjs.send(
                CONFIG.EMAILJS_SERVICE_ID,
                CONFIG.EMAILJS_TEMPLATE_ID,
                {
                    to_email: toEmail,
                    kid_name: kidName,
                    session_summary: sessionSummary || 'Had a planning chat',
                    activities_submitted: activitiesSubmitted || 'None this session'
                }
            )
            console.log('Email sent successfully:', result)
            return true
        } catch (error) {
            console.error('Email send failed:', error)
            return false
        }
    },

    async sendDigestToBothParents(kidName, sessionSummary, activitiesSubmitted) {
        const results = await Promise.all(
            CONFIG.PARENT_EMAILS.map(email =>
                this.sendDigest(kidName, sessionSummary, activitiesSubmitted, email)
            )
        )
        return results.every(r => r)
    }
}
