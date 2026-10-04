import type { ProviderType, VideoInfo } from '@watchly/shared';

export function detectProvider(url: string): ProviderType {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      return 'youtube';
    }

    if (host.includes('drive.google.com')) {
      return 'googledrive';
    }

    return 'direct';
  } catch {
    return 'direct';
  }
}

export function extractVideoId(url: string, provider: ProviderType): string {
  try {
    const parsed = new URL(url);

    switch (provider) {
      case 'youtube': {
        const vParam = parsed.searchParams.get('v');
        if (vParam) return vParam;

        if (parsed.hostname.includes('youtu.be')) {
          return parsed.pathname.slice(1);
        }

        const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
        if (embedMatch) return embedMatch[1];

        const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
        if (shortsMatch) return shortsMatch[1];

        return '';
      }

      case 'googledrive': {
        const driveMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
        if (driveMatch) return driveMatch[1];
        return '';
      }

      case 'direct':
        return url;
    }
  } catch {
    return url;
  }
}

export function parseVideoUrl(url: string): VideoInfo | null {
  if (!url || typeof url !== 'string') return null;

  try {
    new URL(url);
  } catch {
    return null;
  }

  const provider = detectProvider(url);
  const videoId = extractVideoId(url, provider);

  if (!videoId) return null;

  return {
    url,
    provider,
    videoId,
  };
}
