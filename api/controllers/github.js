const axios = require('axios');
const githubOAuth = require('github-oauth');

const Settings = require('../../settings');
const chatModel = require('../models/chat');


const config = Settings.getConfig();
const {
  clientId,
  clientSecret,
  baseURL,
  loginURI,
  callbackURI,
  scope,
} = config.github;

const oauth = githubOAuth({
  githubClient: clientId,
  githubSecret: clientSecret,
  baseURL: baseURL,
  loginURI: loginURI,
  callbackURI: callbackURI,
  scope: scope,
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
      .then(() => console.log(`Github credentials for chat ${chat_id} updated.`));
  });

  serverResponse.send(token);
});

const getIssuesFromResporitory = async (chatId, owner, repository) => {
  try {
    const chat = await chatModel.findOne({ telegram_id: chatId });
    if (!chat) {
      throw(new Error('This chat is not registered, please use the /setup command and configure the integrations.'));
    }
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repository}/issues?access_token=${chat.github_access_token}&per_page=100`);

    // Filter issues that are pull request
    // because the api endpoint give us issues + pull requests.
    const issues = response.data.filter((issue) => {
      return !issue.pull_request;
    });
    return {
      data: issues,
      link: response.headers.link,
    }
  } catch (e) {
    throw(e);
  }
};

const getIssuesFromResporitoryByURL = async (url) => {
  try {
    const response = await axios.get(url);

    // Filter issues that are pull request
    // because the api endpoint give us issues + pull requests.
    const issues = response.data.filter((issue) => {
      return !issue.pull_request;
    });
    return {
      data: issues,
      link: response.headers.link,
    }
  } catch (e) {
    throw(e);
  }
};

const getCommentsFromIssue = async (chatId, owner, repository, idIssue) => {
  try {
    const chat = await chatModel.findOne({ telegram_id: chatId });
    if (!chat) {
      throw(new Error('This chat is not registered, please use the /setup command and configure the integrations.'));
    }
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repository}/issues/${idIssue}/comments?access_token=${chat.github_access_token}`);
    return response.data;
  } catch (e) {
    throw(e);
  }
};

module.exports = {
  login,
  callback,
  getIssuesFromResporitory,
  getIssuesFromResporitoryByURL,
  getCommentsFromIssue,
}
