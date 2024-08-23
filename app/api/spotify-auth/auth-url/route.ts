import { getAuthorizationUrl } from '@/app/utils/spotifyAuth';
import { NextResponse } from 'next/server';

export async function GET() {
  const authUrl = getAuthorizationUrl();
  return NextResponse.redirect(authUrl);
}
