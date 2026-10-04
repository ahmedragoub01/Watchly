import type { ProviderType, VideoInfo } from '@watchly/shared';

export function detectProvider(url: string): ProviderType {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('drive.google.com')) return 'googledrive';
    return 'direct';
  } catch {
    return 'direct';
  }
}

export function extractVideoId(url: string, provider: ProviderType): string {
  try {
    const parsed = new URL(url);
    if (provider === 'youtube') {
      const v = parsed.searchParams.get('v');
      if (v) return v;
      if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
      const embed = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embed) return embed[1];
      const shorts = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];
      return '';
    }
    if (provider === 'googledrive') {
      const m = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      return m ? m[1] : '';
    }
    return url;
  } catch {
    return url;
  }
}

export function parseVideoUrl(url: string): VideoInfo | null {
  if (!url) return null;
  try { new URL(url); } catch { return null; }
  const provider = detectProvider(url);
  const videoId = extractVideoId(url, provider);
  if (!videoId) return null;
  return { url, provider, videoId };
}
