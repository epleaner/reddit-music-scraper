import { useState, useEffect } from 'react';
import {
  useRedditFetcher,
  RedditForm,
  useRedditHandler,
} from './RedditFetcher';
import Results from './Results';
import SearchHistory from './SearchHistory';

interface RedditAnalyzerProps {
  title: string;
  processResult: (comments: string) => Promise<any>;
  transformLinks?: boolean;
}

export default function RedditAnalyzer({
  title,
  processResult,
  transformLinks = false,
}: RedditAnalyzerProps) {
  const { url, setUrl, loading, error, fetchComments } = useRedditFetcher();
  const { handleSubmit, streaming, streamed } = useRedditHandler(
    fetchComments,
    processResult
  );

  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem('searchHistory');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  const updateHistory = (newUrl: string) => {
    const updatedHistory = Array.from(new Set([newUrl, ...history])); // Keep only the last 5 searches
    setHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const handleSearch = (url: string) => {
    handleSubmit(url);
    setUrl(url);
    updateHistory(url);
  };

  return (
    <>
      <h1 className='text-xl mb-4 text-center'>{title}</h1>
      <RedditForm
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const submittedUrl = formData.get('url') as string;
          handleSearch(submittedUrl);
        }}
        loading={loading}
        streaming={streaming}
        {...{ url, setUrl }}
      />
      <Results {...{ error, streamed }} transformLinks={transformLinks} />
      <SearchHistory
        history={history}
        clearHistory={clearHistory}
        onSearch={handleSearch}
      />
    </>
  );
}
