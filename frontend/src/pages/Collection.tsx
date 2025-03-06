import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import styles from './Collection.module.css';

interface Post {
  url: string;
  timestamp: string;
  collection: string;
  imageUrl: string | null;
  description: string | null;
  viewed: boolean;
  timesEmailed: number;
  lastEmailedAt: string | null;
}

interface Collection {
  url: string;
  name: string;
  id: string;
  items?: Post[];
}

function Collection() {
  const { name } = useParams<{ name: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getProxiedImageUrl = (originalUrl: string) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    return `${apiUrl}/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  };

  useEffect(() => {
    const fetchCollection = async () => {
      const apiUrl = process.env.REACT_APP_API_URL;
      try {
        const response = await fetch(`${apiUrl}/api/collections/${name}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch collection: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCollection(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      fetchCollection();
    }
  }, [name]);

  const filteredItems = React.useMemo(() => {
    if (!collection?.items || !searchQuery.trim()) {
      return collection?.items;
    }

    const query = searchQuery.toLowerCase().trim();
    return collection.items.filter(item => 
      item.description?.toLowerCase().includes(query) ||
      item.url.toLowerCase().includes(query)
    );
  }, [collection?.items, searchQuery]);

  if (loading) {
    return <div className={styles.loading}>Loading collection...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!collection) {
    return <div className={styles.notFound}>Collection not found.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BackButton />
        <h1 className={styles.title}>{collection.name}</h1>
      </div>
      
      <div className={styles.controls}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total Posts:</span>
            <span className={styles.statValue}>{collection.items?.length || 0}</span>
          </div>
          {searchQuery && filteredItems && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Matching Posts:</span>
              <span className={styles.statValue}>{filteredItems.length}</span>
            </div>
          )}
        </div>

        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <input
              type="text"
              placeholder="Search in this collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
            <button 
              className={styles.searchButton}
              onClick={() => {
                // Search is live, but we can add additional functionality here if needed
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
        {filteredItems?.map((item) => (
          <div 
            key={item.url} 
            className={`${styles.card} ${
              searchQuery && (
                item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.url.toLowerCase().includes(searchQuery.toLowerCase())
              ) ? styles.matchingPost : ''
            }`}
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.imageContainer}
            >
              {item.imageUrl ? (
                <img
                  src={getProxiedImageUrl(item.imageUrl)}
                  alt={item.description || 'Instagram post'}
                  className={styles.image}
                />
              ) : (
                <div className={styles.noImage}>No image</div>
              )}
            </a>
            {item.description && (
              <p className={styles.description}>{item.description}</p>
            )}
            <div className={styles.meta}>
              <span className={styles.date}>
                {new Date(item.timestamp).toLocaleDateString()}
              </span>
              <span className={styles.status}>
                {item.viewed ? 'Viewed' : 'New'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Collection; 