const axios = require('axios')

module.exports = function (app) {
  app.get('/stalk/ml', async (req, res) => {
    const { id, zoneId } = req.query

    if (!id || !zoneId) {
      return res.status(400).json({
        status: false,
        message: 'Parameter id dan zoneId diperlukan'
      })
    }

    try {
      const params = new URLSearchParams({
        productId: '1',
        itemId: '2',
        catalogId: '57',
        paymentId: '352',
        gameId: id,
        zoneId: zoneId,
        product_ref: 'REG',
        product_ref_denom: 'AE'
      })

      const response = await axios.post(
        'https://api.duniagames.co.id/api/transaction/v1/top-up/inquiry/store',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: 'https://www.duniagames.co.id/',
            Accept: 'application/json'
          }
        }
      )

      const nickname = response.data.data?.gameDetail?.userName

      if (!nickname) {
        return res.status(404).json({
          status: false,
          message: 'Nickname tidak ditemukan. Pastikan ID dan Zone ID benar.'
        })
      }

      res.status(200).json({
        status: true,
        data: {
          nickname
        }
      })
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan saat mengambil data',
        error: error.message
      })
    }
  })
}
