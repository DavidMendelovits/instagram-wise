// src/server.ts
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import puppeteer, { Browser, Page } from 'puppeteer';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import axios from 'axios';
import { CollectionSettings, Config, Database, Post } from './types';
import { scrapeInstagramSavedPosts, scrapePostsFromCurrentView } from './scrape';
import { config } from './config';
import { db } from './db';

// Create Express app
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // Enable CORS for all routes
app.use(express.static('public')); // Serve static files

// Image proxy endpoint
app.get('/api/image-proxy', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  
  if (!imageUrl) {
    return res.status(400).json({ error: 'No image URL provided' });
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Forward the content type
    res.set('Content-Type', response.headers['content-type']);
    
    // Pipe the image data to the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

// Validate configuration
const validateConfig = (): boolean => {
  if (!config.instagram.username || !config.instagram.password) {
    console.error('Missing Instagram credentials in environment variables');
    return false;
  }
  
  return true;
};

// Spaced repetition helpers
function getSpacingTier(timesSeen: number): number {
  // This determines how many times a post should be shown
  if (timesSeen === 0) return 1;     // First viewing
  if (timesSeen === 1) return 2;     // Second viewing
  if (timesSeen === 2) return 3;     // Third viewing
  if (timesSeen === 3) return 4;     // Fourth viewing
  if (timesSeen === 4) return 5;     // Fifth viewing
  return 6;                          // Maximum viewings
}

function getSpacingDays(timesSeen: number): number {
  // How many days to wait between emails
  if (timesSeen === 0) return 1;     // First time: 1 day
  if (timesSeen === 1) return 3;     // Second time: 3 days
  if (timesSeen === 2) return 7;     // Third time: 1 week
  if (timesSeen === 3) return 14;    // Fourth time: 2 weeks
  if (timesSeen === 4) return 30;    // Fifth time: 1 month
  return 90;                         // Subsequent times: 3 months
}

// API Routes

// Get all posts
app.get('/api/posts', (_req: Request, res: Response) => {
  res.json(db.posts || []);
});

// Get posts by collection
app.get('/api/posts/:collection', (req: Request, res: Response) => {
  const collection = req.params.collection;
  const posts = db.posts?.filter(post => post.collection === collection) || [];
  res.json(posts);
});

// Get collections with counts
app.get('/api/collections', (_req: Request, res: Response) => {
  try {
    res.json(db.collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/collections/:collection', (req: Request, res: Response) => {
  try {
    const collectionName = req.params.collection;
    const collection = db.collections?.[collectionName];
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get stats about the system
app.get('/api/stats', (_req: Request, res: Response) => {
  const totalPosts = db.posts?.length || 0;
  const totalCollections = new Set(db.posts?.map(post => post.collection) || []).size;
  const totalEmailsSent = db.sentHistory?.length || 0;
  
  const viewedPosts = db.posts?.filter(post => post.timesEmailed > 0).length || 0;
  const completionRate = totalPosts > 0 ? Math.round((viewedPosts / totalPosts) * 100) : 0;
  
  res.json({
    totalPosts,
    totalCollections,
    totalEmailsSent,
    viewedPosts,
    completionRate,
    lastSync: db.lastSync
  });
});

// Manually trigger Instagram scraping
app.post('/api/sync', async (_req: Request, res: Response) => {
  try {
    console.log('Manual sync requested.');
    const success = await scrapeInstagramSavedPosts();
    if (success) {
      res.json({ success: true, message: 'Sync completed successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Sync failed' });
    }
  } catch (error) {
    console.error('Error during manual sync:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update settings for collections
app.put('/api/settings/collections', (req: Request, res: Response) => {
  const { collections } = req.body;
  
  if (!collections || typeof collections !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid collections object' });
  }
  
  try {
    // Update the collections setting
    config.collections = collections;
    
    // Save to environment if possible
    if (process.env.COLLECTIONS) {
      process.env.COLLECTIONS = JSON.stringify(collections);
    }
    
    res.json({ success: true, collections });
  } catch (error) {
    console.error('Error updating collections settings:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Set up scheduled tasks
function setupScheduledTasks(): void {
  // Run the Instagram scraper daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('Running scheduled Instagram scraper...');
    await scrapeInstagramSavedPosts();
  });
  
  console.log('Scheduled tasks set up.');
}

// Validate configuration before starting
if (!validateConfig()) {
  console.error('Invalid configuration. Please check your environment variables.');
  process.exit(1);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  setupScheduledTasks();
  
  // Run initial scrape if database is empty
  if (db.posts?.length === 0) {
    console.log('Database is empty. Running initial scrape...');
    // scrapeInstagramSavedPosts().then(() => {
    //   console.log('Initial scrape completed.');
    // }).catch(err => {
    //   console.error('Error during initial scrape:', err);
    // });
  }
});