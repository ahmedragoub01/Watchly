import { useCallback, useEffect, useRef, useState } from 'react';

export type ShowCardData = { id: string; title: string; thumbnail: string; rating: number };
export type ShowRow = { title: string; items: ShowCardData[] };

type State = { rows: ShowRow[]; nextPage: number; hasMore: boolean };

const CACHE_KEY = 'watchly:tvmaze:v2';
const TTL = 30 * 60 * 1000;
const GENRES = ['Action', 'Drama', 'Science-Fiction', 'Comedy'];
const MAX_PAGES = 250;        // TVMaze pages hold 250 shows each
const PER_PAGE_PER_ROW = 25; // items added to a row per fetched page

function readCache(): State | null {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { at, state } = JSON.parse(raw) as { at: number; state: State };
        return Date.now() - at < TTL ? state : null;
    } catch {
        return null;
    }
}

function writeCache(state: State) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), state }));
    } catch { /* quota / private mode */ }
}

function mergePage(prev: ShowRow[], shows: any[]): ShowRow[] {
    const top = shows
        .filter(s => (s.rating?.average ?? 0) >= 7 && s.image?.medium)
        .map(s => ({
            id: String(s.id),
            title: s.name as string,
            thumbnail: s.image.medium as string,
            rating: s.rating.average as number,
            genres: (s.genres || []) as string[],
        }));

    const strip = ({ id, title, thumbnail, rating }: (typeof top)[number]): ShowCardData =>
        ({ id, title, thumbnail, rating });

    const map = new Map(prev.map(r => [r.title, r.items]));
    const add = (title: string, items: ShowCardData[]) => {
        if (items.length) map.set(title, [...(map.get(title) ?? []), ...items]);
    };

    add('Trending Now', [...top].sort((a, b) => b.rating - a.rating).slice(0, PER_PAGE_PER_ROW).map(strip));
    for (const g of GENRES) {
        add(g, top.filter(s => s.genres.includes(g)).slice(0, PER_PAGE_PER_ROW).map(strip));
    }

    return ['Trending Now', ...GENRES]
        .filter(t => map.has(t))
        .map(t => ({ title: t, items: map.get(t)! }));
}

export function useTrendingShows() {
    const [state, setState] = useState<State>(() => readCache() ?? { rows: [], nextPage: 0, hasMore: true });
    const [loadingMore, setLoadingMore] = useState(false);

    const stateRef = useRef(state);
    stateRef.current = state;
    const inFlight = useRef(false);
    const mounted = useRef(true);

    const loadMore = useCallback(async () => {
        const { nextPage, hasMore } = stateRef.current;
        if (inFlight.current || !hasMore) return;
        inFlight.current = true;
        setLoadingMore(true);

        try {
            const res = await fetch(`https://api.tvmaze.com/shows?page=${nextPage}`);
            if (res.status === 404) {
                // no more pages
                const done = { ...stateRef.current, hasMore: false };
                stateRef.current = done;
                if (mounted.current) setState(done);
                return;
            }
            if (!res.ok) throw new Error(`TVMaze ${res.status}`);

            const shows: any[] = await res.json();
            const next: State = {
                rows: mergePage(stateRef.current.rows, shows),
                nextPage: nextPage + 1,
                hasMore: shows.length > 0 && nextPage + 1 < MAX_PAGES,
            };
            stateRef.current = next;
            writeCache(next);
            if (mounted.current) setState(next);
        } catch (err) {
            console.error(err);
            // stop auto-retrying on failure so we never loop on a broken network
            const failed = { ...stateRef.current, hasMore: false };
            stateRef.current = failed;
            if (mounted.current) setState(failed);
        } finally {
            inFlight.current = false;
            if (mounted.current) setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        if (stateRef.current.rows.length === 0) loadMore();
        return () => { mounted.current = false; };
    }, [loadMore]);

    return {
        rows: state.rows,
        loading: state.rows.length === 0 && (loadingMore || state.hasMore),
        loadingMore,
        hasMore: state.hasMore,
        loadMore,
    };
}