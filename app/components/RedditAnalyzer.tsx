import { useState } from 'react';
import CreatePlaylistButton from './CreatePlaylist';
import { useRedditFetcher, RedditForm } from './RedditFetcher';
import Results from './Results';
import SearchHistory from './SearchHistory';
import cleanEntry from '../utils/musicEntryCleaner';

interface Track {
  artist: string;
  album: string;
  song: string;
}

interface RedditAnalyzerProps {
  title: string;
  processResult: ({
    query,
    context,
  }: {
    query: string;
    context: string;
  }) => Promise<any>;
  transformLinks?: boolean;
  onStreamEnd?: (context: string) => void;
  musicScraper?: boolean;
  searchPlaceholder?: string;
}

export default function RedditAnalyzer({
  title,
  processResult,
  transformLinks = false,
  musicScraper = false,
  searchPlaceholder = 'Enter a Reddit post URL',
}: RedditAnalyzerProps) {
  const [tracks, setTracks] = useState<Track[]>([]);

  const handleMusicExtraction = async (context: string) => {
    const parsedTracks = parseExtractedMusic(context);
    setTracks(parsedTracks);
  };

  const onStreamEnd = musicScraper ? handleMusicExtraction : undefined;

  const {
    query,
    setQuery,
    loading,
    error,
    streaming,
    streamed,
    history,
    handleSubmit,
    clearHistory,
  } = useRedditFetcher({
    processResult,
    onStreamEnd,
  });

  return (
    <>
      <h1 className='text-xl mb-4 text-center'>{title}</h1>
      <RedditForm
        {...{
          handleSubmit,
          loading,
          streaming,
          query,
          setQuery,
          searchPlaceholder,
        }}
      />
      <Results {...{ error, streamed, transformLinks }} />
      {musicScraper && tracks.length ? (
        <CreatePlaylistButton {...{ query, tracks }} />
      ) : (
        <></>
      )}

      <SearchHistory {...{ history, clearHistory }} onSearch={handleSubmit} />
    </>
  );
}

function parseExtractedMusic(extractedMusic: string): Track[] {
  return extractedMusic.split('\n').map((line) => {
    const cleanedLine = cleanEntry(line);
    const [artist, album, song] = cleanedLine.split(' - ');
    return { artist, album, song };
  });
}
