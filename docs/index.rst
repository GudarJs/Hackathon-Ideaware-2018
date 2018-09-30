.. Scrum Android18 Bot documentation master file, created by
   sphinx-quickstart on Sun Sep 30 12:51:10 2018.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to Scrum Android18 Bot's documentation!
===============================================

.. toctree::
   :maxdepth: 2
   :caption: Contents:

Telegram bot to move issues from a Github repository to a Trello board.

Features
---------

- Integration with Github v3 api.
- Integration with Trello api.
- Easy configuration using the guide give by the /setup command.
- Automatic creation of Trello board with default three list: Backlog, To Do and Done.
- Push issues from Github repositories to Trello boards.
- Remove cards from Trello board that is not available anymore in the issues of the Github repository.
- Assign automatically Github repository collaborators assigned to the issue to the Trello card.
- If the issue has a milestone, then set automatically the due date to the Trello card.
- Send comments from Github issue to Trello card automatically.
- Support for public/private Github repositories.
- Ability to manage multiples boards and repositories.
- Tested with the keras repository (1880 issues) https://github.com/keras-team/keras. proof: 

How to run the bot server?
---------------------------

Please verify you have installed in your computer the following dependencies:

- node >= 8.12.0
- npm >= 6.4.1

Download the bot server repository:

git clone https://github.com/GudarJs/Hackathon-Ideaware-2018  
cd Hackathon-Ideaware-2018

Now setup the development environment:

npm install  
npm install -g nodemon

Start the project:

npm start

How to use the bot?
---------------------

1. Enter to Telegram and talk to the bot: @ScrumAndroid18Bot.
2. Send the command /setup to receive the instrucctions about how to setup your Github and Trello account.
3. Configure the integrations with the links provided by the last command.
4. Create a Trello board with the command /board <Board Name> (blank spaces between the name are supported).
5. Sync the Github issues with the Trello board created before with the command /sync <Board Name> <Repository Owner> <Repository Name> (In this case blank spaces between the board name are not supported, please use an underscore '_' instead ie. Instead Scrum Master use Scrum_Master).
6. Enjoy the magic :D all your Github issues are in your Trello board.

How to use with different boards and repositories?
---------------------------------------------------

In case you need to create more Trello boards for your different projects, just use the /board <Board Name> command to create them, and then use the command /sync <Board Name> <Repository Owner> <Repository Name> to move the issues from any repo (trust me any!).

How to use with different accounts?
------------------------------------

Just run again the /setup command and configure a new account, then feel free to use the /board and /sync commands.
PD: In case you need to switch back to your original account, just repeat this section.

Commands reference
-------------------

- /start | Reply with a greeting. (Always teach your bot to be polite with humans).
- /setup | Reply a guide to configure the Github and Trello integrations. (Can be used multiple times to swich between accounts).
- /board <Board Name> | Create a Trello board with 3 default list: Backlog, To Do, Done. (Blank spaces between the name are supported).
- /sync <Board Name> <Repository Owner> <Repository Name> | Push issues from Github repository to the selected Trello board. (Blank spaces between the board name are not supported, please use an underscore '_' instead ie. Instead Scrum Master use Scrum_Master).
