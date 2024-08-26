import { useRedditFetcher, RedditForm } from './RedditFetcher';
import Results from './Results';
import SearchHistory from './SearchHistory';

interface RedditAnalyzerProps {
  title: string;
  processResult: (comments: string) => Promise<any>;
  transformLinks?: boolean;
  onStreamEnd?: (context: string) => void;
}

export default function RedditAnalyzer({
  title,
  processResult,
  transformLinks = false,
  onStreamEnd,
}: RedditAnalyzerProps) {
  const {
    url,
    setUrl,
    loading,
    error,
    streaming,
    streamed,
    history,
    handleSubmit,
    clearHistory,
  } = useRedditFetcher({ processResult, onStreamEnd });

  return (
    <>
      <h1 className='text-xl mb-4 text-center'>{title}</h1>
      <RedditForm {...{ handleSubmit, loading, streaming, url, setUrl }} />
      <Results {...{ error, streamed, transformLinks, onStreamEnd }} />
      <SearchHistory {...{ history, clearHistory }} onSearch={handleSubmit} />
    </>
  );
}
