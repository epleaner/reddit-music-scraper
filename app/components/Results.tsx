import Markdown from 'react-markdown';

export default function Results({
  error,
  streamed,
}: {
  error: string;
  streamed: string;
}) {
  return (
    <>
      {error && <p className='text-red-200 mb-4'>{error}</p>}

      {streamed && (
        <div className='w-full max-w-2xl text-center'>
          <Markdown>{streamed}</Markdown>
        </div>
      )}
    </>
  );
}
