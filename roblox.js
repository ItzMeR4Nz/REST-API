const axios = require('axios')

module.exports = function (app) {
  app.get('/stalk/roblox', async (req, res) => {
    const { username } = req.query

    if (!username) {
      return res.status(400).json({
        status: false,
        message: 'Parameter username diperlukan'
      })
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'application/json',
      }

      async function getUsernameData() {
        const res = await axios.post(
          'https://users.roblox.com/v1/usernames/users',
          { usernames: [username] },
          { headers }
        )
        return res.data?.data?.[0] || null
      }

      async function getUserData(id) {
        try {
          const res = await axios.get(`https://users.roblox.com/v1/users/${id}`, { headers })
          return res.data
        } catch {
          return {}
        }
      }

      async function getProfile(id) {
        try {
          const res = await axios.get(
            `https://thumbnails.roblox.com/v1/users/avatar?userIds=${id}&size=720x720&format=Png&isCircular=false`,
            { headers }
          )
          return res.data?.data?.[0]?.imageUrl || null
        } catch {
          return null
        }
      }

      async function getPresence(id) {
        try {
          const res = await axios.post(
            'https://presence.roblox.com/v1/presence/users',
            { userIds: [id] },
            { headers }
          )
          const p = res.data?.userPresences?.[0] || {}
          return {
            isOnline: p.userPresenceType === 2,
            lastOnline: p.lastOnline || 'Tidak tersedia',
            location: p.lastLocation || '❌ Tidak sedang bermain apa pun (offline)'
          }
        } catch {
          return {
            isOnline: false,
            lastOnline: 'Tidak tersedia',
            location: '❌ Tidak sedang bermain apa pun (offline)'
          }
        }
      }

      async function getFriendCount(id) {
        try {
          const res = await axios.get(`https://friends.roblox.com/v1/users/${id}/friends/count`, { headers })
          return res.data?.count || 0
        } catch {
          return 0
        }
      }

      async function getFollowers(id) {
        try {
          const res = await axios.get(`https://friends.roblox.com/v1/users/${id}/followers/count`, { headers })
          return res.data?.count || 0
        } catch {
          return 0
        }
      }

      async function getFollowing(id) {
        try {
          const res = await axios.get(`https://friends.roblox.com/v1/users/${id}/followings/count`, { headers })
          return res.data?.count || 0
        } catch {
          return 0
        }
      }

      async function getBadges(id) {
        try {
          const res = await axios.get(
            `https://badges.roblox.com/v1/users/${id}/badges?limit=10&sortOrder=Desc`,
            { headers }
          )
          return res.data?.data?.map(b => ({
            name: b.name,
            description: b.description,
            iconImageId: b.iconImageId
          })) || []
        } catch {
          return []
        }
      }

      async function getFriendList(id) {
        try {
          const res = await axios.get(`https://friends.roblox.com/v1/users/${id}/friends`, { headers })
          return res.data?.data?.map(f => ({
            id: f.id,
            name: f.name,
            displayName: f.displayName,
            isOnline: f.isOnline,
            profilePicture: `https://www.roblox.com/headshot-thumbnail/image?userId=${f.id}&width=150&height=150&format=png`
          })) || []
        } catch {
          return []
        }
      }

      const userData = await getUsernameData()
      if (!userData) {
        return res.status(404).json({
          status: false,
          message: 'Username tidak ditemukan'
        })
      }

      const id = userData.id
      const [
        userDetails,
        profilePicture,
        presence,
        friendCount,
        followers,
        following,
        badges,
        friendList
      ] = await Promise.all([
        getUserData(id),
        getProfile(id),
        getPresence(id),
        getFriendCount(id),
        getFollowers(id),
        getFollowing(id),
        getBadges(id),
        getFriendList(id)
      ])

      res.status(200).json({
        status: true,
        data: {
          account: {
            username: userDetails.name,
            displayName: userDetails.displayName,
            profilePicture,
            description: userDetails.description || '-',
            created: userDetails.created,
            isBanned: userDetails.isBanned || false,
            hasVerifiedBadge: userDetails.hasVerifiedBadge || false,
          },
          presence: {
            isOnline: presence.isOnline,
            lastOnline: presence.lastOnline,
            recentGame: presence.location
          },
          stats: {
            friendCount,
            followers,
            following
          },
          badges,
          friendList
        }
      })
    } catch (err) {
      console.error('[ ROBLOX STALK ERROR ]', err.response?.status, err.response?.data || err.message)
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat mengambil data',
        error: err.message
      })
    }
  })
}