'use client';

import { useState } from 'react';
import { extractMusic } from '../../actions/music';
import RedditAnalyzer from '../RedditAnalyzer';
import cleanEntry from '@/app/utils/musicEntryCleaner';
import CreatePlaylistButton from '../CreatePlaylist';

interface Track {
  artist: string;
  album: string;
  song: string;
}

export default function MusicScraperPage() {
  const [tracks, setTracks] = useState<Track[]>([]);

  const handleMusicExtraction = async (context: string) => {
    const parsedTracks = parseExtractedMusic(context);
    console.log('Music extraction complete:', parsedTracks);
    setTracks(parsedTracks);
  };

  return (
    <>
      <RedditAnalyzer
        title='Reddit music scraper'
        processResult={extractMusic}
        onStreamEnd={handleMusicExtraction}
        transformLinks={true}
      />
      {tracks.length > 0 && <CreatePlaylistButton tracks={tracks} />}
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
