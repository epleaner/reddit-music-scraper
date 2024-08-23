'use client';

import { extractMusic } from '../actions/music';
import RedditAnalyzer from './RedditAnalyzer';

export default function MusicScraperPage() {
  return (
    <RedditAnalyzer
      title='Reddit music scraper'
      processResult={extractMusic}
      transformLinks={true}
    />
  );
}
