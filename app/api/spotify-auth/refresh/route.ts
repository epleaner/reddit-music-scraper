import { refreshAccessToken } from '@/app/utils/spotifyAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 400 });
  }

  try {
    const tokenResponse = await refreshAccessToken(refreshToken);

    const response = NextResponse.json({ success: true });
    response.cookies.set('access_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: true,
    });

    // If a new refresh token is provided, update it
    if (tokenResponse.refresh_token) {
      response.cookies.set('refresh_token', tokenResponse.refresh_token, {
        httpOnly: true,
        secure: true,
      });
    }

    return response;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
