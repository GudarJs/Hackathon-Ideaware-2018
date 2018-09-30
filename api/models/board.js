const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const boardSchema = new Schema({
    _chat: {type: String, ref: 'chat'},
    id: { type: String },
    name: { type: String },
});

module.exports = mongoose.model('board', boardSchema);
