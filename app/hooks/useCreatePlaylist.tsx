import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import sdk from '@/app/lib/spotify-sdk/ClientInstance';
import { ToastAction } from '@/components/ui/toast';
import { Track } from '../types';
import { Album, SearchResults } from '@spotify/web-api-ts-sdk';
import { cacheSpotifyPlaylist, getCachedSpotifyPlaylist } from '../lib/redis';

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
          console.error(
            `API request error (attempt ${retries + 1}/${maxRetries}):`,
            error.message
          );
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
      console.error(`Max retries (${maxRetries}) reached. Giving up.`);
      throw new Error('Max retries reached');
    },
    []
  );

  const batchSearchTracks = useCallback(
    async (tracks: Track[]): Promise<string[]> => {
      console.log(`Starting batch search for ${tracks.length} tracks`);
      const searchBatchSize = 20; // Adjust as needed for initial search
      const albumBatchSize = 20; // Maximum allowed for the albums endpoint

      const searchTrack = async (track: Track): Promise<string | null> => {
        const query = [track.artist, track.album, track.song]
          .filter(Boolean)
          .join(' ');
        console.log(`Searching for: ${query}`);
        if (track.song) {
          const searchResult = (await retryWithBackoff(() =>
            sdk.search(query, ['track'])
          )) as SearchResults<readonly ['track']>;
          const uri = searchResult.tracks.items[0]?.uri || null;
          console.log(
            `Track search result for "${query}": ${uri || 'Not found'}`
          );
          return uri;
        } else {
          const searchResult = (await retryWithBackoff(() =>
            sdk.search(query, ['album'])
          )) as SearchResults<readonly ['album']>;
          const uri = searchResult.albums.items[0]?.uri || null;
          console.log(
            `Album search result for "${query}": ${uri || 'Not found'}`
          );
          return uri;
        }
      };

      const fetchAlbumTracks = async (
        albumUris: string[]
      ): Promise<string[]> => {
        console.log(`Fetching tracks for ${albumUris.length} albums`);
        let ids = albumUris.map((uri) => uri.split(':').pop() as string);
        const albums = (await retryWithBackoff(() =>
          sdk.albums.get(ids)
        )) as Album[];
        const tracks = albums.flatMap(
          (album) => album.tracks?.items.map((track) => track.uri) || []
        );
        console.log(
          `Found ${tracks.length} tracks from ${albums.length} albums`
        );
        return tracks;
      };

      const results: string[] = [];
      for (let i = 0; i < tracks.length; i += searchBatchSize) {
        console.log(
          `Processing batch ${i / searchBatchSize + 1} of ${Math.ceil(
            tracks.length / searchBatchSize
          )}`
        );
        const batch = tracks.slice(i, i + searchBatchSize);
        const batchUris = await Promise.all(batch.map(searchTrack));
        const validUris = batchUris.filter((uri): uri is string => !!uri);

        const trackUris = validUris.filter((uri) =>
          uri.startsWith('spotify:track:')
        );
        const albumUris = validUris.filter((uri) =>
          uri.startsWith('spotify:album:')
        );

        console.log(
          `Batch results: ${trackUris.length} tracks, ${albumUris.length} albums`
        );
        results.push(...trackUris);

        // Batch album fetching
        for (let j = 0; j < albumUris.length; j += albumBatchSize) {
          const albumBatch = albumUris.slice(j, j + albumBatchSize);
          const albumTracks = await fetchAlbumTracks(albumBatch);
          results.push(...albumTracks);
        }

        // Add a small delay between search batches to help with rate limiting
        if (i + searchBatchSize < tracks.length) {
          console.log('Adding delay between batches');
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log(`Batch search completed. Found ${results.length} tracks`);
      return results;
    },
    [retryWithBackoff]
  );

  const addTracksToPlaylist = useCallback(
    async (playlistId: string, uris: string[]) => {
      console.log(`Adding ${uris.length} tracks to playlist ${playlistId}`);
      const batchSize = 100;
      for (let i = 0; i < uris.length; i += batchSize) {
        const batch = uris.slice(i, i + batchSize);
        console.log(
          `Adding batch ${i / batchSize + 1} of ${Math.ceil(
            uris.length / batchSize
          )} (${batch.length} tracks)`
        );
        await retryWithBackoff(() =>
          sdk.playlists.addItemsToPlaylist(playlistId, batch)
        );
      }
      console.log(`Finished adding all tracks to playlist ${playlistId}`);
    },
    [retryWithBackoff]
  );

  const createPlaylist = useCallback(
    async ({
      query,
      tracks,
      playlistName,
    }: {
      query: string;
      tracks: Track[];
      playlistName: string;
    }) => {
      setIsCreating(true);
      console.log(
        `Starting playlist creation: "${playlistName}" with ${tracks.length} tracks`
      );
      toast({
        title: 'Creating playlist...',
        description: 'Please wait while we create your playlist.',
      });

      try {
        // Check if a playlist for this query already exists
        const cachedPlaylistId = await getCachedSpotifyPlaylist(query);
        if (cachedPlaylistId) {
          console.log(`Found cached playlist: ${cachedPlaylistId}`);
          toast({
            title: 'Playlist found',
            description: `There is an existing playlist for this search`,
            action: (
              <ToastAction
                altText='View playlist'
                asChild
                className='border-none'>
                <a
                  href={`https://open.spotify.com/playlist/${cachedPlaylistId}`}
                  target='_blank'
                  rel='noopener noreferrer'>
                  View
                </a>
              </ToastAction>
            ),
          });
          setIsCreating(false);
          return;
        }

        console.log('Initiating batch search for tracks');
        const uris = await batchSearchTracks(tracks);

        let validUris = uris.flat(2).filter((uri): uri is string => !!uri);
        console.log(
          `Found ${validUris.length} valid track URIs out of ${tracks.length} original tracks`
        );

        console.log('Fetching current user profile');
        const user = await retryWithBackoff(() => sdk.currentUser.profile());
        console.log(`User profile fetched: ${user.id}`);

        console.log(`Creating playlist "${playlistName}" for user ${user.id}`);
        const playlist = await retryWithBackoff(() =>
          sdk.playlists.createPlaylist(user.id, {
            name: playlistName,
            public: false,
          })
        );
        console.log(`Playlist created with ID: ${playlist.id}`);

        console.log(
          `Adding ${validUris.length} tracks to playlist ${playlist.id}`
        );
        await addTracksToPlaylist(playlist.id, validUris);
        console.log('All tracks added to playlist');

        const playlistUrl = playlist.external_urls.spotify;
        console.log(`Playlist URL: ${playlistUrl}`);

        // Cache the created playlist
        await cacheSpotifyPlaylist(query, playlist.id);

        toast({
          title: 'Playlist created',
          description: `Your playlist "${playlistName}" has been created with ${validUris.length} tracks`,
          action: (
            <ToastAction
              altText='View playlist'
              asChild
              className='border-none'>
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
        console.log('Playlist creation process completed');
        setIsCreating(false);
      }
    },
    [addTracksToPlaylist, batchSearchTracks, retryWithBackoff, toast]
  );

  return { createPlaylist, isCreating };
};
