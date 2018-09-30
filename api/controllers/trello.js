const OAuth = require('oauth').OAuth;
const url = require('url');

const Settings = require('../../settings');
const chatModel = require('../models/chat');
const boardModel = require('../models/board');
const listModel = require('../models/list');


const config = Settings.getConfig();
const { appName } = config;
const {
  apiKey,
  apiSecret,
  requestURL,
  accessURL,
  authorizeURL,
  loginCallback
} = config.trello;

const oauth_secrets = {};
const chat_ids = {};

const oauth = new OAuth(requestURL, accessURL, apiKey, apiSecret, "1.0A", loginCallback, "HMAC-SHA1");

const login = (req, res) => {
  oauth.getOAuthRequestToken(function(error, token, tokenSecret, results){
    chat_ids[token] = req.params.chat_id;
    oauth_secrets[token] = tokenSecret;
    res.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}&scope=read,write&expiration=never`);
  });
};

const callback = (req, res) => {
    const query = url.parse(req.url, true).query;
    const token = query.oauth_token;
    const tokenSecret = oauth_secrets[token];
    const chat_id = chat_ids[token];
    const verifier = query.oauth_verifier;

    oauth.getOAuthAccessToken(token, tokenSecret, verifier, (error, accessToken, accessTokenSecret, results) => {
      chatModel.findOne({ telegram_id: chat_id })
      .exec((err, chat) => {
        if (!chat || err) {
          return;
        }
        
        chat.trello_accessToken = accessToken;
        chat.trello_accessTokenSecret = accessTokenSecret;
        chat.save()
          .then(() => console.log(`Trello credentials for chat ${chat_id} updated.`));
      });

      oauth.get('https://api.trello.com/1/members/me', accessToken, accessTokenSecret, (error, data, response) => {
        data = JSON.parse(data);
        res.send(`Hi ${data.fullName}, <br />
        you are successfuly authenticated. <br />
        Please close this page.`);
      });
    });
};

const createBoardRequest = async (chatId, boardName) => {
  try {
    const chat = await chatModel.findOne({ telegram_id: chatId });
    if (!chat) {
      throw(new Error('This chat is not registered, please use the /setup command and configure the integrations.'));
    }
    const credentials = {
      accessToken: chat.trello_accessToken,
      accessTokenSecret: chat.trello_accessTokenSecret,
    }

    const board = await createBoard(boardName, credentials);
    await createList('Done', board.id, credentials);
    await createList('To Do', board.id, credentials);
    const list = await createList('Backlog', board.id, credentials);

    const boardDb = await new boardModel({
      _chat: chat._id,
      id: board.id,
      name: board.name
    }).save();
    await new listModel({
      _board: boardDb._id,
      id: list.id,
      name: list.name
    }).save();
  } catch (e) {
    throw(e);
  }
}

const createCardRequest = async (chatId, boardName, name, desc, assignees, due_on, comments) => {
  try {
    const chat = await chatModel.findOne({ telegram_id: chatId });
    if (!chat) {
      throw(new Error('This chat is not registered, please use the /setup command and configure the integrations.'));
    }
    const board = await boardModel.findOne({ _chat: chat._id, name: boardName });
    if (!board) {
      throw(new Error(`Card can't be created, please verify that the '${boardName}' board exists.`));
    }
    const list = await listModel.findOne({ _board: board._id });
    if (!list) {
      throw(new Error('Card can\'t be created, please verify that the \'Backlog\' list exists.'));
    }
    const credentials = {
      accessToken: chat.trello_accessToken,
      accessTokenSecret: chat.trello_accessTokenSecret,
    }

    const card = await createCard(list.id, name, desc, due_on, credentials);

    const members = await getMembersFromBoard(board.id, credentials);
    for (const index in assignees) {
      const assignee = assignees[index];
      const member = members.find((member) => {
        return member.username === assignee.login.toLowerCase();
      });
      if (member === undefined) { continue; }
      await addMemberToCard(card.id, member.id, credentials);
    }
    for (const index in comments) {
      const comment = comments[index];
      const body = (comment.body.length > 512) ? `${comment.body.substring(0, 512)}...` : comment.body;
      const commentText = `${body}\n${comment.html_url}`;
      await addCommentToCard(card.id, commentText, credentials);
    }
  } catch(e) {
    throw(e);
  }
}

const getListId = async (chatId, boardName) => {
  try {
    const chat = await chatModel.findOne({ telegram_id: chatId });
    if (!chat) {
      throw(new Error('This chat is not registered, please use the /setup command and configure the integrations.'));
    }
    const board = await boardModel.findOne({ _chat: chat._id, name: boardName });
    if (!board) {
      throw(new Error(`Please verify that the '${boardName}' board exists.`));
    }
    const list = await listModel.findOne({ _board: board._id });
    if (!list) {
      throw(new Error('Please verify that the \'Backlog\' list exists.'));
    }

    return list.id;
  } catch(e) {
    throw(e);
  }
}

const deleteCardRequest = async (chatId, id) => {
  try {
    const chat = await chatModel.findOne({ telegram_id: chatId });
    if (!chat) {
      throw(new Error('This chat is not registered, please use the /setup command and configure the integrations.'));
    }
    const credentials = {
      accessToken: chat.trello_accessToken,
      accessTokenSecret: chat.trello_accessTokenSecret,
    }

    await deleteCard(id, credentials);
  } catch(e) {
    throw(e);
  }
}

const getCardsRequest = async (chatId, boardName) => {
  try {
    const chat = await chatModel.findOne({ telegram_id: chatId });
    if (!chat) {
      throw(new Error('This chat is not registered, please use the /setup command and configure the integrations.'));
    }
    const board = await boardModel.findOne({ _chat: chat._id, name: boardName });
    if (!board) {
      throw(new Error(`Cards can't be fetched, please verify that the '${boardName}' board exists.`));
    }
    const credentials = {
      accessToken: chat.trello_accessToken,
      accessTokenSecret: chat.trello_accessTokenSecret,
    }

    return await getCards(board.id, credentials);
  } catch(e) {
    throw(e);
  }
}

const createBoard = (name, credentials) => {
  const data = {
    name: name,
    defaultLists: false,
  }
  const { accessToken, accessTokenSecret } = credentials;

  return new Promise((resolve, reject) => {
    oauth.post('https://api.trello.com/1/boards/', accessToken, accessTokenSecret, data, (error, data) => {
      if (error) { return reject(new Error(error.data)); }
      resolve(JSON.parse(data));
    });
  });
}

const createList = (name, idBoard, credentials) => {
  const data = {
    name: name,
    idBoard: idBoard,
  }
  const { accessToken, accessTokenSecret } = credentials;

  return new Promise((resolve, reject) => {
    oauth.post('https://api.trello.com/1/lists/', accessToken, accessTokenSecret, data, (error, data) => {
      if (error) { return reject(new Error(error.data)); }
      resolve(JSON.parse(data));
    });
  });
}

const createCard = (idList, name, desc, due_on, credentials) => {
  const data = {
    name: name,
    idList: idList,
    desc: desc,
    due: due_on,
  }
  const { accessToken, accessTokenSecret } = credentials;

  return new Promise((resolve, reject) => {
    oauth.post('https://api.trello.com/1/cards/', accessToken, accessTokenSecret, data, (error, data) => {
      if (error) { return reject(new Error(error.data)); }
      resolve(JSON.parse(data));
    });
  });
}

const deleteCard = (idCard, credentials) => {
  const data = {
    closed: 'true',
  }
  const { accessToken, accessTokenSecret } = credentials;

  return new Promise((resolve, reject) => {
    oauth.put(`https://api.trello.com/1/cards/${idCard}`, accessToken, accessTokenSecret, data, (error, data) => {
      if (error) { return reject(new Error(error.data)); }
      resolve(JSON.parse(data));
    });
  });
}

const getMembersFromBoard = (idBoard, credentials) => {
  const { accessToken, accessTokenSecret } = credentials;

  return new Promise((resolve, reject) => {
    oauth.get(`https://api.trello.com/1/boards/${idBoard}/members`, accessToken, accessTokenSecret, (error, data) => {
      if (error) { return reject(new Error(error.data)); }
      resolve(JSON.parse(data));
    });
  });
}

const addMemberToCard = (idCard, idMember, credentials) => {
  const data = {
    value: idMember,
  }
  const { accessToken, accessTokenSecret } = credentials;

  return new Promise((resolve, reject) => {
    oauth.post(`https://api.trello.com/1/cards/${idCard}/idMembers`, accessToken, accessTokenSecret, data, (error, data) => {
      if (error) { return reject(new Error(error.data)); }
      resolve(JSON.parse(data));
    });
  });
}

const addCommentToCard = (idCard, comment, credentials) => {
  const data = {
    text: comment,
  }
  const { accessToken, accessTokenSecret } = credentials;

  return new Promise((resolve, reject) => {
    oauth.post(`https://api.trello.com/1/cards/${idCard}/actions/comments`, accessToken, accessTokenSecret, data, (error, data) => {
      if (error) { return reject(new Error(error.data)); }
      resolve(JSON.parse(data));
    });
  });
}

const getCards = (idBoard, credentials) => {
  const { accessToken, accessTokenSecret } = credentials;

  return new Promise((resolve, reject) => {
    oauth.get(`https://api.trello.com/1/boards/${idBoard}/cards/`, accessToken, accessTokenSecret, (error, data) => {
      if (error) { return reject(new Error(error.data)); }
      resolve(JSON.parse(data));
    });
  });
}

module.exports = {
    login,
    callback,
    createBoardRequest,
    createCardRequest,
    deleteCardRequest,
    getCardsRequest,
    getListId,
};
