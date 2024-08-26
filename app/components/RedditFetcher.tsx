import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  RedditComment,
  parseRedditUrl,
  scrapeRedditPost,
} from '../utils/postScraper';
import { readStreamableValue } from 'ai/rsc';

interface RedditFetcherProps {
  processResult: (comments: string) => Promise<any>;
  onStreamEnd?: (context: string) => void;
  initialUrl?: string;
}

export function useRedditFetcher({
  processResult,
  onStreamEnd,
  initialUrl = '',
}: RedditFetcherProps) {
  const [url, setUrl] = useState(initialUrl);
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

  const fetchComments = useCallback(
    async (submittedUrl?: string) => {
      setLoading(true);
      setError('');
      setComments([]);

      try {
        const urlToFetch = submittedUrl || url;
        const { subreddit, postId } = parseRedditUrl(urlToFetch);

        const post = await fetch(
          `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`
        );

        const postJson = await post.json();

        const { comments } = await scrapeRedditPost(postJson);
        setComments(comments);
        return comments;
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  const updateHistory = useCallback(
    (newUrl: string) => {
      const updatedHistory = Array.from(new Set([newUrl, ...history]));
      setHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    },
    [history]
  );

  const router = useRouter();

  const handleSubmit = useCallback(
    async (submittedUrl: string) => {
      if (streaming || loading) return;

      setStreaming(true);
      setStreamed('');
      setUrl(submittedUrl);
      updateHistory(submittedUrl);

      // Update URL search parameter
      router.push(`?url=${encodeURIComponent(submittedUrl)}`, {
        scroll: false,
      });

      try {
        const fetchedComments = await fetchComments(submittedUrl);
        const result = await processResult(
          fetchedComments.map((c: RedditComment) => c.body).join('\n===\n')
        );

        for await (let content of readStreamableValue(result)) {
          setStreamed(content as string);
        }
      } catch (error) {
        console.error('Error processing result:', error);
      } finally {
        setStreaming(false);
        setStreamed((p) => {
          onStreamEnd?.(p);
          return p;
        });
      }
    },
    [
      fetchComments,
      loading,
      onStreamEnd,
      processResult,
      router,
      streaming,
      updateHistory,
    ]
  );

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const [initialUrlSet, setInitialUrlSet] = useState(false);
  useEffect(() => {
    console.log('use effect:', { initialUrlSet, loading, streaming });
    if (!initialUrlSet && !loading && !streaming) {
      console.log('Searching!');
      setInitialUrlSet(true);
      const urlParam = searchParams.get('url');
      if (urlParam) {
        setUrl(urlParam);
        handleSubmit(urlParam);
      }
    }
  }, [handleSubmit, initialUrlSet, loading, searchParams, streaming]);

  return {
    url,
    setUrl,
    comments,
    loading,
    error,
    streaming,
    streamed,
    history,
    handleSubmit,
    clearHistory,
  };
}

export function RedditForm({
  handleSubmit,
  loading,
  streaming,
  url,
  setUrl,
}: {
  handleSubmit: (submittedUrl: string) => Promise<void>;
  loading: boolean;
  streaming: boolean;
  url: string;
  setUrl: (url: string) => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const submittedUrl = formData.get('url') as string;
        handleSubmit(submittedUrl);
      }}
      className='w-full max-w-md mb-8 flex gap-2'>
      <input
        type='text'
        name='url'
        placeholder='Enter Reddit post URL'
        className='px-2 py-1 grow rounded border border-gray-100 hover:border-gray-400  focus:outline-none focus:ring focus:ring-gray-400 text-white bg-transparent placeholder:text-white/50 transition-colors'
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        type='submit'
        disabled={loading || streaming}
        className='disabled:cursor-not-allowed disabled:bg-white/10 px-2 py-1 h-full border border-gray-100 text-white rounded hover:border-gray-400 transition-colors'>
        {loading || streaming ? 'Generating...' : 'Go!'}
      </button>
    </form>
  );
}
