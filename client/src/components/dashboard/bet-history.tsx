import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 10;

interface BetHistoryProps {
  bets: any[];
}

export function BetHistory({ bets }: BetHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const sortedBets = [...(bets ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const visibleBets = sortedBets.slice(0, visibleCount);
  const hasMore = visibleCount < sortedBets.length;

  // Reset when the bets list changes (e.g. new bet added)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [bets.length]);

  // Lazy-load: observe the sentinel div and load more rows when it enters the viewport
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  const getResultColor = (result: string) => {
    switch (result) {
      case "won":  return "bg-primary/20 text-primary border-primary/30";
      case "lost": return "bg-destructive/20 text-destructive border-destructive/30";
      case "push": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      default:     return "bg-muted text-muted-foreground border-border";
    }
  };

  if (sortedBets.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border-border/50">
        <p className="text-muted-foreground">No bets recorded yet.</p>
        <p className="text-sm text-muted-foreground mt-2">Text your first bet to get started!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Card className="overflow-hidden bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-muted-foreground text-xs uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Pick</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Odds</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Result</th>
                <th className="px-6 py-4 font-medium text-right">P/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleBets.map((bet) => (
                <Dialog key={bet.id}>
                  <DialogTrigger asChild>
                    <tr
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                      data-testid={`row-bet-${bet.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(new Date(bet.gameDate || bet.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors">
                        {bet.team} {bet.line !== 0 && (bet.line > 0 ? `+${bet.line}` : bet.line)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground capitalize">
                        {bet.betType}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {bet.odds > 0 ? `+${bet.odds}` : bet.odds}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        ${bet.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`capitalize no-default-active-elevate ${getResultColor(bet.result)}`}>
                          {bet.result}
                        </Badge>
                      </td>
                      <td className={`px-6 py-4 font-bold text-right ${
                        bet.profitLoss > 0 ? "text-primary" :
                        bet.profitLoss < 0 ? "text-destructive" :
                        "text-muted-foreground"
                      }`}>
                        {bet.result === "pending" ? "-" :
                         `${bet.profitLoss > 0 ? "+" : ""}$${Math.abs(bet.profitLoss || 0).toFixed(2)}`}
                      </td>
                    </tr>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-display">Bet Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Pick</p>
                          <h3 className="text-3xl font-bold text-foreground">
                            {bet.team} {bet.line !== 0 && (bet.line > 0 ? `+${bet.line}` : bet.line)}
                          </h3>
                        </div>
                        <Badge variant="outline" className={`text-sm px-3 py-1 capitalize ${getResultColor(bet.result)}`}>
                          {bet.result}
                        </Badge>
                      </div>

                      <Separator className="bg-border/50" />

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Bet Type</p>
                          <p className="text-lg font-semibold capitalize">{bet.betType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Odds</p>
                          <p className="text-lg font-semibold">{bet.odds > 0 ? `+${bet.odds}` : bet.odds}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Stake</p>
                          <p className="text-lg font-semibold">${bet.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Profit/Loss</p>
                          <p className={`text-lg font-bold ${
                            bet.profitLoss > 0 ? "text-primary" :
                            bet.profitLoss < 0 ? "text-destructive" :
                            "text-muted-foreground"
                          }`}>
                            {bet.result === "pending" ? "-" :
                             `${bet.profitLoss > 0 ? "+" : ""}$${Math.abs(bet.profitLoss || 0).toFixed(2)}`}
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-border/50" />

                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Placed On</span>
                          <span className="text-foreground font-medium">{format(new Date(bet.createdAt), "MMM d, yyyy HH:mm")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Game Date</span>
                          <span className="text-foreground font-medium">
                            {bet.gameDate ? format(new Date(bet.gameDate), "MMM d, yyyy") : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lazy-load sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-2" data-testid="bet-history-sentinel">
        {hasMore ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
        ) : sortedBets.length > PAGE_SIZE ? (
          <p className="text-xs text-muted-foreground/40">All {sortedBets.length} bets loaded</p>
        ) : null}
      </div>
    </div>
  );
}
