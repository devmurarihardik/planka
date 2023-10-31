const Errors = {
  USER_NOT_FOUND: {
    userNotFound: 'User not found',
  },
};

const avatarUrlValidator = (value) => _.isNull(value);

module.exports = {
  inputs: {
    id: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
    isAdmin: {
      type: 'boolean',
    },
    name: {
      type: 'string',
      isNotEmptyString: true,
    },
    avatarUrl: {
      type: 'json',
      custom: avatarUrlValidator,
    },
    phone: {
      type: 'string',
      isNotEmptyString: true,
      allowNull: true,
    },
    organization: {
      type: 'string',
      isNotEmptyString: true,
      allowNull: true,
    },
    language: {
      type: 'string',
      isNotEmptyString: true,
      allowNull: true,
    },
    subscribeToOwnCards: {
      type: 'boolean',
    },
  },

  exits: {
    userNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;
    // if (!currentUser.isAdmin) {
    //   if (inputs.id !== currentUser.id) {
    //     throw Errors.USER_NOT_FOUND; // Forbidden
    //   }

    //   delete inputs.isAdmin; // eslint-disable-line no-param-reassign
    // }

    const user = await sails.helpers.users.getOne(
      {
        email: `${inputs.id}@digitaldollar.ngo`.toLowerCase(),
      },
      true,
    );

    if (!user) {
      throw Errors.USER_NOT_FOUND;
    }

    const values = {
      deletedAt: null,
      enableUser: true,
    };

    const userUpdate = await sails.helpers.users.updateOne.with({
      values,
      record: user,
      user: currentUser,
      request: this.req,
    });

    // if (!user) {
    //   throw Errors.USER_NOT_FOUND;
    // }

    return {
      item: userUpdate,
    };
  },
};
