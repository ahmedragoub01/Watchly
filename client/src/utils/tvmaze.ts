type TvShow = {
  id: string;
  title: string;
  provider: string;
  url: string;
  thumbnail_url: string;
  rating?: number;
  summary?: string;
  genres?: string[];
};

let cache: { at: number; shows: TvShow[] } | null = null;
const CACHE_MS = 10 * 60 * 1000;

export async function fetchCatalogShows(): Promise<TvShow[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.shows;

  const res = await fetch('https://api.tvmaze.com/shows?page=0');
  if (!res.ok) throw new Error('Failed to load shows');
  const shows = (await res.json()) as any[];

  const mapped: TvShow[] = shows
    .filter(s => s?.rating?.average >= 7 && s?.image?.medium)
    .map(s => ({
      id: String(s.id),
      title: s.name,
      provider: 'tvmaze',
      url: '',
      thumbnail_url: s.image.medium,
      rating: s.rating?.average,
      summary: undefined,
      genres: s.genres || [],
    }));

  cache = { at: Date.now(), shows: mapped };
  return mapped;
}

export type { TvShow };
