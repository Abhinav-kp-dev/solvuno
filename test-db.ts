import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'NONE');

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log('Successfully connected');
      process.exit(0);
    })
    .catch(err => {
      console.error('Connection error:', err.message);
      process.exit(1);
    });
} else {
  console.log('No MONGODB_URI found in env');
  process.exit(1);
}
