'use client';

import { extractMusic } from '../../actions/music';
import RedditAnalyzer from '../RedditAnalyzer';

export default function MusicScraperPage() {
  return (
    <>
      <RedditAnalyzer
        title='Reddit music recommender'
        searchPlaceholder='Search or enter a Reddit post URL'
        processResult={extractMusic}
        transformLinks={true}
        musicScraper
      />
    </>
  );
}
