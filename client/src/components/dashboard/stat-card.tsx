import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | ReactNode;
  subtitle?: string;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <Card className="p-6 bg-card border-border/50 hover:border-border transition-all duration-300 shadow-lg shadow-black/20">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold font-display text-foreground tracking-tight">{value}</h3>
          
          {subtitle && (
            <p className={`text-sm mt-2 font-medium ${
              trend === 'up' ? 'text-primary' : 
              trend === 'down' ? 'text-destructive' : 
              'text-muted-foreground'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-3 bg-white/5 rounded-xl text-muted-foreground">
          {icon}
        </div>
      </div>
    </Card>
  );
}
