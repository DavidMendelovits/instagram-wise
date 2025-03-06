import { Collection, Post } from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL || ''
  : 'http://localhost:8000';


// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

// Posts API
export const postsApi = {
  getAll: async (): Promise<Post[]> => {
    const response = await fetch(`${API_BASE_URL}/api/posts`);
    return handleResponse(response);
  },

  getByCollection: async (collection: string): Promise<Post[]> => {
    const response = await fetch(`${API_BASE_URL}/api/posts/${collection}`);
    return handleResponse(response);
  }
};

// Collections API
export const collectionsApi = {
  getAll: async (): Promise<Record<string, Collection>> => {
    const response = await fetch(`${API_BASE_URL}/api/collections`);
    return handleResponse(response);
  },

  getOne: async (collection: string): Promise<Collection> => {
    const response = await fetch(`${API_BASE_URL}/api/collections/${collection}`);
    return handleResponse(response);
  },

  updateSettings: async (collections: Record<string, Collection>): Promise<{ success: boolean; collections: Record<string, Collection> }> => {
    const response = await fetch(`${API_BASE_URL}/api/settings/collections`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collections }),
    });
    return handleResponse(response);
  }
};

// Stats API
export const statsApi = {
  get: async () => {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    return handleResponse(response);
  }
};

// System API
export const systemApi = {
  health: async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return handleResponse(response);
  },

  sync: async () => {
    const response = await fetch(`${API_BASE_URL}/api/sync`, {
      method: 'POST',
    });
    return handleResponse(response);
  }
};

// Image proxy
export const getProxiedImageUrl = (imageUrl: string): string => {
  return `${API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
};

// Export all APIs as a single object
const api = {
  posts: postsApi,
  collections: collectionsApi,
  stats: statsApi,
  system: systemApi,
  getProxiedImageUrl,
};

export default api; 