const axios = require('axios');

module.exports = function(app) {
    app.get('/search/charakter', async (req, res) => {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({ 
                status: false, 
                error: 'Character name is required' 
            });
        }

        const query = `
            query ($name: String) {
                Character(search: $name) {
                    name {
                        full
                        native
                        alternative
                    }
                    image {
                        large
                    }
                    description(asHtml: false)
                    age
                    gender
                    media(sort: [POPULARITY_DESC], perPage: 5) {
                        edges {
                            node {
                                title {
                                    romaji
                                    english
                                }
                                type
                            }
                        }
                    }
                }
            }
        `;

        try {
            const response = await axios.post('https://graphql.anilist.co', {
                query,
                variables: { name }
            });

            const character = response.data.data.Character;

            if (!character) {
                return res.status(404).json({ 
                    status: false, 
                    error: 'Character not found on AniList' 
                });
            }

            const mediaList = character.media.edges.map(e => 
                e.node.title.romaji || e.node.title.english
            );
            const topMedia = [...new Set(mediaList)].filter(Boolean).slice(0, 5);

            const result = {
                name: {
                    full: character.name.full,
                    native: character.name.native,
                    alternative: character.name.alternative || []
                },
                image: character.image.large,
                age: character.age || null,
                gender: character.gender || null,
                topMedia: topMedia,
                description: character.description 
                    ? character.description.slice(0, 200) + 
                      (character.description.length > 200 ? '...' : '')
                    : null
            };

            return res.status(200).json({
                status: true,
                result: result
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ 
                status: false, 
                error: 'Failed to fetch character data' 
            });
        }
    });
};
