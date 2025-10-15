import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: false
  },
  school: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  class: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  language: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  district: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  totalAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastSubmission: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      fields: ['phone']
    },
    {
      fields: ['createdAt']
    }
  ]
});

export default User;