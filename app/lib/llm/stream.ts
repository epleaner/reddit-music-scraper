'use server';

import { createStreamableValue } from 'ai/rsc';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getCachedLLMResponse } from '../redis';

export async function streamLLM({
  query,
  context,
  systemPrompt,
}: {
  query: string;
  context: string;
  systemPrompt: string;
}) {
  const cachedResponse = await getCachedLLMResponse(query);
  if (cachedResponse) {
    const streamableValue = createStreamableValue(cachedResponse);
    streamableValue.done();
    return streamableValue.value;
  }

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: context },
    ],
  });

  const stream = createStreamableValue(result.textStream);
  return stream.value;
}
