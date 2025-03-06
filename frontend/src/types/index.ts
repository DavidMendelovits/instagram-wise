export interface Post {
  id: string;
  url: string;
  imageUrl: string;
  caption: string;
  collection: string;
  timesEmailed: number;
  lastEmailedAt?: string;
  createdAt: string;
}

export interface Collection {
  name: string;
  description?: string;
  emailFrequency: number; // days between emails
  lastEmailedAt?: string;
  postsCount: number;
  settings?: CollectionSettings;
}

export interface CollectionSettings {
  emailFrequency?: number;
  enabled?: boolean;
  lastEmailedAt?: string;
}

export interface Stats {
  totalPosts: number;
  totalCollections: number;
  totalEmailsSent: number;
  viewedPosts: number;
  completionRate: number;
  lastSync?: string;
} 