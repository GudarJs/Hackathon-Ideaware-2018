const mongoose = require('mongoose');

require('./settings').load();
const Android18 = require('./bot/telebot');
const HttpServer = require('./api/server');


const android18 = new Android18();
const httpServer = new HttpServer(3000);

android18.listen();
httpServer.listen();

mongoose.connect('mongodb://localhost/scrum_android18_bot', { useNewUrlParser: true })
.then(() => console.log('Connected to Database.'))
.catch(e => console.error(`Error connecting to databse ${e}`));
