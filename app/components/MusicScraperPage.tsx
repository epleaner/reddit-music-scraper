'use client';

import { extractMusic } from '../actions/music';
import {
  useRedditFetcher,
  useRedditHandler,
  RedditForm,
} from './RedditFetcher';
import Results from './Results';

export default function Home() {
  const { setUrl, loading, error, fetchComments } = useRedditFetcher();
  const { handleSubmit, streaming, streamed } = useRedditHandler(
    fetchComments,
    extractMusic
  );

  return (
    <>
      <h1 className='text-4xl font-bold mb-4 text-center'>
        Reddit music scraper
      </h1>
      <RedditForm
        onSubmit={(e) => {
          handleSubmit(e);
          const formData = new FormData(e.target as HTMLFormElement);
          const submittedUrl = formData.get('url') as string;
          setUrl(submittedUrl);
        }}
        loading={loading}
        streaming={streaming}
      />
      <Results {...{ error, streamed }} />
    </>
  );
}
