'use client';

import { useCallback, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCreatePlaylist } from '../hooks/useCreatePlaylist';
import { Track } from '../types';

interface CreatePlaylistButtonProps {
  query: string;
  tracks: Track[];
}

export default function CreatePlaylistButton({
  query,
  tracks,
}: CreatePlaylistButtonProps) {
  const [playlistName, setPlaylistName] = useState('Generated Playlist');
  const [open, setOpen] = useState(false);
  const { createPlaylist, isCreating } = useCreatePlaylist();

  const handleCreatePlaylist = useCallback(async () => {
    setOpen(false);
    await createPlaylist({ query, tracks, playlistName });
  }, [createPlaylist, playlistName, query, tracks]);

  return (
    <div className='mt-8'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className='btn-primary' disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create playlist'}
          </button>
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
                if (e.key === 'Enter') handleCreatePlaylist();
              }}
              className='input'
            />
            <div className='flex justify-center items-center'>
              <button
                className='btn-secondary'
                onClick={handleCreatePlaylist}
                disabled={isCreating}>
                Create
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
