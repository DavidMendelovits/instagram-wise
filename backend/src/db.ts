
import fs from 'fs';
import { config } from './config';
import { Database } from './types';
import path from 'path';

// Create data directory if it doesn't exist
if (!fs.existsSync(config.dataPath)) {
    fs.mkdirSync(config.dataPath, { recursive: true });
}
  
  // Database to store posts and track what's been sent
const dbPath = path.join(config.dataPath, 'posts-db.json');
let db: Database = { posts: [], sentHistory: [], lastSync: null };
  
  // Load existing database if available
if (fs.existsSync(dbPath)) {
    try {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      console.log(`Loaded database with ${db.posts?.length} posts.`);
    } catch (e) {
      console.error('Error loading database:', e);
    }
}
  
// Save database
const saveDb = (): void => {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('Database saved.');
};

export { db, saveDb };
  