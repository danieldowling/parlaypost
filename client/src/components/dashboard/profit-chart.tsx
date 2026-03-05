import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface ProfitChartProps {
  bets: any[];
}

export function ProfitChart({ bets }: ProfitChartProps) {
  const chartData = useMemo(() => {
    if (!bets || bets.length === 0) return null;

    // Sort bets by date
    const sortedBets = [...bets].sort((a, b) => {
      const dateA = a.gameDate ? new Date(a.gameDate).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.gameDate ? new Date(b.gameDate).getTime() : new Date(b.createdAt).getTime();
      return dateA - dateB;
    });

    let cumulativeProfit = 0;
    const labels: string[] = [];
    const data: number[] = [];

    // Start at 0
    labels.push('Start');
    data.push(0);

    sortedBets.forEach(bet => {
      if (bet.result !== 'pending') {
        const date = bet.gameDate ? new Date(bet.gameDate) : new Date(bet.createdAt);
        labels.push(format(date, 'MMM d'));
        
        cumulativeProfit += (bet.profitLoss || 0);
        data.push(cumulativeProfit);
      }
    });

    const isProfitable = cumulativeProfit >= 0;
    const borderColor = isProfitable ? 'hsl(142 71% 45%)' : 'hsl(0 84.2% 60.2%)';
    const backgroundColor = isProfitable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    return {
      labels,
      datasets: [
        {
          fill: true,
          label: 'Cumulative Profit ($)',
          data,
          borderColor,
          backgroundColor,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'hsl(222 47% 11%)',
          pointBorderColor: borderColor,
          pointBorderWidth: 2,
        },
      ],
    };
  }, [bets]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(222 47% 13%)',
        titleColor: 'hsl(210 40% 98%)',
        bodyColor: 'hsl(215 20.2% 65.1%)',
        borderColor: 'hsl(217 32% 17%)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'hsl(215 20.2% 65.1%)',
          callback: function(value: any) {
            return '$' + value;
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'hsl(215 20.2% 65.1%)',
          maxTicksLimit: 8,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (!chartData) {
    return (
      <Card className="h-80 flex items-center justify-center bg-card border-border/50 text-muted-foreground">
        Not enough completed bets to generate chart.
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 bg-card border-border/50 shadow-lg h-80 relative">
      <Line options={options} data={chartData} />
    </Card>
  );
}
