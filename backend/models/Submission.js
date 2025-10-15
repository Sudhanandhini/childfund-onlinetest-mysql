import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completionTime: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'submissions',
  timestamps: false,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['submittedAt']
    },
    {
      fields: ['sessionId']
    }
  ]
});

export default Submission;