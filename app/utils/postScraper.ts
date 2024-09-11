export type RedditComment = {
  id: any;
  author: any;
  body: any;
  score: any;
  createdUtc: any;
  depth: any;
};

export function parseRedditUrl(url: string): {
  subreddit?: string;
  postId?: string;
  jsonUrl?: string;
} {
  // Regex pattern to match Reddit post URLs
  const pattern =
    /^https?:\/\/(?:www\.)?reddit\.com\/r\/([^\/]+)\/comments\/([^\/]+)/;

  const match = url.match(pattern);

  if (!match) return {};

  const [, subreddit, postId] = match;
  const jsonUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;

  return { subreddit, postId, jsonUrl };
}

async function processPost(data: any): Promise<any[]> {
  const comments: RedditComment[] = [];

  function extractComment(item: any) {
    if (item.kind === 't1') {
      // 't1' represents a comment
      const commentData = item.data;
      const comment = {
        id: commentData.id,
        author: commentData.author,
        body: commentData.body,
        score: commentData.score,
        createdUtc: commentData.created_utc,
        depth: commentData.depth,
      };
      comments.push(comment);

      // Recursively parse replies
      if (commentData.replies && commentData.replies.data) {
        parseListing(commentData.replies.data);
      }
    }
  }

  function parseListing(listing: any) {
    listing.children.forEach(extractComment);
  }

  // Start parsing from the second element (index 1) which contains the comments
  parseListing(data[1].data);

  console.log(`Returning ${comments.length} comments`);
  return comments;
}

export async function scrapeRedditPost(post: any): Promise<any> {
  try {
    const comments = await processPost(post);

    console.log('Scraping completed successfully');
    return {
      // post: post,
      comments: comments,
    };
  } catch (error) {
    console.error('An error occurred during scraping:', error);
    throw error;
  } finally {
  }
}
