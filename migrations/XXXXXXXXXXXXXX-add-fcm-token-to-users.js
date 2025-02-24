module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn('users', 'fcm_token', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    },
    down: async (queryInterface) => {
      await queryInterface.removeColumn('users', 'fcm_token');
    },
  };
  