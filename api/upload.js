// api/upload.js — Cloudinary photo upload proxy
// CommonJS (same as api/claude.js) — do NOT convert to ESM
const https = require('https')
const crypto = require('crypto')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { imageData, filename } = req.body
    if (!imageData || !filename) {
      return res.status(400).json({ error: 'Missing required fields: imageData, filename' })
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ error: 'Missing Cloudinary environment variables' })
    }

    const timestamp = Math.round(Date.now() / 1000)
    const folder = 'ep26'
    const publicId = filename.replace(/\.jpg$/i, '')

    // Generate signature
    const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

    // Build multipart form body
    const boundary = '----EP26Boundary' + Date.now()
    const dataUri = `data:image/jpeg;base64,${imageData}`

    const fields = { file: dataUri, api_key: apiKey, timestamp: String(timestamp), signature, folder, public_id: publicId }

    let body = ''
    for (const [key, value] of Object.entries(fields)) {
      body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
    }
    body += `--${boundary}--\r\n`

    const bodyBuffer = Buffer.from(body, 'utf8')

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.cloudinary.com',
        path: `/v1_1/${cloudName}/image/upload`,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length
        }
      }

      const request = https.request(options, (response) => {
        let data = ''
        response.on('data', chunk => { data += chunk })
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data)
            if (response.statusCode >= 400) {
              reject(new Error(parsed.error?.message || 'Cloudinary error ' + response.statusCode))
            } else {
              resolve(parsed)
            }
          } catch (e) {
            reject(new Error('Failed to parse Cloudinary response'))
          }
        })
      })

      request.on('error', reject)
      request.write(bodyBuffer)
      request.end()
    })

    return res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id
    })
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: 'Upload failed', details: err.message })
  }
}

module.exports.config = {
  api: { bodyParser: { sizeLimit: '8mb' } }
}
