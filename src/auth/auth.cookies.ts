import { CookieOptions, Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL = '7d';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function baseCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions(),
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions(),
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions());
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions());
}
