'use client';

import { useState, useEffect } from 'react';
import sdk from '../../lib/spotify-sdk/ClientInstance';

interface Track {
  artist: string;
  album: string;
  song: string;
}

interface SpotifyPlaylistCreatorProps {
  tracks: Track[];
}

export default function SpotifyPlaylistCreator({
  tracks,
}: SpotifyPlaylistCreatorProps) {
  const [playlistId, setPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    const createPlaylist = async () => {
      if (!sdk || tracks.length === 0) return;

      try {
        const user = await sdk.currentUser.profile();
        const playlist = await sdk.playlists.createPlaylist(user.id, {
          name: 'Generated Playlist',
          public: false,
        });

        const trackUris = await Promise.all(
          tracks.map(async (track) => {
            const searchResult = await sdk.search(
              `${track.artist} ${track.song}`,
              ['track']
            );
            return searchResult.tracks.items[0]?.uri;
          })
        );

        const validTrackUris = trackUris.filter((uri): uri is string => !!uri);

        await sdk.playlists.addItemsToPlaylist(playlist.id, validTrackUris);

        setPlaylistId(playlist.id);
      } catch (error) {
        console.error('Error creating playlist:', error);
      }
    };

    createPlaylist();
  }, [tracks]);

  if (!playlistId) {
    return <div>Creating playlist...</div>;
  }

  return (
    <div className='mt-4'>
      <h2 className='text-lg mb-2'>Generated Spotify Playlist</h2>
      <iframe
        src={`https://open.spotify.com/embed/playlist/${playlistId}`}
        width='300'
        height='380'
        allowTransparency={true}
        allow='encrypted-media'></iframe>
    </div>
  );
}
