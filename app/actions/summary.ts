'use server';

import { createStreamableValue } from 'ai/rsc';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function summarize(context: string) {
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant tasked with summarizing Reddit posts. Given a Reddit post and its comments, provide a concise summary that includes: 1) The main topic of the post, 2) Key points from the original post, 3) Major themes or opinions from the comments, and 4) Any notable controversies or debates. Present the summary in a clear, objective manner, highlighting the most important information. Format your message as bullet points and optimize for readability. Aim for a comprehensive yet concise overview.',
      },
      { role: 'user', content: context },
    ],
  });

  const stream = createStreamableValue(result.textStream);
  return stream.value;
}
