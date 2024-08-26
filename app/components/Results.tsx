import Markdown from 'react-markdown';
import cleanEntry from '../utils/musicEntryCleaner';

export default function Results({
  error,
  streamed,
  transformLinks = false,
}: {
  error: string;
  streamed: string;
  transformLinks?: boolean;
}) {
  const transformToLinks = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Remove list numbers, markdown characters, and (a) or (s) suffixes
      const cleanedLine = cleanEntry(line);
      const query = encodeURIComponent(cleanedLine);
      const url = `https://www.youtube.com/results?search_query=${query}`;
      return (
        <div key={index}>
          <a href={url} target='_blank' rel='noopener noreferrer'>
            <Markdown className='border-b border-transparent hover:borderbg-stone-300/75 transition-colors inline-block'>
              {line}
            </Markdown>
          </a>
        </div>
      );
    });
  };

  return (
    <>
      {error && <p className='text-red-200 mb-4'>{error}</p>}

      {streamed && (
        <div className={'flex flex-col gap-2 text-center'}>
          {transformLinks ? (
            transformToLinks(streamed)
          ) : (
            <Markdown>{streamed}</Markdown>
          )}
        </div>
      )}
    </>
  );
}
