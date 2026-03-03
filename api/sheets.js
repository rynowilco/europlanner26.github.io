import { google } from 'googleapis';

const SPREADSHEET_ID = '12ca-wAeLKrmfgdJQmxKjRFNAvptjdnJCobSkm1wk838';

function getAuthClient() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { operation, sheet, range, values } = req.body || {};

    if (!operation || !sheet) {
        return res.status(400).json({ error: 'Missing required fields: operation, sheet' });
    }

    try {
        const auth = getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        if (operation === 'read') {
            const fullRange = range ? `${sheet}!${range}` : sheet;
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: fullRange
            });
            return res.status(200).json({ values: response.data.values || [] });
        }

        if (operation === 'append') {
            if (!values) return res.status(400).json({ error: 'Missing values for append' });
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: sheet,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [values] }
            });
            return res.status(200).json({ success: true });
        }

        if (operation === 'update') {
            if (!range || !values) return res.status(400).json({ error: 'Missing range or values for update' });
            const fullRange = `${sheet}!${range}`;
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: fullRange,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values }
            });
            return res.status(200).json({ success: true });
        }

        return res.status(400).json({ error: 'Unknown operation: ' + operation });
    } catch (error) {
        console.error('Sheets API error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
