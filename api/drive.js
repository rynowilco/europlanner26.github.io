// api/drive.js — Google Drive photo upload proxy
// CommonJS (same as api/claude.js) — do NOT convert to ESM
const { google } = require('googleapis')
const { Readable } = require('stream')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { imageData, mimeType, filename } = req.body
    if (!imageData || !mimeType || !filename) {
      return res.status(400).json({ error: 'Missing required fields: imageData, mimeType, filename' })
    }

    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive']
    })

    const drive = google.drive({ version: 'v3', auth })
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
    if (!folderId) return res.status(500).json({ error: 'GOOGLE_DRIVE_FOLDER_ID env var not set' })

    const buffer = Buffer.from(imageData, 'base64')
    const stream = Readable.from(buffer)

    const file = await drive.files.create({
      requestBody: { name: filename, parents: [folderId] },
      media: { mimeType, body: stream },
      fields: 'id'
    })

    // Make file publicly readable for embedding in <img> tags
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    })

    return res.status(200).json({
      fileId: file.data.id,
      url: `https://drive.google.com/uc?export=view&id=${file.data.id}`
    })
  } catch (err) {
    console.error('Drive upload error:', err)
    return res.status(500).json({ error: 'Upload failed', details: err.message })
  }
}

// Increase body size limit for base64 image payloads
module.exports.config = {
  api: { bodyParser: { sizeLimit: '8mb' } }
}
