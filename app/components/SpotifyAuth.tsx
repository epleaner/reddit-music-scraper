'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import { FaSpotify } from 'react-icons/fa';

const SpotifyAuth = () => {
  const { data: session, status } = useSession();

  return (
    <nav
      className={`flex justify-between items-center space-x-2 py-1 px-3 border rounded-full border-stone-100 text-xs ${
        status === 'authenticated'
          ? ''
          : 'hover:cursor-pointer hover:border-green-300'
      } transition-colors group`}
      onClick={() => status !== 'authenticated' && signIn('spotify')}>
      <FaSpotify
        className={`${
          status === 'authenticated' ? '' : 'group-hover:text-green-300'
        } transition-colors`}
      />
      {status === 'authenticated' ? (
        <div className='flex items-center space-x-2'>
          <span>{session?.user?.name}</span>
          <button
            className='pl-2 border-l border-stone-100'
            onClick={() => signOut()}>
            sign out
          </button>
        </div>
      ) : (
        <div>sign in</div>
      )}
    </nav>
  );
};

export default SpotifyAuth;
