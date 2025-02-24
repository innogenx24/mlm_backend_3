const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../src/config/config');

const sequelize = new Sequelize(config.development.database, config.development.username, config.development.password, {
  host: config.development.host,
  dialect: config.development.dialect,
});


// const environment = process.env.NODE_ENV || 'development'; 
// const envConfig = config[environment];

// const sequelize = new Sequelize(envConfig.database, envConfig.username, envConfig.password, {
//   host: envConfig.host,
//   dialect: envConfig.dialect,
//   logging: environment === 'development', 
// });

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
