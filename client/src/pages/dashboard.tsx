import { useAuth } from "@/hooks/use-auth";
import { useUserStats, useUserBets } from "@/hooks/use-user";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import { BetHistory } from "@/components/dashboard/bet-history";
import { DollarSign, Percent, Hash, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: isLoadingStats } = useUserStats(user?.id);
  const { data: bets, isLoading: isLoadingBets } = useUserBets(user?.id);

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
        <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-xl border border-border/50">
          <span className="text-sm text-muted-foreground mr-2">SMS Number:</span>
          <span className="font-mono text-primary font-bold">(555) 019-BETS</span>
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
