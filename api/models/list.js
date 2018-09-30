const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const listSchema = new Schema({
    _board: { type: String, ref: 'board' },
    id: { type: String },
    name: { type: String },
});

module.exports = mongoose.model('list', listSchema);
