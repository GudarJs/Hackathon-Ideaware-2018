const dotenv = require('dotenv');


class Settings {
    static load() {
        dotenv.config()
    }

    static getConfig() {
        return {
            telegram: {
                token: process.env.TELEGRAM_TOKEN,
            },
            trello: {
                api_key: process.env.TRELLO_API_KEY,
                api_secret: process.env.TRELLO_API_SECRET
            },
            github: {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET
            }
        }
    };
}


module.exports = Settings;
