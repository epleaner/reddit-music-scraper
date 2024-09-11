'use server';

import { streamLLM } from '../lib/llm/stream';

export async function extractMusic({
  query,
  context,
}: {
  query: string;
  context: string;
}) {
  const systemPrompt =
    'You are a helpful assistant. Parse this body of text and extract all the artist, album, and song names you are able to find. Return the results as an enumerated list. Only return the list, no introductory or concluding text. Only include the artist, album, and song names.';

  return streamLLM({ query, context, systemPrompt });
}
