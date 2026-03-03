const handler = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.CLAUDE_API_KEY;
    console.log('API key present:', !!apiKey, '| First 10 chars:', apiKey ? apiKey.substring(0, 10) : 'MISSING');

    try {
        const tools = [{ type: 'web_search_20250305', name: 'web_search' }];

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-beta': 'web-search-2025-03-05'
            },
            body: JSON.stringify({ ...req.body, tools })
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Claude proxy error:', error);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = handler;
