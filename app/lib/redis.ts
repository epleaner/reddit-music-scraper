'use server';
import { Redis } from 'ioredis';

const getRedisUrl = () => {
  console.log('Getting Redis URL');
  if (process.env.REDIS_URL) {
    console.log('Redis URL found', process.env.REDIS_URL);
    return process.env.REDIS_URL;
  }
  console.error('REDIS_URL is not defined');
  throw new Error('REDIS_URL is not defined');
};

console.log('Initializing Redis connection');
const redis = new Redis(getRedisUrl());
console.log('Redis connection initialized');

// Cache LLM responses
export async function cacheLLMResponse(query: string, response: string) {
  console.log(`Caching LLM response for query: ${query}`);
  await redis.set(`llm:${query}`, response, 'EX', 60 * 60 * 24); // Cache for 24 hours
  console.log('LLM response cached successfully');
}

export async function getCachedLLMResponse(
  query: string
): Promise<string | null> {
  console.log('Looking for cached LLM response for query:', query);
  const res = await redis.get(`llm:${query}`);
  console.log('Found cached LLM response:', res);

  return res;
}

// Cache Spotify playlists
export async function cacheSpotifyPlaylist(query: string, playlistId: string) {
  console.log(`Caching Spotify playlist for query: ${query}`);
  await redis.set(`spotify:${query}`, playlistId, 'EX', 60 * 60 * 24 * 7); // Cache for 7 days
  console.log('Spotify playlist cached successfully');
}

export async function getCachedSpotifyPlaylist(
  query: string
): Promise<string | null> {
  console.log('Looking for cached Spotify playlist for query:', query);
  const res = await redis.get(`spotify:${query}`);
  console.log('Found cached Spotify playlist:', res);
  return res;
}
