import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Certificate = sequelize.define('Certificate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  certificateNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  userName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  school: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  language: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  totalScore: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  maxScore: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  issueDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  generatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'certificates',
  timestamps: true,
  // Indexes are defined via column-level `unique` flags above.
  // Avoid re-declaring indexes here to prevent duplicate-key alter operations when using `sync({ alter: true })`.
});

export default Certificate;