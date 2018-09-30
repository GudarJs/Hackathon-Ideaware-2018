const trelloapi = require('../api/controllers/trello');
const githubapi = require('../api/controllers/github');

const chatModel = require('../api/models/chat');


const setupHandler = (message) => {
    const telegram_id = message.from.id;

    message.reply.text(
    `Please follow the following instructions to setup the integratons.
-------------------------------

Trello integraton intructions:
- Grant access by enter the following link: http://localhost:3000/trello-login/${telegram_id}

Github integraton intructions:
- Grant access by enter the following link: http://localhost:3000/github-login/${telegram_id}`
    )

    chatModel.findOne({ telegram_id: telegram_id })
    .exec((err, chat) => {
        if (chat) { 
            console.error('Chat already exist.')
            return;
        }

        chat = new chatModel({ telegram_id: telegram_id });
        chat.save()
            .then(() => console.log('Chat created.'));
    });
}

const createTrelloBoardHandler = async (message, props) => {
    try {
        const boardName = props.match[1];
        const chatId = message.from.id;

        await trelloapi.createBoardRequest(chatId, boardName);
        message.reply.text('Board created.');
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) { console.error('Data:', e.response.data); }
        message.reply.text(e.message);
    }
}

const moveIssuesHandler = async (message, props) => {
    try {
        let command = props.match[1];
        command = command.split(' ');

        if (command.length > 3) {
            throw(new Error(`Please use the following format: /sync <board name> <repository owner> <repository name>, if the board name have spaces replace it by '_'`))
        }
        const [ board, owner, repository ] = command;
        const boardName = board.replace('_', ' ');
        const chatId = message.from.id;

        message.reply.text(`Fetching issues from '${repository}' repository by '${owner}'`);
        let issues = await githubapi.getIssuesFromResporitory(chatId, owner, repository);
        let cards = await trelloapi.getCardsRequest(chatId, boardName);
        const issuesToCompare = [];

        const regex1 = /https[:a-z./0-9?_=&]+/g
        const regex2 = /rel[="a-z]+/g
        const regex3 = /page[=0-9]+/g
        let url;
        let currentPage = 1;
        let lastPage = 1;
        let issuesToAdd;

        while (true) {
            if (issues.link !== undefined) {
                const links = issues.link.split(',');
                const nextLink = links.find((link) => {
                    const rel = link.match(regex2)[0];
                    return rel === 'rel="next"';
                });
                const lastLink = links.find((link) => {
                    const rel = link.match(regex2)[0];
                    return rel === 'rel="last"';
                });
                if (currentPage > lastPage) {
                    break;
                }

                if (lastLink !== undefined) {
                    lastPage = parseInt(lastLink.match(regex3)[1].replace('page=', ''));
                }
                message.reply.text(`Syncing page ${currentPage} from ${lastPage}.`);

                if (nextLink !== undefined) {
                    url = nextLink.match(regex1)[0];
                    currentPage = parseInt(nextLink.match(regex3)[1].replace('page=', ''));
                } else {
                    currentPage = currentPage + 1;
                }
            }

            issuesToAdd = issues.data.filter((issue) => {
                issuesToCompare.push({ title: issue.title });
                const card = cards.find((card) => {
                    return card.name === issue.title;
                });
                return card === undefined;
            });
            
            message.reply.text(`Moving ${issuesToAdd.length} issues from github to trello.`);
    
            for (const index in issuesToAdd) {
                const issue = issuesToAdd[index];
                let due_date, comments;
                
                if (issue.milestone) {
                    due_date = issue.milestone.due_on;
                }
                if (issue.comments > 0) {
                    comments = await githubapi.getCommentsFromIssue(chatId, owner, repository, issue.number);
                }
                const body = (issue.body.length > 1024) ? `${issue.body.substring(0, 1024)}...` : issue.body;
                const desc = `${body}\n\n${issue.html_url}`;
                await trelloapi.createCardRequest(chatId, boardName, issue.title, desc, issue.assignees, due_date, comments);
            }

            if (issues.link === undefined) {
                break;
            }

            issues = await githubapi.getIssuesFromResporitoryByURL(url);
        }

        cards = await trelloapi.getCardsRequest(chatId, boardName);
        const cardsToDelete = cards.filter((card) => {
            const issue = issuesToCompare.find((issue) => {
                return issue.title === card.name;
            });
            return issue === undefined;
        });

        message.reply.text(`Closing ${cardsToDelete.length} from trello (issues not finded on github).`);

        if (issuesToAdd.length === 0 && cardsToDelete.length === 0) {
            message.reply.text('Trello is up to date. No need for syncing.');
            return;
        }

        for (const index in cardsToDelete) {
            const card = cardsToDelete[index];
            await trelloapi.deleteCardRequest(chatId, card.id);
        }

        message.reply.text('Sync completed successfully.');
    } catch (e) {
        console.error('Error:', e.message);
        if (e.response) { console.error('Data:', e.response.data); }
        message.reply.text(e.message);
    }
}

module.exports = {
    setupHandler,
    createTrelloBoardHandler,
    moveIssuesHandler,
}
