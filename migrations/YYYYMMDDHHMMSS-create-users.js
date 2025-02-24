'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Roles',
          key: 'id'
        }
      },
      superior_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      pincode: Sequelize.STRING,
      state: Sequelize.STRING,
      city: Sequelize.STRING,
      street_name: Sequelize.STRING,
      building_no_name: Sequelize.STRING,
      full_name: Sequelize.STRING,
      mobile_number: Sequelize.STRING,
      role_name: {
        type: Sequelize.ENUM('admin', 'user'),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};






// 'use strict';

// module.exports = {
//   up: async (queryInterface, Sequelize) => {
//     await queryInterface.addColumn('Users', 'superior_ado', {
//       type: Sequelize.INTEGER,
//       references: {
//         model: 'Users', // 'Users' is the table name
//         key: 'id'
//       },
//       allowNull: true
//     });
//     await queryInterface.addColumn('Users', 'superior_md', {
//       type: Sequelize.INTEGER,
//       references: {
//         model: 'Users', 
//         key: 'id'
//       },
//       allowNull: true
//     });
//     await queryInterface.addColumn('Users', 'superior_sd', {
//       type: Sequelize.INTEGER,
//       references: {
//         model: 'Users', 
//         key: 'id'
//       },
//       allowNull: true
//     });
//     await queryInterface.addColumn('Users', 'superior_d', {
//       type: Sequelize.INTEGER,
//       references: {
//         model: 'Users',
//         key: 'id'
//       },
//       allowNull: true
//     });
//   },

//   down: async (queryInterface, Sequelize) => {
//     await queryInterface.removeColumn('Users', 'superior_ado');
//     await queryInterface.removeColumn('Users', 'superior_md');
//     await queryInterface.removeColumn('Users', 'superior_sd');
//     await queryInterface.removeColumn('Users', 'superior_d');
//   }
// };
