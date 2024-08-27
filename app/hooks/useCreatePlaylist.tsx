import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import sdk from '@/app/lib/spotify-sdk/ClientInstance';
import { ToastAction } from '@/components/ui/toast';
import { Track } from '../types';
import { Page, SearchResults, SimplifiedTrack } from '@spotify/web-api-ts-sdk';

export const useCreatePlaylist = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const retryWithBackoff = useCallback(
    async (
      fn: () => Promise<any>,
      maxRetries = 3,
      initialDelay = 1000
    ): Promise<any> => {
      let retries = 0;
      while (retries < maxRetries) {
        try {
          return await fn();
        } catch (error: any) {
          console.log('API request error', error.message);
          if (error.message.includes('rate limit')) {
            const delay = error.headers?.get('Retry-After')
              ? parseInt(error.headers?.get('Retry-After')) * 1000
              : initialDelay * Math.pow(2, retries);
            console.log(`Rate limited. Retrying in ${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            retries++;
          } else {
            throw error;
          }
        }
      }
      throw new Error('Max retries reached');
    },
    []
  );

  const batchSearchTracks = useCallback(
    async (tracks: Track[]): Promise<string[]> => {
      const batchSize = 10; // Reduced batch size for more frequent pauses
      const searchTrack = async (track: Track): Promise<string[]> => {
        const query = [track.artist, track.album, track.song]
          .filter(Boolean)
          .join(' ');
        if (track.song) {
          const searchResult = (await retryWithBackoff(() =>
            sdk.search(query, ['track'])
          )) as SearchResults<readonly ['track']>;
          console.log('Search result (tracks):', searchResult);
          return searchResult.tracks.items.map((item) => item.uri);
        } else {
          const searchResult = (await retryWithBackoff(() =>
            sdk.search(query, ['album'])
          )) as SearchResults<readonly ['album']>;
          console.log('Search result (albums):', searchResult);
          if (searchResult.albums.items.length > 0) {
            const album = (await retryWithBackoff(() =>
              sdk.albums.tracks(searchResult.albums.items[0].id)
            )) as Page<SimplifiedTrack>;
            console.log('Album tracks:', album);
            return album.items.map((item) => item.uri);
          }
          return [];
        }
      };

      const results: string[] = [];
      for (let i = 0; i < tracks.length; i += batchSize) {
        const batch = tracks.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(searchTrack));
        results.push(
          ...batchResults.flat().filter((uri): uri is string => !!uri)
        );

        // Add a small delay between batches to help with rate limiting
        if (i + batchSize < tracks.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return results;
    },
    [retryWithBackoff]
  );

  const addTracksToPlaylist = useCallback(
    async (playlistId: string, uris: string[]) => {
      const batchSize = 100;
      for (let i = 0; i < uris.length; i += batchSize) {
        const batch = uris.slice(i, i + batchSize);
        await retryWithBackoff(() =>
          sdk.playlists.addItemsToPlaylist(playlistId, batch)
        );
      }
    },
    [retryWithBackoff]
  );

  const createPlaylist = useCallback(
    async (tracks: Track[], playlistName: string) => {
      setIsCreating(true);
      toast({
        title: 'Creating playlist...',
        description: 'Please wait while we create your playlist.',
      });

      try {
        console.log('Creating playlist with entries:', tracks);
        const uris = await batchSearchTracks(tracks);

        let validUris = uris.flat(2).filter((uri): uri is string => !!uri);

        console.log('Playlist uris:', validUris);
        const user = await retryWithBackoff(() => sdk.currentUser.profile());
        const playlist = await retryWithBackoff(() =>
          sdk.playlists.createPlaylist(user.id, {
            name: playlistName,
            public: false,
          })
        );

        await addTracksToPlaylist(playlist.id, validUris);

        console.log('Playlist created:', playlist);
        const playlistUrl = playlist.external_urls.spotify;

        toast({
          title: 'Playlist created!',
          description: `Your playlist "${playlistName}" has been created successfully.`,
          action: (
            <ToastAction altText='View playlist' asChild>
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
      } finally {
        setIsCreating(false);
      }
    },
    [addTracksToPlaylist, batchSearchTracks, retryWithBackoff, toast]
  );

  return { createPlaylist, isCreating };
};
