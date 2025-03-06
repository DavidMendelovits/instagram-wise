import path from "path";
import { Config, CollectionSettings } from "./types";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Parse collections from environment variable
export const parseCollections = (): Record<string, CollectionSettings> => {
    try {
      return process.env.COLLECTIONS ? JSON.parse(process.env.COLLECTIONS) : {
        'dance-tutorials': { frequency: 'daily', postsPerEmail: 1 }
      };
    } catch (error) {
      console.error('Error parsing COLLECTIONS environment variable:', error);
      return { 'dance-tutorials': { frequency: 'daily', postsPerEmail: 1 } };
    }
};

// Configuration
export const config: Config = {
    instagram: {
      username: process.env.INSTAGRAM_USERNAME || '',
      password: process.env.INSTAGRAM_PASSWORD || ''
    },
    email: {
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || ''
      },
      recipient: process.env.EMAIL_RECIPIENT || ''
    },
    collections: parseCollections(),
    dataPath: process.env.DATA_PATH || path.join(__dirname, '../data')
  };

