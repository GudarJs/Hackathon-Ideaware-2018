const dotenv = require('dotenv');


class Settings {
    static load() {
        dotenv.config()
    }

    static getConfig() {
        return {
            appName: 'Scrum Android18 Bot',
            telegram: {
                token: process.env.TELEGRAM_TOKEN,
            },
            trello: {
                apiKey: process.env.TRELLO_API_KEY,
                apiSecret: process.env.TRELLO_API_SECRET,
                requestURL: 'https://trello.com/1/OAuthGetRequestToken',
                accessURL: 'https://trello.com/1/OAuthGetAccessToken',
                authorizeURL: 'https://trello.com/1/OAuthAuthorizeToken',
                loginCallback: 'http://localhost:3000/trello-callback',
            },
            github: {
                clientId: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                baseURL: 'http://localhost:3000',
                loginURI: '/github-login',
                callbackURI: '/github-callback',
                scope: 'repo',
            }
        }
    };
}


module.exports = Settings;
