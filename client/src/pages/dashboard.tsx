import { useAuth } from "@/hooks/use-auth";
import { useUserStats, useUserBets } from "@/hooks/use-user";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import { BetHistory } from "@/components/dashboard/bet-history";
import { DollarSign, Percent, Hash, Activity, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const EXAMPLE_BETS = [
  "$50 Knicks -4.5",
  "Lakers ML for $100",
  "Celtics -5.5 -110 $75",
  "$200 over 220.5 Warriors",
  "Bulls +7 $50",
  "$150 under 47.5",
  "Nuggets moneyline $80",
  "Heat -3 for $60",
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: isLoadingStats } = useUserStats(user?.id);
  const { data: bets, isLoading: isLoadingBets } = useUserBets(user?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [smsText, setSmsText] = useState("$50 Knicks -4.5");
  const [isSending, setIsSending] = useState(false);

  const simulateSmsBet = async () => {
    setIsSending(true);
    try {
      const res = await fetch('/api/webhook/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ Body: smsText, From: '+1234567890' }),
      });

      if (res.ok) {
        // Parse the Twilio XML response to extract the reply message
        const xml = await res.text();
        const msgMatch = xml.match(/<Message>(.*?)<\/Message>/s);
        const reply = msgMatch ? msgMatch[1] : "Bet logged!";
        const failed = reply.toLowerCase().startsWith("sorry");

        toast({
          title: failed ? "Couldn't parse bet" : "Bet logged!",
          description: reply,
          variant: failed ? "destructive" : "default",
        });

        if (!failed) {
          queryClient.invalidateQueries({ queryKey: [api.users.stats.path, user?.id] });
          queryClient.invalidateQueries({ queryKey: [api.users.bets.path, user?.id] });
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to simulate SMS bet", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoadingStats || isLoadingBets) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-card rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full bg-card rounded-xl" />)}
        </div>
        <Skeleton className="h-80 w-full bg-card rounded-xl" />
        <Skeleton className="h-64 w-full bg-card rounded-xl" />
      </div>
    );
  }

  const isProfitable = (stats?.totalProfitLoss || 0) >= 0;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}. Here's how you're performing.</p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Input
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && simulateSmsBet()}
              className="w-72 bg-background border-primary/20"
              placeholder='e.g. "Lakers ML for $100"'
              data-testid="input-sms-bet"
            />
            <Button
              onClick={simulateSmsBet}
              disabled={isSending}
              variant="outline"
              className="bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary whitespace-nowrap"
              data-testid="button-simulate-sms"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? "Sending…" : "Simulate SMS"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {EXAMPLE_BETS.map(ex => (
              <button
                key={ex}
                onClick={() => setSmsText(ex)}
                className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border/40"
                data-testid={`button-example-bet-${ex.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}`}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Total Profit/Loss" 
          value={`$${Math.abs(stats?.totalProfitLoss || 0).toFixed(2)}`}
          subtitle={isProfitable ? "Profitable" : "In the red"}
          icon={<DollarSign className="w-6 h-6" />}
          trend={isProfitable ? "up" : "down"}
        />
        <StatCard 
          title="Win Percentage" 
          value={`${(stats?.winPercentage || 0).toFixed(1)}%`}
          icon={<Percent className="w-6 h-6" />}
          trend={(stats?.winPercentage || 0) > 50 ? "up" : "down"}
        />
        <StatCard 
          title="Total Bets" 
          value={stats?.totalBets?.toString() || "0"}
          icon={<Hash className="w-6 h-6" />}
        />
        <StatCard 
          title="Recent Form" 
          value={
            <div className="flex space-x-1 mt-1">
              {stats?.recentForm && stats.recentForm.length > 0 ? (
                stats.recentForm.map((result, i) => (
                  <div 
                    key={i} 
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      result === 'won' ? 'bg-primary/20 text-primary' : 
                      result === 'lost' ? 'bg-destructive/20 text-destructive' : 
                      'bg-muted text-muted-foreground'
                    }`}
                  >
                    {result === 'won' ? 'W' : result === 'lost' ? 'L' : result === 'push' ? 'P' : '-'}
                  </div>
                ))
              ) : (
                <span className="text-lg text-muted-foreground font-normal">No recent</span>
              )}
            </div>
          }
          icon={<Activity className="w-6 h-6" />}
        />
      </div>

      {/* Chart Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-foreground">Performance Trend</h2>
        <ProfitChart bets={bets || []} />
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-foreground">Recent Bets</h2>
        <BetHistory bets={bets || []} />
      </div>
    </div>
  );
}
