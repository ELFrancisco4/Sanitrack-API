import mongoose from 'mongoose';
import http from 'http';
import app from './index';
import Logger from './utils/logger';
import RoomModel from './models/room';
import Location from './models/location';

// Define the port for the server to listen on
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// MongoDB connection URL
const MONGODB_URI: string = process.env.MONGODB_URI!;

const server: http.Server = http.createServer(app); /*  */

// Connect to MongoDB
mongoose.connect(MONGODB_URI);

// Event handler for successful MongoDB connection
mongoose.connection.on('connected', () => {
  console.log('Database connected successfully');

  // Start the server after the database connection is established
  app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}/api-docs`);
  });
});


// Event handler for MongoDB connection error
mongoose.connection.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
  // Handle the error appropriately (e.g., log, exit the application)
});

const exitHandler = () => {
    if (server) {
      server.close(() => {
        Logger.info('Server closed');
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  }; 
  
  const unexpectedErrorHandler = (error: any) => {
    Logger.error(error);
    exitHandler();
  };
  
  process.on('uncaughtException', unexpectedErrorHandler);
  
  process.on('unhandledRejection', unexpectedErrorHandler);
  
  process.on('SIGTERM', () => {
    Logger.info('SIGTERM received');
    if (server) {
      server.close();
    }
  });
  