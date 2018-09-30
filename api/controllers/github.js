const axios = require('axios');
const githubOAuth = require('github-oauth');

const chatModel = require('../models/chat');
const boardModel = require('../models/board');


const oauth = githubOAuth({
  githubClient: process.env.GITHUB_CLIENT_ID,
  githubSecret: process.env.GITHUB_CLIENT_SECRET,
  baseURL: 'http://localhost:3000',
  loginURI: '/github-login',
  callbackURI: '/github-callback'
});

const chat_ids = {};

const login = (req, res) => {
  chat_ids[0] = req.params.chat_id;
  return oauth.login(req, res);
}

const callback = (req, res) => {
  return oauth.callback(req, res);
}

oauth.on('error', function(err) {
  console.error('there was a login error', err)
});

oauth.on('token', function(token, serverResponse) {
  const chat_id = chat_ids[0];

  chatModel.findOne({ telegram_id: chat_id })
  .exec((err, chat) => {
    if (!chat || err) {
      console.log(chat, err)
      return;
    }
    
    chat.github_access_token = token.access_token;
    chat.save()
      .then(() => console.log(`Update github credentials for chat ${chat_id}.`));
  });

  serverResponse.send(token);
});

const getIssuesFromResporitory = async (owner, repository) => {
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repository}/issues`);

    // Filter issues that are pull request
    // because the api endpoint give us issues + pull requests.
    return response.data.filter((issue) => {
      return !issue.pull_request;
    });
  } catch (e) {
    throw(e);
  }
};

const getCommentsFromIssue = async (owner, repository, idIssue) => {
  try {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repository}/issues/${idIssue}/comments`);
    return response.data;
  } catch (e) {
    throw(e);
  }
};

module.exports = {
  login,
  callback,
  getIssuesFromResporitory,
  getCommentsFromIssue,
}
