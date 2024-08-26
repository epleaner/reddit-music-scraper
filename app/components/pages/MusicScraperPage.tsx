'use client';

import { useCallback, useState } from 'react';
import { extractMusic } from '../../actions/music';
import RedditAnalyzer from '../RedditAnalyzer';
import cleanEntry from '@/app/utils/musicEntryCleaner';
import sdk from '@/app/lib/spotify-sdk/ClientInstance';
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

  const playlistMaker = useCallback(async () => {
    console.log('playlist', tracks);
    const uris = await Promise.all(
      tracks.map(async (track) => {
        const query = [track.artist, track.album, track.song]
          .filter(Boolean)
          .join(' ');
        let searchResult;
        if (track.song) {
          searchResult = await sdk.search(query, ['track']);
          console.log('Search result (tracks):', searchResult);
          return searchResult.tracks.items.map((item) => item.uri);
        } else {
          searchResult = await sdk.search(query, ['album']);
          console.log('Search result (albums):', searchResult);
          const album = await sdk.albums.tracks(
            searchResult.albums.items[0].id
          );
          console.log('Album tracks:', album);
          return album.items.map((item) => item.uri);
        }
      })
    );

    console.log(uris);
    const validUris = uris.flat(2).filter((uri): uri is string => !!uri);

    const user = await sdk.currentUser.profile();
    const playlist = await sdk.playlists.createPlaylist(user.id, {
      name: 'Generated Playlist',
      public: false,
    });

    await sdk.playlists.addItemsToPlaylist(playlist.id, validUris);

    console.log('Playlist created:', playlist);
  }, [tracks]);

  return (
    <>
      <RedditAnalyzer
        title='Reddit music scraper'
        processResult={extractMusic}
        onStreamEnd={handleMusicExtraction}
        transformLinks={true}
      />
      {tracks.length > 0 && (
        <button onClick={playlistMaker}>Create playlist</button>
      )}
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
