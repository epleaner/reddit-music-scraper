'use client';

import { useState, useCallback } from 'react';
import sdk from '@/app/lib/spotify-sdk/ClientInstance';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';

interface Track {
  artist: string;
  album: string;
  song: string;
}

interface CreatePlaylistButtonProps {
  tracks: Track[];
}

export default function CreatePlaylistButton({
  tracks,
}: CreatePlaylistButtonProps) {
  const [playlistName, setPlaylistName] = useState('Generated Playlist');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const createPlaylist = useCallback(async () => {
    setOpen(false);
    toast({
      title: 'Creating playlist...',
      description: 'Please wait while we create your playlist.',
    });

    try {
      console.log('Creaiting playlist with entries:', tracks);
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

      let validUris = uris.flat(2).filter((uri): uri is string => !!uri);

      console.log('Playlist uris:', validUris);
      const user = await sdk.currentUser.profile();
      const playlist = await sdk.playlists.createPlaylist(user.id, {
        name: playlistName,
        public: false,
      });

      const batchSize = 100;
      for (let i = 0; i < validUris.length; i += batchSize) {
        const batch = validUris.slice(i, i + batchSize);
        await sdk.playlists.addItemsToPlaylist(playlist.id, batch);
      }

      console.log('Playlist created:', playlist);
      const playlistUrl = playlist.external_urls.spotify;

      toast({
        title: 'Playlist created!',
        description: `Your playlist "${playlistName}" has been created successfully.`,
        action: (
          <ToastAction altText='View' asChild>
            <a href={playlistUrl} target='_blank' rel='noopener noreferrer'>
              View
            </a>
          </ToastAction>
        ),
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to create playlist. Please try again.',
        variant: 'destructive',
      });
    }
  }, [tracks, playlistName, toast]);

  return (
    <div className='mt-8'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className='btn-primary'>Create playlist</button>
        </PopoverTrigger>
        <PopoverContent className='w-80' side='top' align='center'>
          <div className='flex flex-col gap-3 w-full'>
            <p className='text-sm text-muted-foreground'>
              Enter a name for your new playlist.
            </p>
            <input
              id='playlistName'
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createPlaylist();
              }}
              className='input'
            />
            <div className='flex justify-center items-center'>
              <button className='btn-secondary' onClick={createPlaylist}>
                Create
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
