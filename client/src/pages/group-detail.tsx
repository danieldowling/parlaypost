import { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useGroupLeaderboard, useGroups } from "@/hooks/use-groups";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Medal, TrendingUp, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "ytd", label: "YTD" },
  { key: "1month", label: "1 Month" },
  { key: "1week", label: "1 Week" },
] as const;

type Period = (typeof PERIODS)[number]["key"];

export default function GroupDetail() {
  const [, params] = useRoute("/groups/:id");
  const groupId = Number(params?.id);
  const [period, setPeriod] = useState<Period>("all");

  const { data: groups } = useGroups();
  const group = groups?.find((g) => g.id === groupId);

  const { data: leaderboard, isLoading } = useGroupLeaderboard(groupId, period);
  const { toast } = useToast();

  const handleCopyCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      toast({ title: "Copied!", description: "Invite code copied to clipboard." });
    }
  };

  const pieData = useMemo(() => {
    if (!leaderboard) return null;
    const totalWins = leaderboard.reduce((s, m) => s + m.wins, 0);
    const totalLosses = leaderboard.reduce((s, m) => s + m.losses, 0);
    const totalPushes = leaderboard.reduce((s, m) => s + m.pushes, 0);
    return { totalWins, totalLosses, totalPushes };
  }, [leaderboard]);

  const chartData = pieData
    ? {
        labels: ["Wins", "Losses", "Pushes"],
        datasets: [
          {
            data: [pieData.totalWins, pieData.totalLosses, pieData.totalPushes],
            backgroundColor: [
              "rgba(74, 222, 128, 0.85)",
              "rgba(248, 113, 113, 0.85)",
              "rgba(148, 163, 184, 0.6)",
            ],
            borderColor: [
              "rgba(74, 222, 128, 1)",
              "rgba(248, 113, 113, 1)",
              "rgba(148, 163, 184, 1)",
            ],
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "hsl(215 20% 65%)",
          padding: 16,
          font: { size: 13 },
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : "0.0";
            return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
          },
        },
      },
    },
  };

  const totalFinished = pieData
    ? pieData.totalWins + pieData.totalLosses + pieData.totalPushes
    : 0;
  const winPct =
    totalFinished > 0 ? ((pieData!.totalWins / totalFinished) * 100).toFixed(1) : "—";

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-24 bg-card rounded-md"></div>
        <div className="h-32 bg-card rounded-xl border border-border/50"></div>
        <div className="h-64 bg-card rounded-xl border border-border/50"></div>
      </div>
    );
  }

  if (!group || !leaderboard) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-display font-bold">Group not found</h2>
        <Link href="/groups" className="text-primary hover:underline mt-4 inline-block">
          Back to groups
        </Link>
      </div>
    );
  }

  const sortedLeaderboard = [...leaderboard].sort(
    (a, b) => b.totalProfitLoss - a.totalProfitLoss
  );

  return (
    <div className="space-y-6">
      <Link
        href="/groups"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Groups
      </Link>

      {/* Header */}
      <Card className="p-6 md:p-8 bg-card border-border/50 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center mb-2">
              <Trophy className="w-6 h-6 text-primary mr-3" />
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                {group.name}
              </h1>
            </div>
            <p className="text-muted-foreground">Leaderboard based on total profit & loss.</p>
          </div>

          <div className="bg-background/50 border border-border rounded-xl p-4 flex flex-col items-center min-w-[200px]">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">
              Invite Code
            </span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xl font-bold tracking-widest text-foreground">
                {group.inviteCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-copy-invite"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Period filters + Pie chart */}
      <Card className="p-6 bg-card border-border/50 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-foreground">Group Win Rate</h2>
          <div className="flex gap-2 flex-wrap" data-testid="period-filter">
            {PERIODS.map(({ key, label }) => (
              <Button
                key={key}
                variant={period === key ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(key)}
                className={
                  period === key
                    ? "bg-primary text-primary-foreground"
                    : "border-border/50 text-muted-foreground hover:text-foreground"
                }
                data-testid={`button-period-${key}`}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {totalFinished === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No settled bets for this period yet.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-56 h-56 flex-shrink-0" data-testid="chart-win-rate">
              <Doughnut data={chartData!} options={chartOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-display font-bold text-foreground">
                  {winPct}%
                </span>
                <span className="text-xs text-muted-foreground mt-1">Win Rate</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-display font-bold text-primary" data-testid="stat-wins">
                  {pieData!.totalWins}
                </p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Wins</p>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
                <p
                  className="text-2xl font-display font-bold text-destructive"
                  data-testid="stat-losses"
                >
                  {pieData!.totalLosses}
                </p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                  Losses
                </p>
              </div>
              <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-center">
                <p
                  className="text-2xl font-display font-bold text-muted-foreground"
                  data-testid="stat-pushes"
                >
                  {pieData!.totalPushes}
                </p>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                  Pushes
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Leaderboard table */}
      <Card className="overflow-hidden bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-muted-foreground text-xs uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium w-24">Rank</th>
                <th className="px-6 py-4 font-medium">Bettor</th>
                <th className="px-6 py-4 font-medium text-right">Win %</th>
                <th className="px-6 py-4 font-medium text-right">Total Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No bets placed in this group yet.
                  </td>
                </tr>
              ) : (
                sortedLeaderboard.map((entry, index) => {
                  const isPositive = entry.totalProfitLoss >= 0;
                  return (
                    <tr
                      key={entry.userId}
                      className="hover:bg-white/5 transition-colors group"
                      data-testid={`row-leaderboard-${entry.userId}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 font-bold font-display text-foreground">
                          {index === 0 ? (
                            <Medal className="w-5 h-5 text-yellow-500" />
                          ) : index === 1 ? (
                            <Medal className="w-5 h-5 text-gray-400" />
                          ) : index === 2 ? (
                            <Medal className="w-5 h-5 text-amber-700" />
                          ) : (
                            index + 1
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-4 border border-primary/20">
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-foreground text-lg">{entry.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end text-muted-foreground">
                          <TrendingUp className="w-4 h-4 mr-2 opacity-50" />
                          <span className="font-medium">
                            {entry.winPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td
                        className={`px-6 py-5 text-right font-bold text-xl ${
                          isPositive ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {isPositive ? "+" : ""}${Math.abs(entry.totalProfitLoss).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
