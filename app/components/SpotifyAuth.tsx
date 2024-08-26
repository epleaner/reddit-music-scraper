'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import { FaSpotify } from 'react-icons/fa';

const SpotifyAuth = () => {
  const { data: session, status } = useSession();

  return (
    <header className='flex justify-between items-center space-x-2 py-1 px-3 border rounded-full border-stone-100 text-xs'>
      <FaSpotify />
      {status === 'authenticated' ? (
        <div className='flex items-center space-x-2'>
          <span>{session?.user?.name}</span>
          <button
            onClick={() => signOut()}
            className='pl-2 border-l border-stone-100'>
            sign out
          </button>
        </div>
      ) : (
        <button onClick={() => signIn('spotify')}>sign in</button>
      )}
    </header>
  );
};

export default SpotifyAuth;
