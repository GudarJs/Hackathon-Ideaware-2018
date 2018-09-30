const express = require('express');
const trello = require('./controllers/trello');
const github = require('./controllers/github');

// TODO: Implement express-session
class HttpServer {
    constructor(port) {
        this.port = port;
        this.app = express();
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log('HTTP server up and running...🏃🏃🏻');
            console.log(`Listening on port ${this.port}`);
        });

        this.app.get('/health', (req, res) => res.send('Healthy'));
        this.app.get('/trello-login/:chat_id', trello.login);
        this.app.get('/trello-callback', trello.callback);
        this.app.get('/github-login/:chat_id', github.login);
        this.app.get('/github-callback', github.callback);
    }
}

module.exports = HttpServer;
