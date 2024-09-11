'use server';

import { streamLLM } from '../lib/llm/stream';

export async function summarize({
  query,
  context,
}: {
  query: string;
  context: string;
}) {
  const systemPrompt =
    'You are a helpful assistant tasked with summarizing Reddit posts. Given a Reddit post and its comments, provide a concise summary that includes: 1) The main topic of the post, 2) Key points from the original post, 3) Major themes or opinions from the comments, and 4) Any notable controversies or debates. Present the summary in a clear, objective manner, highlighting the most important information. Format your message as bullet points and optimize for readability. Aim for a comprehensive yet concise overview.';

  return streamLLM({ query, context, systemPrompt });
}
