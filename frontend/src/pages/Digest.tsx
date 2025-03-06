import React, { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import styles from './Digest.module.css';

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

function Digest() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getProxiedImageUrl = (originalUrl: string) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    return `${apiUrl}/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  };

  useEffect(() => {
    const fetchRandomPosts = async () => {
      const apiUrl = process.env.REACT_APP_API_URL;
      try {
        const response = await fetch(`${apiUrl}/api/collections`);
        if (!response.ok) {
          throw new Error(`Failed to fetch collections: ${response.statusText}`);
        }

        const collections = await response.json();
        const allPosts: Post[] = [];
        
        // Gather all posts from all collections
        Object.values(collections).forEach((collection: any) => {
          if (collection.items) {
            allPosts.push(...collection.items);
          }
        });

        // Randomly select 5 posts
        const randomPosts = [];
        const postCount = Math.min(5, allPosts.length);
        const usedIndices = new Set();

        while (randomPosts.length < postCount) {
          const randomIndex = Math.floor(Math.random() * allPosts.length);
          if (!usedIndices.has(randomIndex)) {
            usedIndices.add(randomIndex);
            randomPosts.push(allPosts[randomIndex]);
          }
        }

        setPosts(randomPosts);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRandomPosts();
  }, []);

  const nextPost = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length);
  };

  const previousPost = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + posts.length) % posts.length);
  };

  if (loading) {
    return <div className={styles.loading}>Loading digest...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (posts.length === 0) {
    return <div className={styles.noPosts}>No posts available.</div>;
  }

  const currentPost = posts[currentIndex];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BackButton />
        <h1 className={styles.title}>Daily Digest</h1>
      </div>
      <div className={styles.carousel}>
        <button 
          className={`${styles.navButton} ${styles.prevButton}`}
          onClick={previousPost}
        >
          ←
        </button>
        
        <div className={styles.postContainer}>
          <div className={styles.imageContainer}>
            {currentPost.imageUrl ? (
              <img
                src={getProxiedImageUrl(currentPost.imageUrl)}
                alt={currentPost.description || 'Instagram post'}
                className={styles.image}
              />
            ) : (
              <div className={styles.noImage}>No image available</div>
            )}
          </div>
          <div className={styles.postInfo}>
            <p className={styles.description}>{currentPost.description || 'No description'}</p>
            <p className={styles.collection}>From collection: {currentPost.collection}</p>
            <a
              href={currentPost.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.viewButton}
            >
              View on Instagram
            </a>
          </div>
          <div className={styles.progress}>
            {currentIndex + 1} / {posts.length}
          </div>
        </div>

        <button 
          className={`${styles.navButton} ${styles.nextButton}`}
          onClick={nextPost}
        >
          →
        </button>
      </div>
    </div>
  );
}

export default Digest; 