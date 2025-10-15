import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';

// Import routes
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL connection test
sequelize.authenticate()
  .then(() => {
    console.log('MySQL connected successfully');
    // Sync models with database (creates tables if they don't exist)
    return sequelize.sync({ alter: true }); // use { force: true } to drop and recreate tables
  })
  .then(() => {
    console.log('Database synced');
  })
  .catch((err) => {
    console.error('MySQL connection error:', err);
  });

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'MERN Quiz Server with MySQL is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});