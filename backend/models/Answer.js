import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  submissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'submissions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'answers',
  timestamps: false,
  indexes: [
    {
      fields: ['submissionId']
    },
    {
      fields: ['questionId']
    }
  ]
});

export default Answer;