export * from './instagram';
export * from './puppeteer-types';

// Define types
export interface CollectionSettings {
    frequency: 'daily' | 'weekly' | 'custom';
    postsPerEmail: number;
}
  
export interface Config {
    instagram: {
      username: string;
      password: string;
    };
    email: {
      service: string;
      auth: {
        user: string;
        pass: string;
      };
      recipient: string;
    };
    collections: Record<string, CollectionSettings>;
    dataPath: string;
  }
  