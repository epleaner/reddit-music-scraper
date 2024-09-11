'use client';

import { extractMusic } from '../../actions/music';
import RedditAnalyzer from '../RedditAnalyzer';

export default function MusicRecommendPage() {
  return (
    <>
      <RedditAnalyzer
        title='Music recommender'
        processResult={extractMusic}
        transformLinks={true}
        musicScraper
      />
    </>
  );
}
