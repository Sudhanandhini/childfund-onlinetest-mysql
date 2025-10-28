// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';

// Import routes
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import certificateRoutes from './routes/Certificateroutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve certificates as static files (register before routes that may reference them)
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', certificateRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'MERN Quiz Server with MySQL is running!' });
});

// Error handling middleware (should be after routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server after DB connection & sync
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected successfully');

    // Sync models with database (creates/updates tables)
    // NOTE: use { force: true } only in development when you want to drop tables.
    await sequelize.sync({ alter: true });
    console.log('Database synced');

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Graceful shutdown handlers (optional but useful)
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await sequelize.close();
        console.log('DB connection closed, exiting.');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // recommend exiting in production or reporting to monitoring
    });

  } catch (err) {
    console.error('MySQL connection / sync error:', err);
    process.exit(1); // exit the process with failure
  }
}

startServer();
