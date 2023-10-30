const crypto = require('crypto');
const { getRemoteAddress } = require('../../../utils/remoteAddress');

const botToken = '6414352944:AAFcnRpK94qI464w6Oxfk8YVgP3FB0mDNd8'; // my test bot
// const botToken = '6326690316:AAF8UnN9Y9qYWPn217lPxMJqNAuZUa1De0U'; // live bot token

module.exports = {
  inputs: {},
  exits: {
    boardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn() {
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const dataCheckString = Object.keys(this.req.query)
      .filter((key) => key !== 'hash' && key !== 'boardId')
      .map((key) => `${key}=${this.req.query[key]}`)
      .sort()
      .join('\n');
    const checkHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (checkHash === this.req.query.hash) {
      const remoteAddress = getRemoteAddress(this.req);
      const user = await sails.helpers.users.getOneByEmailOrUsername(
        `${this.req.query.id}@digitaldollar.ngo`,
      );
      const accessToken = sails.helpers.utils.createToken(user.id);
      this.res.cookie('accessToken', accessToken);
      this.res.cookie('accessTokenVersion', 1);

      await Session.create({
        accessToken,
        remoteAddress,
        userId: user.id,
        userAgent: this.req.headers['user-agent'],
      });

      try {
        const { board } = await sails.helpers.boards
          .getProjectPath(this.req.query.boardId)
          .intercept('pathNotFound', () => Errors.BOARD_NOT_FOUND);

        await sails.helpers.boardMemberships.createOne
          .with({
            values: {
              canComment: true,
              role: 'viewer',
              board,
              user,
            },
            request: this.req,
          })
          .intercept('userAlreadyBoardMember', () => Errors.USER_ALREADY_BOARD_MEMBER);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('error occure--------------------------d', error);
      }
      this.res.redirect(`https://kanban.tastywaves.live/boards/${this.req.query.boardId}`);
    } else {
      this.res.send('invalid hash value');
    }
    return {};
  },
};
