'use client';

import { summarize } from '../actions/summary';
import {
  useRedditFetcher,
  RedditForm,
  useRedditHandler,
} from '../components/RedditFetcher';
import Results from '../components/Results';

export default function Summary() {
  const { setUrl, loading, error, fetchComments } = useRedditFetcher();
  const { handleSubmit, streaming, streamed } = useRedditHandler(
    fetchComments,
    summarize
  );

  return (
    <>
      <h1 className='text-4xl font-bold mb-4 text-center'>
        Reddit post summarizer
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
