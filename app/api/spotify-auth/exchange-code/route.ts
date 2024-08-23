import { getAccessToken } from '@/app/utils/spotifyAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect('/login?error=missing_code');
  }

  try {
    const tokenResponse = await getAccessToken(code);

    // Here, you should securely store the access_token and refresh_token
    // For example, you could set them as HTTP-only cookies or store them in a database

    const response = NextResponse.redirect('/dashboard');
    response.cookies.set('access_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: true,
    });
    response.cookies.set('refresh_token', tokenResponse.refresh_token, {
      httpOnly: true,
      secure: true,
    });

    return response;
  } catch (error) {
    console.error('Error getting access token:', error);
    return NextResponse.redirect('/login?error=token_error');
  }
}
