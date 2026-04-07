const cheerio = require("cheerio");
const fetch = require("node-fetch");

module.exports = function(app) {
  async function getHentaiList() {
    const page = Math.floor(Math.random() * 1153);
    const response = await fetch(`https://sfmcompile.club/page/${page}`);
    const htmlText = await response.text();
    const $ = cheerio.load(htmlText);

    const hasil = [];
    $("#primary > div > div > ul > li > article").each(function (_, b) {
      hasil.push({
        title: $(b).find("header > h2").text(),
        link: $(b).find("header > h2 > a").attr("href"),
        category: $(b).find("header > div.entry-before-title > span > span").text().replace("in ", ""),
        share_count: $(b).find("header > div.entry-after-title > p > span.entry-shares").text(),
        views_count: $(b).find("header > div.entry-after-title > p > span.entry-views").text(),
        type: $(b).find("source").attr("type") || "image/jpeg",
        video_1: $(b).find("source").attr("src") || $(b).find("img").attr("data-src"),
        video_2: $(b).find("video > a").attr("href") || "",
      });
    });

    return hasil;
  }

  app.get('/nsfw/hentaivid', async (req, res) => {
    try {
      const list = await getHentaiList();
      if (list.length === 0) throw new Error("No content found");

      const randomItem = list[Math.floor(Math.random() * list.length)];
      res.json(randomItem);
    } catch (error) {
      res.status(500).send(`Error: ${error.message}`);
    }
  });
};
