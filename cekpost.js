const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    // Izinkan akses dari mana saja (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { username } = req.query;
    
    if (!username) {
        return res.status(400).json({ 
            success: false,
            message: 'Username diperlukan'
        });
    }

    try {
        const startTime = Date.now();
        
        // Cek user TikTok
        const userPageRes = await axios.get(`https://www.tiktok.com/@${username}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        // Ambil video ID
        const videoMatch = userPageRes.data.match(/video\/(\d+)/);
        if (!videoMatch) {
            return res.status(404).json({
                success: false,
                message: `User @${username} tidak punya video publik`
            });
        }
        
        const videoUrl = `https://www.tiktok.com/@${username}/video/${videoMatch[1]}`;
        
        // Ambil token dari savett.cc
        const tokenRes = await axios.get('https://savett.cc/en1/download', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)' }
        });
        
        const csrfToken = tokenRes.data.match(/name="csrf_token" value="([^"]+)"/)[1];
        const cookie = tokenRes.headers['set-cookie'].map(v => v.split(';')[0]).join('; ');
        
        // Ambil info video
        const videoRes = await axios.post(
            'https://savett.cc/en1/download',
            `csrf_token=${csrfToken}&url=${encodeURIComponent(videoUrl)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': cookie,
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)'
                }
            }
        );
        
        const $ = cheerio.load(videoRes.data);
        
        // Ambil data
        const username2 = $('#video-info h3').first().text().trim();
        const stats = [];
        $('#video-info .my-1 span').each((_, el) => {
            stats.push($(el).text().trim());
        });
        
        // Cek slide foto
        const slides = [];
        $('.carousel-item[data-data]').each((_, el) => {
            try {
                const json = JSON.parse($(el).attr('data-data').replace(/&quot;/g, '"'));
                if (json.URL) {
                    json.URL.forEach(url => slides.push(url));
                }
            } catch(e) {}
        });
        
        const result = {
            success: true,
            data: {
                username: username2 || username,
                stats: {
                    views: stats[0] || '0',
                    likes: stats[1] || '0',
                    comments: stats[3] || '0',
                    shares: stats[4] || '0'
                },
                type: slides.length > 0 ? 'slideshow' : 'video',
                total_media: slides.length > 0 ? slides.length : 1,
                slides: slides,
                video_url: videoUrl
            }
        };
        
        return res.json(result);
        
    } catch (error) {
        console.log('Error:', error.message);
        
        if (error.response?.status === 404 || error.message.includes('404')) {
            return res.status(404).json({
                success: false,
                message: `User @${username} tidak ditemukan`
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data: ' + error.message
        });
    }
};