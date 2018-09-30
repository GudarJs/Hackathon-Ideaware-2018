const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    telegram_id: { type: String },
    trello_accessToken: { type: String },
    trello_accessTokenSecret: { type: String },
    github_access_token: { type: String },
});

module.exports = mongoose.model('chat', chatSchema);
