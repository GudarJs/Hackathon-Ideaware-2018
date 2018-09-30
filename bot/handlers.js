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
        const issues = await githubapi.getIssuesFromResporitory(chatId, owner, repository);
        const cards = await trelloapi.getCardsRequest(chatId, boardName);

        const issuesToAdd = issues.filter((issue) => {
            const card = cards.find((card) => {
                return card.name === issue.title;
            });
            return card === undefined;
        });
        const cardsToDelete = cards.filter((card) => {
            const issue = issues.find((issue) => {
                return issue.title === card.name;
            });
            return issue === undefined;
        });
        
        if (issuesToAdd.length === 0 && cardsToDelete.length === 0) {
            message.reply.text('You are up to date. No need for syncing.');
            return;
        }
        message.reply.text(`Moving ${issuesToAdd.length} issues from github to trello.
Closing ${cardsToDelete.length} from trello (issues not finded on github).`
        );

        for (const index in issuesToAdd) {
            const issue = issuesToAdd[index];
            let due_date, comments;
            
            if (issue.milestone) {
                due_date = issue.milestone.due_on;
            }
            if (issue.comments > 0) {
                comments = await githubapi.getCommentsFromIssue(chatId, owner, repository, issue.number);
            }

            await trelloapi.createCardRequest(chatId, boardName, issue.title, `${issue.body}\n\n${issue.html_url}`, issue.assignees, due_date, comments);
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
