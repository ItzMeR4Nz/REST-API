const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
    app.get('/stalk/tiktok', async (req, res) => {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ 
                status: false, 
                message: 'Parameter username diperlukan' 
            });
        }

        try {  
            const response = await axios.get(`https://www.tiktok.com/@${username}?_t=ZS-8tHANz7ieoS&_r=1`, {  
                headers: {  
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'  
                },
                timeout: 30000
            });  

            const html = response.data;  
            const $ = cheerio.load(html);  
            const scriptData = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();  

            if (!scriptData) {  
                return res.status(404).json({ 
                    status: false, 
                    message: 'User tidak ditemukan' 
                });  
            }  

            const parsedData = JSON.parse(scriptData);  
            const userDetail = parsedData.__DEFAULT_SCOPE__?.['webapp.user-detail'];  

            if (!userDetail || !userDetail.userInfo) {  
                return res.status(404).json({ 
                    status: false, 
                    message: 'User tidak ditemukan' 
                });  
            }  

            const user = userDetail.userInfo.user;  
            const stats = userDetail.userInfo.stats;  
            const region = user.region || user.country || user.location || user.regionCode || null;

            const createTime = user.createTime 
                ? new Date(user.createTime * 1000).toISOString() 
                : null;

            const nicknameUpdateTime = user.nicknameUpdateTime 
                ? new Date(user.nicknameUpdateTime * 1000).toISOString() 
                : user.nickNameModifyTime 
                    ? new Date(user.nickNameModifyTime * 1000).toISOString() 
                    : null;

            let nicknameLastUpdated = nicknameUpdateTime;
            if (!nicknameLastUpdated) {
                const nicknameElement = $('div[data-e2e="user-nickname"]');
                if (nicknameElement.length > 0) {
                    const tooltipText = nicknameElement.attr('title') || nicknameElement.attr('data-tooltip');
                    if (tooltipText && tooltipText.includes('Diubah pada')) {
                        const match = tooltipText.match(/Diubah pada (.+)/);
                        if (match) nicknameLastUpdated = new Date(match[1]).toISOString();
                    }
                }
            }

            res.status(200).json({  
                status: true,  
                creator: "reyz pemvokep",
                data: {  
                    id: user.id,  
                    secUid: user.secUid,  
                    username: user.uniqueId,  
                    nickname: user.nickname,  
                    bio: user.signature,  
                    avatar: {  
                        thumb: user.avatarThumb,  
                        medium: user.avatarMedium,  
                        large: user.avatarLarger  
                    },  
                    verified: user.verified,  
                    private: user.privateAccount,  
                    region: region,  
                    accountCreatedAt: createTime,
                    nicknameLastUpdated: nicknameLastUpdated || null,
                    stats: {  
                        followers: stats.followerCount,  
                        following: stats.followingCount,  
                        likes: stats.heartCount,  
                        totalHearts: stats.heart,  
                        videos: stats.videoCount  
                    }  
                }  
            });  

        } catch (error) {  
            res.status(500).json({  
                status: false,  
                message: error.message || 'Terjadi kesalahan saat mengambil data'  
            });  
        }  
    });
};
