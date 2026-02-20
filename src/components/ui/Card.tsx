import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardProps extends React.ComponentProps<"div"> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-100 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, className }: StatCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        <Icon className="h-4 w-4 text-zinc-500" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-zinc-100">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trendUp ? "text-emerald-500" : "text-rose-500"
            )}
          >
            {trend}
          </span>
        )}
      </div>
    </Card>
  );
}
