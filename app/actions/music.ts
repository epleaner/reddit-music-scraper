'use server';

import { createStreamableValue } from 'ai/rsc';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function extractMusic(context: string) {
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant. Parse this body of text and extract all the artist, album, and song names you are able to find. Return the results as an enumerated list. Only return the list, no introductory or concluding text.',
      },
      { role: 'user', content: context },
    ],
  });

  const stream = createStreamableValue(result.textStream);
  return stream.value;
}
