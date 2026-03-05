import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BetHistoryProps {
  bets: any[];
}

export function BetHistory({ bets }: BetHistoryProps) {
  if (!bets || bets.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border-border/50">
        <p className="text-muted-foreground">No bets recorded yet.</p>
        <p className="text-sm text-muted-foreground mt-2">Text your first bet to get started!</p>
      </Card>
    );
  }

  // Sort by newest first
  const sortedBets = [...bets].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getResultColor = (result: string) => {
    switch (result) {
      case 'won': return 'bg-primary/20 text-primary border-primary/30';
      case 'lost': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'push': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
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
            {sortedBets.map((bet) => (
              <tr key={bet.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                  {format(new Date(bet.gameDate || bet.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 font-medium text-foreground">
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
                  bet.profitLoss > 0 ? 'text-primary' : 
                  bet.profitLoss < 0 ? 'text-destructive' : 
                  'text-muted-foreground'
                }`}>
                  {bet.result === 'pending' ? '-' : 
                   `${bet.profitLoss > 0 ? '+' : ''}$${Math.abs(bet.profitLoss || 0).toFixed(2)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
