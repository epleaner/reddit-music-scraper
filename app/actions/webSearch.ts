'use server';

import { revalidatePath } from 'next/cache';

export async function getRedditUrls(query: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        api_key: process.env.TAVILY_API_KEY,
        include_domains: ['reddit.com'],
        max_results: 20,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();

    const urls = data.results.map((result: { url: string }) => result.url);

    revalidatePath('/recommend');
    return urls;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw new Error('Failed to fetch recommendations');
  }
}
