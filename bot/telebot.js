const Telebot = require('telebot');
const {
    setupHandler,
    createTrelloBoardHandler,
    moveIssuesHandler,
} = require('./handlers');


class Android18 {
    constructor() {
        this.bot = new Telebot(process.env.TELEGRAM_TOKEN);
    }

    listen() {
        this.bot.on('/start', msg => msg.replay.text('Welcome to Scrum Android18 Bot'));
        this.bot.on('/setup', setupHandler);
        this.bot.on(/^\/board (.+)$/, createTrelloBoardHandler);
        this.bot.on(/^\/sync (.+)$/, moveIssuesHandler);
        
        this.bot.start();
    }
}

module.exports = Android18;
