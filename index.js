const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');
// const config = require('../config/config.json');

// const config = require('../config/config')[process.env.NODE_ENV || 'development'];

// const sequelize = new Sequelize(config.database, config.username, config.password, {
//   host: config.host,
//   dialect: config.dialect,
// });

//**In Futue need devlo produc then use 2 .env**/

const sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, {
  host: config.development.host,
  dialect: config.development.dialect,
});

const db = {};

fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js')
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
