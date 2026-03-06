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
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "ytd", label: "YTD" },
  { key: "1month", label: "1 Mo" },
  { key: "1week", label: "1 Wk" },
] as const;

type Period = (typeof PERIODS)[number]["key"];

function winColor(pct: number) {
  if (pct >= 55) return "rgba(74, 222, 128, 0.85)";
  if (pct >= 45) return "rgba(250, 204, 21, 0.85)";
  return "rgba(248, 113, 113, 0.85)";
}
function winBorder(pct: number) {
  if (pct >= 55) return "rgba(74, 222, 128, 1)";
  if (pct >= 45) return "rgba(250, 204, 21, 1)";
  return "rgba(248, 113, 113, 1)";
}

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

  const groupStats = useMemo(() => {
    if (!leaderboard) return null;
    const totalWins = leaderboard.reduce((s, m) => s + m.wins, 0);
    const totalLosses = leaderboard.reduce((s, m) => s + m.losses, 0);
    const totalPushes = leaderboard.reduce((s, m) => s + m.pushes, 0);
    return { totalWins, totalLosses, totalPushes };
  }, [leaderboard]);

  const totalFinished = groupStats
    ? groupStats.totalWins + groupStats.totalLosses + groupStats.totalPushes
    : 0;
  const winPct =
    totalFinished > 0
      ? ((groupStats!.totalWins / totalFinished) * 100).toFixed(1)
      : null;

  const doughnutData = groupStats
    ? {
        labels: ["Wins", "Losses", "Pushes"],
        datasets: [
          {
            data: [groupStats.totalWins, groupStats.totalLosses, groupStats.totalPushes],
            backgroundColor: [
              "rgba(74, 222, 128, 0.9)",
              "rgba(248, 113, 113, 0.9)",
              "rgba(100, 116, 139, 0.5)",
            ],
            borderColor: ["rgba(74, 222, 128, 1)", "rgba(248, 113, 113, 1)", "rgba(100, 116, 139, 0.8)"],
            borderWidth: 1.5,
            hoverOffset: 8,
          },
        ],
      }
    : null;

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#94a3b8",
        bodyColor: "#f1f5f9",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : "0.0";
            return ` ${ctx.label}: ${ctx.raw}  (${pct}%)`;
          },
        },
      },
    },
  };

  const memberBarData = useMemo(() => {
    if (!leaderboard) return null;
    const sorted = [...leaderboard]
      .filter((m) => m.wins + m.losses + m.pushes > 0)
      .sort((a, b) => b.winPercentage - a.winPercentage);
    return {
      labels: sorted.map((m) => m.name),
      datasets: [
        {
          label: "Win %",
          data: sorted.map((m) => parseFloat(m.winPercentage.toFixed(1))),
          backgroundColor: sorted.map((m) => winColor(m.winPercentage)),
          borderColor: sorted.map((m) => winBorder(m.winPercentage)),
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  }, [leaderboard]);

  const memberBarOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#94a3b8",
        bodyColor: "#f1f5f9",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx: any) => ` ${ctx.raw}% win rate`,
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "rgba(148,163,184,0.7)",
          font: { size: 11 },
          callback: (v: any) => `${v}%`,
        },
        border: { color: "rgba(255,255,255,0.08)" },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#cbd5e1", font: { size: 13, weight: "500" as const } },
        border: { display: false },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-24 bg-card rounded-md" />
        <div className="h-32 bg-card rounded-xl border border-border/50" />
        <div className="h-64 bg-card rounded-xl border border-border/50" />
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

  const membersWithBets = leaderboard.filter(
    (m) => m.wins + m.losses + m.pushes > 0
  );

  return (
    <div className="space-y-6">
      <Link
        href="/groups"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Groups
      </Link>

      {/* Header */}
      <Card className="p-6 md:p-8 bg-card border-border/50 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center mb-2">
              <Trophy className="w-6 h-6 text-primary mr-3" />
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                {group.name}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Leaderboard based on total profit &amp; loss.
            </p>
          </div>
          <div className="bg-background/50 border border-border rounded-xl p-4 flex flex-col items-center min-w-[180px]">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Invite Code
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold tracking-widest text-foreground">
                {group.inviteCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                data-testid="button-copy-invite"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Doughnut — group win rate */}
        <Card className="p-6 bg-card border-border/50 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">Group Win Rate</h2>
              <p className="text-xs text-muted-foreground mt-0.5">All members combined</p>
            </div>
            <div
              className="flex items-center gap-1 bg-background/60 border border-border/60 rounded-lg p-1"
              data-testid="period-filter"
            >
              {PERIODS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    period === key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`button-period-${key}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {totalFinished === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm min-h-[200px]">
              No settled bets for this period.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {/* Chart + center label */}
              <div className="relative w-48 h-48" data-testid="chart-win-rate">
                <Doughnut data={doughnutData!} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-display font-bold text-foreground leading-none">
                    {winPct}%
                  </span>
                  <span className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">
                    Win Rate
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6">
                {[
                  { label: "Wins", value: groupStats!.totalWins, color: "bg-emerald-400", testid: "stat-wins" },
                  { label: "Losses", value: groupStats!.totalLosses, color: "bg-red-400", testid: "stat-losses" },
                  { label: "Pushes", value: groupStats!.totalPushes, color: "bg-slate-500", testid: "stat-pushes" },
                ].map(({ label, value, color, testid }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
                    <div>
                      <p className="text-xs text-muted-foreground leading-none">{label}</p>
                      <p
                        className="text-sm font-semibold text-foreground leading-snug"
                        data-testid={testid}
                      >
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Horizontal bar — per-member win rate */}
        <Card className="p-6 bg-card border-border/50 shadow-lg flex flex-col">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-foreground">Win Rate by Member</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Settled bets only · same period</p>
          </div>

          {membersWithBets.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm min-h-[200px]">
              No settled bets for this period.
            </div>
          ) : (
            <div
              style={{ height: Math.max(membersWithBets.length * 52, 160) }}
              data-testid="chart-member-win-rate"
            >
              <Bar data={memberBarData!} options={memberBarOptions} />
            </div>
          )}
        </Card>
      </div>

      {/* Leaderboard table */}
      <Card className="overflow-hidden bg-card border-border/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-muted-foreground text-xs uppercase border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium w-20">Rank</th>
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
                      className="hover:bg-white/5 transition-colors"
                      data-testid={`row-leaderboard-${entry.userId}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 font-bold font-display text-sm text-foreground">
                          {index === 0 ? (
                            <Medal className="w-4 h-4 text-yellow-400" />
                          ) : index === 1 ? (
                            <Medal className="w-4 h-4 text-slate-400" />
                          ) : index === 2 ? (
                            <Medal className="w-4 h-4 text-amber-700" />
                          ) : (
                            index + 1
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 flex-shrink-0">
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-foreground">{entry.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-muted-foreground">
                          {entry.winPercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold text-lg ${
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
