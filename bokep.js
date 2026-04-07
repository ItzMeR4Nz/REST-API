const cheerio = require('cheerio');
const fetch = require('node-fetch');

module.exports = function(app) {
  app.get('/nsfw/bokep', async (req, res) => {
    try {
      const response = await fetch('https://twstalker.com/rinconcaseros');
      if (!response.ok) throw new Error(`Gagal mengambil halaman: ${response.statusText}`);

      const html = await response.text();
      const $ = cheerio.load(html);

      const videoSources = $('video source')
        .map((_, el) => $(el).attr('src'))
        .get();

      res.status(200).json({
        status: true,
        author: $('meta[name="author"]').attr('content') || null,
        description: $('meta[name="description"]').attr('content') || null,
        video: videoSources
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        msg: err.message
      });
    }
  });
};
