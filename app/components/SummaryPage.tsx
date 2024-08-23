'use client';

import { summarize } from '../actions/summary';
import RedditAnalyzer from './RedditAnalyzer';

export default function Summary() {
  return (
    <RedditAnalyzer title='Reddit post summarizer' processResult={summarize} />
  );
}
