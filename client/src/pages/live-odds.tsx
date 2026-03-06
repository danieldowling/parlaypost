import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { TrendingUp, Clock, Zap } from "lucide-react";

type OddsGame = {
  id: string;
  sport: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  bookmaker: string;
  moneyline?: { home: number; away: number };
  spread?: { homePoint: number; homeOdds: number; awayPoint: number; awayOdds: number };
  total?: { point: number; overOdds: number; underOdds: number };
};

function formatOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function OddsCell({ label, odds, point }: { label: string; odds: number; point?: number }) {
  const isPositive = odds > 0;
  return (
    <div className="flex flex-col items-center justify-center py-3 px-2 rounded-md bg-white/5 hover-elevate min-w-[80px]">
      <span className="text-xs text-muted-foreground mb-1 truncate max-w-full">{label}</span>
      {point !== undefined && (
        <span className="text-sm font-semibold text-foreground">{point > 0 ? `+${point}` : point}</span>
      )}
      <span className={`text-sm font-bold ${isPositive ? "text-primary" : "text-muted-foreground"}`}>
        {formatOdds(odds)}
      </span>
    </div>
  );
}

function GameCard({ game }: { game: OddsGame }) {
  const gameTime = new Date(game.commenceTime);
  const isToday = new Date().toDateString() === gameTime.toDateString();
  const isSoon = gameTime.getTime() - Date.now() < 2 * 60 * 60 * 1000; // within 2 hours

  return (
    <Card className="p-4 bg-card border-border/50 hover-elevate" data-testid={`card-game-${game.id}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs no-default-active-elevate border-primary/30 text-primary bg-primary/10">
            {game.sportTitle}
          </Badge>
          {isSoon && (
            <Badge variant="outline" className="text-xs no-default-active-elevate border-yellow-500/30 text-yellow-500 bg-yellow-500/10">
              <Zap className="w-3 h-3 mr-1" />
              Soon
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
          <Clock className="w-3 h-3" />
          {isToday ? format(gameTime, "h:mm a") : format(gameTime, "MMM d, h:mm a")}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-4">
        <span className="font-bold text-foreground text-sm truncate" data-testid={`text-away-team-${game.id}`}>{game.awayTeam}</span>
        <span className="text-xs text-muted-foreground font-medium">vs</span>
        <span className="font-bold text-foreground text-sm truncate text-right" data-testid={`text-home-team-${game.id}`}>{game.homeTeam}</span>
      </div>

      <div className="space-y-2">
        {game.moneyline && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Moneyline</p>
            <div className="flex gap-2">
              <OddsCell label={game.awayTeam.split(" ").pop()!} odds={game.moneyline.away} />
              <OddsCell label={game.homeTeam.split(" ").pop()!} odds={game.moneyline.home} />
            </div>
          </div>
        )}

        {game.spread && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Spread</p>
            <div className="flex gap-2">
              <OddsCell label={game.awayTeam.split(" ").pop()!} odds={game.spread.awayOdds} point={game.spread.awayPoint} />
              <OddsCell label={game.homeTeam.split(" ").pop()!} odds={game.spread.homeOdds} point={game.spread.homePoint} />
            </div>
          </div>
        )}

        {game.total && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Total ({game.total.point})</p>
            <div className="flex gap-2">
              <OddsCell label="Over" odds={game.total.overOdds} />
              <OddsCell label="Under" odds={game.total.underOdds} />
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-right">via {game.bookmaker}</p>
    </Card>
  );
}

export default function LiveOdds() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: games, isLoading, error, dataUpdatedAt } = useQuery<OddsGame[]>({
    queryKey: [api.odds.live.path, activeTab],
    queryFn: async () => {
      const sportMap: Record<string, string> = {
        nba: "basketball_nba",
        nfl: "americanfootball_nfl",
        all: "basketball_nba,americanfootball_nfl",
      };
      const sports = sportMap[activeTab] || "basketball_nba,americanfootball_nfl";
      const res = await fetch(`${api.odds.live.path}?sports=${sports}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch odds");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 4 * 60 * 1000,
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Live Odds</h1>
          <p className="text-muted-foreground mt-1">Real-time odds from top US sportsbooks.</p>
        </div>
        {dataUpdatedAt > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Updated {format(new Date(dataUpdatedAt), "h:mm a")} · refreshes every 5 min
          </p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border/50">
          <TabsTrigger value="all" data-testid="tab-all-sports">All Sports</TabsTrigger>
          <TabsTrigger value="nba" data-testid="tab-nba">NBA</TabsTrigger>
          <TabsTrigger value="nfl" data-testid="tab-nfl">NFL</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl bg-card" />
          ))}
        </div>
      )}

      {error && (
        <Card className="p-8 text-center bg-card border-border/50">
          <p className="text-destructive font-semibold mb-2">Failed to load odds</p>
          <p className="text-sm text-muted-foreground">Check that your ODDS_API_KEY is valid and has remaining credits.</p>
        </Card>
      )}

      {!isLoading && !error && games?.length === 0 && (
        <Card className="p-8 text-center bg-card border-border/50">
          <p className="text-muted-foreground">No upcoming games found for this sport right now.</p>
          <p className="text-sm text-muted-foreground mt-1">Check back during the active season.</p>
        </Card>
      )}

      {!isLoading && !error && games && games.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
