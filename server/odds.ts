const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const API_KEY = process.env.ODDS_API_KEY;

export interface OddsGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface Market {
  key: string; // h2h, spreads, totals
  last_update: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface NormalizedGame {
  id: string;
  sport: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  moneyline?: { home: number; away: number };
  spread?: { homePoint: number; homeOdds: number; awayPoint: number; awayOdds: number };
  total?: { point: number; overOdds: number; underOdds: number };
  bookmaker: string;
}

export const ALL_SPORTS = [
  "basketball_nba",
  "basketball_ncaab",
  "americanfootball_nfl",
  "americanfootball_ncaaf",
  "icehockey_nhl",
  "baseball_mlb",
];

// Per-sport-key in-memory cache to avoid hammering the free tier
const oddsCache: Map<string, { data: NormalizedGame[]; fetchedAt: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchSport(sport: string): Promise<NormalizedGame[]> {
  const cached = oddsCache.get(sport);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `${ODDS_API_BASE}/sports/${sport}/odds?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error(`Odds API error for ${sport}: ${res.status} ${res.statusText}`);
    return [];
  }

  const games: OddsGame[] = await res.json();
  const normalized: NormalizedGame[] = [];

  for (const game of games) {
    const bk = game.bookmakers[0];
    if (!bk) continue;

    const entry: NormalizedGame = {
      id: game.id,
      sport: game.sport_key,
      sportTitle: game.sport_title,
      commenceTime: game.commence_time,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      bookmaker: bk.title,
    };

    for (const market of bk.markets) {
      if (market.key === "h2h") {
        const home = market.outcomes.find(o => o.name === game.home_team);
        const away = market.outcomes.find(o => o.name === game.away_team);
        if (home && away) {
          entry.moneyline = { home: home.price, away: away.price };
        }
      } else if (market.key === "spreads") {
        const home = market.outcomes.find(o => o.name === game.home_team);
        const away = market.outcomes.find(o => o.name === game.away_team);
        if (home && away && home.point !== undefined && away.point !== undefined) {
          entry.spread = {
            homePoint: home.point,
            homeOdds: home.price,
            awayPoint: away.point,
            awayOdds: away.price,
          };
        }
      } else if (market.key === "totals") {
        const over = market.outcomes.find(o => o.name === "Over");
        const under = market.outcomes.find(o => o.name === "Under");
        if (over && under && over.point !== undefined) {
          entry.total = {
            point: over.point,
            overOdds: over.price,
            underOdds: under.price,
          };
        }
      }
    }

    normalized.push(entry);
  }

  oddsCache.set(sport, { data: normalized, fetchedAt: Date.now() });
  return normalized;
}

export async function getLiveOdds(sports: string[] = ALL_SPORTS): Promise<NormalizedGame[]> {
  if (!API_KEY) {
    throw new Error("ODDS_API_KEY is not set");
  }

  // Fetch all requested sports in parallel
  const results = await Promise.all(sports.map(fetchSport));
  const allGames = results.flat();

  // Sort by soonest game first
  allGames.sort((a, b) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime());

  return allGames;
}
