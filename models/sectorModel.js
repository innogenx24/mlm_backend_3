module.exports = (sequelize, DataTypes) => {
    const Sector = sequelize.define('Sector', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      sector_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Automatically set to current timestamp
        allowNull: false,
        field: 'created_at', // Custom column name
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        field: 'updated_at', // Custom column name
        onUpdate: DataTypes.NOW, // Automatically update to current timestamp on update
      },
    }, {
      tableName: 'sectors',
      timestamps: false, // We are managing created_at and updated_at manually
      underscored: true, // Use snake_case for column names
    });
  
    // Any associations can be defined here, for now, there are none.
    return Sector;
  };
  