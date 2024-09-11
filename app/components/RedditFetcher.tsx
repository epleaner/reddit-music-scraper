import { useState, useEffect, useCallback, cache } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  RedditComment,
  parseRedditUrl,
  scrapeRedditPost,
} from '../utils/postScraper';
import { readStreamableValue } from 'ai/rsc';
import { getRedditUrls } from '../actions/webSearch';
import { cacheLLMResponse } from '../lib/redis';

interface RedditFetcherProps {
  processResult: ({
    query,
    context,
  }: {
    query: string;
    context: string;
  }) => Promise<any>;
  onStreamEnd?: (context: string) => void;
  initialQuery?: string;
}

async function fetchRedditComments(query: string): Promise<RedditComment[]> {
  const { subreddit, postId } = parseRedditUrl(query);

  const post = await fetch(
    `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`
  );

  const postJson = await post.json();

  const { comments } = await scrapeRedditPost(postJson);

  return comments;
}

export function useRedditFetcher({
  processResult,
  onStreamEnd,
  initialQuery = '',
}: RedditFetcherProps) {
  const [query, setQuery] = useState(initialQuery);
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamed, setStreamed] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const storedHistory = localStorage.getItem('searchHistory');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  const getCommentContext = useCallback(
    async ({ query: submittedQuery }: { query?: string }) => {
      setLoading(true);
      setError('');
      setComments([]);

      try {
        const queryToFetch = submittedQuery || query;

        const { jsonUrl } = parseRedditUrl(queryToFetch);

        let fetchedComments: RedditComment[] = [];
        if (!jsonUrl) {
          const urls = await getRedditUrls(queryToFetch);
          console.log(urls);
          fetchedComments = (
            await Promise.all(
              urls.map(async (url) => {
                try {
                  return await fetchRedditComments(url);
                } catch (error) {
                  console.error(`Error fetching comments from ${url}:`, error);
                  return [];
                }
              })
            )
          ).flat();
          console.log('Fetched comments:', fetchedComments);
        } else {
          fetchedComments = await fetchRedditComments(queryToFetch);
        }

        setComments(fetchedComments);

        const context = fetchedComments
          .map((c: RedditComment) => c.body)
          .join('\n===\n');

        return context;
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  const updateHistory = useCallback(
    (newQuery: string) => {
      const updatedHistory = Array.from(new Set([newQuery, ...history]));
      setHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    },
    [history]
  );

  const router = useRouter();

  const processAndStreamResult = useCallback(
    async ({ query, context }: { query: string; context: string }) => {
      let finalResult = '';
      console.log('Processing and streaming result', query, context);
      const result = await processResult({ query, context });

      for await (let content of readStreamableValue(result)) {
        setStreamed(content as string);
        finalResult = content as string;
      }
      return finalResult;
    },
    [processResult]
  );

  const handleSubmit = useCallback(
    async (query: string) => {
      if (streaming || loading) return;

      setStreaming(true);
      setStreamed('');
      setQuery(query);
      updateHistory(query);

      // Update URL search parameter
      router.push(`?query=${encodeURIComponent(query)}`, {
        scroll: false,
      });

      let finalResult = '';
      try {
        const context = await getCommentContext({ query });

        finalResult = await processAndStreamResult({ query, context });
      } catch (error) {
        console.error('Error processing result:', error);
      } finally {
        setStreaming(false);

        cacheLLMResponse(query, finalResult);
        onStreamEnd?.(finalResult);
      }
    },
    [
      getCommentContext,
      loading,
      onStreamEnd,
      processAndStreamResult,
      router,
      streaming,
      updateHistory,
    ]
  );

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const [initialQuerySet, setInitialQuerySet] = useState(false);
  useEffect(() => {
    if (!initialQuerySet && !loading && !streaming) {
      setInitialQuerySet(true);
      const queryParam = searchParams.get('query');
      if (queryParam) {
        setQuery(queryParam);
        handleSubmit(queryParam);
      }
    }
  }, [handleSubmit, initialQuerySet, loading, searchParams, streaming]);

  return {
    query,
    setQuery,
    comments,
    loading,
    error,
    streaming,
    streamed,
    history,
    handleSubmit,
    clearHistory,
    processAndStreamResult,
  };
}

export function RedditForm({
  handleSubmit,
  loading,
  streaming,
  query,
  setQuery,

  searchPlaceholder,
}: {
  handleSubmit: (query: string) => Promise<void>;
  loading: boolean;
  streaming: boolean;
  query: string;
  setQuery: (query: string) => void;
  searchPlaceholder: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const query = formData.get('query') as string;
        handleSubmit(query);
      }}
      className='w-full max-w-md mb-8 flex gap-2'>
      <input
        type='text'
        name='query'
        placeholder={searchPlaceholder}
        className='input'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        type='submit'
        disabled={loading || streaming || !query}
        className='btn-secondary'>
        {loading || streaming ? 'generating...' : 'Go!'}
      </button>
    </form>
  );
}
