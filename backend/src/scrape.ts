import puppeteer, { Browser, Page } from "puppeteer";
import { Collection, EvaluatePostResult, Post } from "./types";
import { db, saveDb } from "./db";
import { config } from "./config";
import path from "path";

const login = async (page: Page) => {
  try {
    // Navigate to Instagram login
    await page.goto("https://www.instagram.com/accounts/login/", {
      waitUntil: "networkidle2",
    });

    // Check if login form is present
    await page.waitForSelector('input[name="username"]', { timeout: 30000 });

    // Enter credentials
    await page.type('input[name="username"]', config.instagram.username);
    await page.type('input[name="password"]', config.instagram.password);

    // Click login button
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle0" }),
    ]);

    // Check for "Save your login info?" dialog and click "Not Now" if it appears
    try {
      const saveLoginButton = await page.waitForSelector(
        "button:nth-child(2)",
        { timeout: 5000 }
      );
      if (saveLoginButton) {
        await saveLoginButton.click();
      }
    } catch (error) {
      console.log('No "Save your login info?" dialog appeared.');
    }

    // Check for "Turn on Notifications" dialog and click "Not Now" if it appears
    try {
      const notNowButton = await page.waitForSelector("button:nth-child(2)", {
        timeout: 5000,
      });
      if (notNowButton) {
        await notNowButton.click();
      }
    } catch (error) {
      console.log('No "Turn on Notifications" dialog appeared.');
    }
    return true;
  } catch (error) {
    console.error("Error during Instagram login:", error);
    return false;
  }
};

const goToSavedPosts = async (page: Page) => {
  await page.goto(
    `https://www.instagram.com/${config.instagram.username}/saved/`,
    { waitUntil: "networkidle2" }
  );
};

const listCollections = async (page: Page) => {
  // Get all collection links
  const collections = await page.evaluate(() => {
    const collectionLinks = Array.from(document.querySelectorAll("a"))
      .filter((a) => a.href.match(/\/saved\/[^\/]+\/\d+/))
      .map((a) => ({
        url: a.href,
        name: a.href.split("/saved/")[1].split("/")[0],
        id: a.href.split("/saved/")[1].split("/")[1],
      }));
    return collectionLinks;
  });

  console.log(`Found ${collections.length} collections.`);
  return collections;
};

// Instagram scraper function with error handling and retries
export async function scrapeInstagramSavedPosts(): Promise<boolean> {
  console.log("Starting Instagram scraper...");

  db.lastSync = new Date().toISOString();

  const browser: Browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page: Page = await browser.newPage();

  // Set a reasonable viewport size
  await page.setViewport({ width: 1280, height: 800 });

  // Set user agent to avoid detection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  try {
    const success = await login(page);
    if (!success) {
      console.error("Failed to login to Instagram.");
    }

    // Navigate to profile
    await page.goto(`https://www.instagram.com/${config.instagram.username}/`, {
      waitUntil: "networkidle2",
    });
    console.log("Navigated to profile page.");

    // Navigate to saved posts - this selector might need adjustment
    await goToSavedPosts(page);
    console.log("Navigated to saved posts.");

    const collections = await listCollections(page);
    console.log(collections);

    db.collections = collections.reduce((acc, collection) => {
      acc[collection.name] = collection;
      return acc;
    }, {} as Record<string, Collection>);

    // Process each collection
    for (const collection of collections) {
      console.log(`Processing collection: ${collection.name}`);

      try {
        // Navigate to the collection URL
        await page.goto(collection.url, { waitUntil: "networkidle2" });
        console.log(`Navigated to collection: ${collection.name}`);

        // Scrape posts from the current collection view
        const posts = await scrapePostsFromCurrentView(page, collection.name);
        db.collections[collection.name].items = posts.map((post) => ({
          ...post,
          viewed: false,
          timesEmailed: 0,
          lastEmailedAt: null,
        }));
        console.log(
          `Found ${posts.length} posts in collection: ${collection.name}`
        );

        // Update database with new posts
        // for (const post of posts) {
        //   // Check if post already exists in db
        //   const existingPost = db.posts?.find(p => p.url === post.url);

        //   if (!existingPost) {
        //     // Add new post
        //     db.posts?.push({
        //       ...post,
        //       viewed: false,
        //       timesEmailed: 0,
        //       lastEmailedAt: null
        //     });
        //   }
        // }
      } catch (error) {
        console.error(`Error processing collection ${collection.name}:`, error);
        continue; // Skip to next collection on error
      }
    }

    // Save updated database
    console.log("saving db");
    saveDb();

    // // Process each collection
    // for (const [collectionName, settings] of Object.entries(
    //   config.collections
    // )) {
    //   console.log(`Processing collection: ${collectionName}`);

    //   // First check if we're in the "All Posts" view and need to select a specific collection
    //   const isInAllPosts = await page.evaluate(() => {
    //     return document.URL.includes("/saved/all-posts");
    //   });

    //   if (isInAllPosts) {
    //     try {
    //       // Try to click on a collection with that name
    //       await page.evaluate((name: string) => {
    //         // Type safety fixes
    //         const collections = Array.from(
    //           document.querySelectorAll('div[role="button"]')
    //         );
    //         const collection = collections.find((el) =>
    //           el.textContent?.includes(name)
    //         );
    //         if (collection) {
    //           (collection as HTMLElement).click();
    //         }
    //       }, collectionName);

    //       // Wait for the page to load the collection
    //       await page.waitForNavigation({ waitUntil: "networkidle2" });
    //       console.log(`Navigated to collection: ${collectionName}`);
    //     } catch (error) {
    //       console.warn(
    //         `Could not navigate to collection: ${collectionName}. Error: ${
    //           (error as Error).message
    //         }`
    //       );
    //       continue; // Skip this collection
    //     }
    //   }

    //   // Now scrape the posts in the current collection
    //   const posts = await scrapePostsFromCurrentView(page, collectionName);
    //   console.log(
    //     `Found ${posts.length} posts in collection: ${collectionName}`
    //   );

    //   // Update database with new posts
    //   for (const post of posts) {
    //     // Check if post is already in database
    //     const existingPostIndex = db.posts.findIndex((p) => p.url === post.url);

    //     if (existingPostIndex === -1) {
    //       // New post
    //       const newPost: Post = {
    //         ...post,
    //         viewed: false,
    //         timesEmailed: 0,
    //         lastEmailedAt: null,
    //       };
    //       db.posts.push(newPost);
    //     } else {
    //       // Update existing post's collection if needed
    //       db.posts[existingPostIndex].collection = post.collection;
    //     }
    //   }
    // }

    // // Save the updated database
    // saveDb();
    console.log("Instagram scraper completed successfully.");
    return true;
  } catch (error) {
    console.error("Error during Instagram scraping:", error);

    // Take a screenshot of the failure for debugging
    const screenshotPath = path.join(config.dataPath, "error-screenshot.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`Error screenshot saved to: ${screenshotPath}`);

    return false;
  } finally {
    await browser.close();
  }
}

// Helper function to scrape posts from the current view
export async function scrapePostsFromCurrentView(
  page: Page,
  collectionName: string
): Promise<EvaluatePostResult[]> {
  // Scroll and collect posts
  const posts: EvaluatePostResult[] = [];
  let previousHeight = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 5; // Limit scrolling to avoid infinite loops

  console.log("Starting to scroll and collect posts...");
  // Scroll to bottom of page and wait for all content to load
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let lastHeight = 0;
      const checkAndScroll = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollTo(0, scrollHeight);

        // If height hasn't changed after scrolling, we've likely reached the bottom
        if (lastHeight === scrollHeight) {
          clearInterval(checkAndScroll);
          resolve();
        }
        lastHeight = scrollHeight;
      }, 1000); // Check every second

      // Failsafe: resolve after 30 seconds to prevent infinite scrolling
      setTimeout(() => {
        clearInterval(checkAndScroll);
        resolve();
      }, 30000);
    });
  });

  // Additional wait to ensure any final dynamic content loads

  // Extract post information
  const newPosts = await page.evaluate((collection: string) => {
    // Find all anchor elements that link to Instagram posts (/p/{id})
    const postElements = Array.from(document.querySelectorAll("a")).filter(
      (a) => a.href.match(/instagram\.com\/p\/[^\/]+\/?/)
    );

    console.log(`found ${postElements.length} posts`);

    // Convert filtered anchors to array and extract data
    return postElements.map((anchor) => {
      const a = anchor as HTMLAnchorElement;
      const img = a.querySelector("img") as HTMLImageElement | null;
      console.log(`adding post ${a.href}`);

      const element = {
        url: a.href,
        timestamp: new Date().toISOString(),
        collection: collection,
        imageUrl: img?.src || null,
        description: img?.alt || null,
      };
      console.log(element);
      return element;
    });
  }, collectionName);

  // Add unique posts to our collection
  for (const post of newPosts) {
    if (!posts.some((p) => p.url === post.url)) {
      posts.push(post);
    }
  }

  return posts;
}
