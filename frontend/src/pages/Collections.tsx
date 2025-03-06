import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Collections.module.css';

interface Collection {
  url: string;
  name: string;
  id: string;
  items?: Array<{
    url: string;
    timestamp: string;
    collection: string;
    imageUrl: string | null;
    description: string | null;
    viewed: boolean;
    timesEmailed: number;
    lastEmailedAt: string | null;
  }>;
}

interface CollectionsResponse {
  [key: string]: Collection;
}

function Collections() {
  const [collections, setCollections] = useState<CollectionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getProxiedImageUrl = (originalUrl: string) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    return `${apiUrl}/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  };

  useEffect(() => {
    const fetchCollections = async () => {
      const apiUrl = process.env.REACT_APP_API_URL;
      console.log('API URL:', apiUrl);
      
      try {
        const response = await fetch(`${apiUrl}/api/collections`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch collections: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON response but got ${contentType}`);
        }
        
        const data = await response.json();
        console.log('Collections data:', data);
        setCollections(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const processedCollections = React.useMemo(() => {
    if (!collections) return null;
    if (!searchQuery.trim()) return collections;

    const query = searchQuery.toLowerCase().trim();
    const processed: CollectionsResponse = {};

    Object.entries(collections).forEach(([name, collection]) => {
      if (!collection.items) {
        processed[name] = collection;
        return;
      }

      // Sort items based on search match
      const sortedItems = [...collection.items].sort((a, b) => {
        const aMatches = (a.description?.toLowerCase().includes(query) || a.url.toLowerCase().includes(query)) ? 1 : 0;
        const bMatches = (b.description?.toLowerCase().includes(query) || b.url.toLowerCase().includes(query)) ? 1 : 0;
        return bMatches - aMatches;
      });

      processed[name] = {
        ...collection,
        items: sortedItems
      };
    });

    return processed;
  }, [collections, searchQuery]);

  if (loading) {
    return <div className={styles.loading}>Loading collections...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!collections) {
    return <div className={styles.noCollections}>No collections found.</div>;
  }

  const hasMatches = (collection: Collection): boolean => {
    if (!collection.items || !searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase().trim();
    return collection.items.some(item => 
      item.description?.toLowerCase().includes(query) || 
      item.url.toLowerCase().includes(query)
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Instagram Collections</h1>
      <div className={styles.header}>
        <Link to="/digest" className={styles.digestButton}>
          View Daily Digest
        </Link>
        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <input
              type="text"
              placeholder="Search through all saved posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Search is already live, but we can add additional functionality here if needed
                }
              }}
            />
            <button 
              className={styles.searchButton}
              onClick={() => {
                // Search is already live, but we can add additional functionality here if needed
              }}
              aria-label="Search"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M19 19L13.8 13.8M16 8.5C16 12.6421 12.6421 16 8.5 16C4.35786 16 1 12.6421 1 8.5C1 4.35786 4.35786 1 8.5 1C12.6421 1 16 4.35786 16 8.5Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className={styles.grid}>
        {Object.entries(processedCollections || {}).map(([name, collection]) => (
          <div 
            key={collection.id} 
            className={`${styles.card} ${hasMatches(collection) ? styles.hasMatches : ''}`}
          >
            <div className={styles.cardContent}>
              <h2 className={styles.collectionTitle}>{name}</h2>
              <p className={styles.postCount}>
                {collection.items ? `${collection.items.length} posts` : 'No posts yet'}
              </p>
              {collection.items && collection.items.length > 0 && (
                <div className={styles.previewGrid}>
                  {collection.items.slice(0, 3).map((item) => (
                    <a
                      key={item.url}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.previewImage} ${
                        searchQuery && (
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.url.toLowerCase().includes(searchQuery.toLowerCase())
                        ) ? styles.matchingPost : ''
                      }`}
                    >
                      {item.imageUrl ? (
                        <img
                          src={getProxiedImageUrl(item.imageUrl)}
                          alt={item.description || 'Instagram post'}
                        />
                      ) : (
                        <div className={styles.noImage}>
                          No image
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              )}
              <Link
                to={`/collection/${name}`}
                className={styles.viewButton}
              >
                View Collection
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Collections; 