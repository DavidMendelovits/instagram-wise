export interface Post {
  url: string;
  timestamp: string;
  collection: string;
  imageUrl: string | null;
  description: string | null;
  viewed: boolean;
  timesEmailed: number;
  lastEmailedAt: string | null;
}

export interface Collection {
  url: string;
  id: string;
  name: string;
  items?: Post[];
}

export interface SentHistoryEntry {
  collection: string;
  postsCount: number;
  sentAt: string;
  messageId?: string;
  manual?: boolean;
}

export interface Database {
  posts?: Post[];
  sentHistory?: SentHistoryEntry[];
  lastSync?: string | null;
  collections?: Record<string, Collection>;
}

export interface EmailResult {
  collection: string;
  count: number;
  messageId?: string;
}
export interface EvaluatePostResult {
    url: string;
    timestamp: string;
    collection: string;
    imageUrl: string | null;
    description: string | null;
  }
  