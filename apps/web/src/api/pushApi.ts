import { apiRequest } from './client';

export function registerToken(
  accessToken: string,
  token: string,
  platform: 'ANDROID' | 'IOS',
): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/push/register-token', {
    method: 'POST',
    accessToken,
    body: { token, platform },
  });
}

export function unregisterToken(accessToken: string, token: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/push/unregister-token', {
    method: 'POST',
    accessToken,
    body: { token },
  });
}
