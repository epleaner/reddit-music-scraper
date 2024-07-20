// @ts-nocheck
import puppeteer, { Browser } from 'puppeteer';

const API_KEY = process.env.SCRAPEOPS_API_KEY || '';

function getScrapeOpsUrl(url: string, location: string = 'us'): string {
  console.log(`Getting ScrapeOps URL for: ${url}, location: ${location}`);
  const params = new URLSearchParams({
    api_key: API_KEY,
    url: url,
    country: location,
  });
  const scrapeOpsUrl = `https://proxy.scrapeops.io/v1/?${params.toString()}`;
  console.log(`ScrapeOps URL: ${scrapeOpsUrl}`);
  return scrapeOpsUrl;
}

async function getPosts(
  browser: Browser,
  feed: string,
  limit: number = 10,
  retries: number = 3
): Promise<any[]> {
  console.log(
    `Getting posts for feed: ${feed}, limit: ${limit}, retries: ${retries}`
  );
  let tries = 0;
  let success = false;
  let posts = [];

  while (tries <= retries && !success) {
    console.log(`Attempt ${tries + 1} of ${retries + 1}`);
    const page = await browser.newPage();
    try {
      const url = `https://www.reddit.com/r/${feed}.json?limit=${limit}`;
      console.log(`Navigating to: ${getScrapeOpsUrl(url)}`);
      await page.goto(getScrapeOpsUrl(url));
      success = true;
      console.log('Successfully loaded the page');
      const jsonText =
        (await page.$eval('pre', (pre) => pre.textContent)) || '';
      console.log('Retrieved JSON text from page');
      const resp = JSON.parse(jsonText);
      if (resp) {
        console.log('Successfully parsed JSON response');
        const children = resp.data.children;
        console.log(`Found ${children.length} posts`);
        posts = children.map((child) => ({
          name: child.data.title,
          author: child.data.author,
          permalink: child.data.permalink,
          upvoteRatio: child.data.upvote_ratio,
        }));
        console.log('Processed all posts');
      }
    } catch (e) {
      console.error(`ERROR: ${e}`);
      tries++;
    } finally {
      await page.close();
      console.log('Closed the page');
    }
  }
  console.log(`Returning ${posts.length} posts`);
  return posts;
}

async function processPost(
  browser: Browser,
  postObject: any,
  location: string = 'us',
  retries: number = 3
): Promise<any[]> {
  console.log(`Processing post: ${postObject.permalink}`);
  let tries = 0;
  let success = false;
  let comments = [];

  const r_url = `https://www.reddit.com${postObject.permalink}.json`;

  while (tries <= retries && !success) {
    console.log(`Attempt ${tries + 1} of ${retries + 1}`);
    const page = await browser.newPage();

    try {
      console.log(`Navigating to: ${getScrapeOpsUrl(r_url)}`);
      await page.goto(getScrapeOpsUrl(r_url), { timeout: 30000 });
      console.log('Successfully loaded the page');
      const commentData = await page.$eval('pre', (pre) => pre.textContent);
      if (!commentData) {
        throw new Error(`No comment data found: ${postObject.permalink}`);
      }
      console.log('Retrieved comment data from page');
      const commentJson = JSON.parse(commentData);
      console.log('Successfully parsed comment JSON');

      const commentsList = commentJson[1].data.children;
      console.log(`Found ${commentsList.length} comments`);

      comments = commentsList
        .filter((comment) => comment.kind !== 'more')
        .map((comment) => ({
          name: comment.data.author,
          body: comment.data.body,
          upvotes: comment.data.ups,
        }));
      console.log(`~~~~~~~ Processed ${comments.length} comments`);

      success = true;
    } catch (e) {
      console.error(
        `Error fetching comments for ${postObject.permalink}, retries left: ${
          retries - tries
        }`
      );
      console.error(e);
      tries++;
    } finally {
      await page.close();
      console.log('Closed the page');
    }
  }

  if (!success) {
    console.log(`Max retries exceeded for: ${postObject.permalink}`);
  }

  console.log(`Returning ${comments.length} comments`);
  return comments;
}

export async function scrapeRedditFeed(url: string): Promise<any> {
  console.log(`Starting to scrape Reddit feed: ${url}`);
  const browser = await puppeteer.launch();
  console.log('Launched browser');
  try {
    const feed = url.split('/')[4]; // Extract subreddit name from URL
    console.log(`Extracted subreddit: ${feed}`);
    console.log('Getting posts...');
    const posts = await getPosts(browser, feed, 1);

    if (posts.length === 0) {
      console.error('No posts found');
      throw new Error('No posts found');
    }

    console.log(`Got ${posts.length} post(s)`);
    const post = posts[0];
    console.log('Processing post comments...');
    const comments = await processPost(browser, post);

    console.log('Scraping completed successfully');
    return {
      post: post,
      comments: comments,
    };
  } catch (error) {
    console.error('An error occurred during scraping:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('Closed browser');
  }
}
