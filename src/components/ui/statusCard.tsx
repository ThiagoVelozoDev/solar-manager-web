import { Card, CardContent } from "../ui/card";
import type { LucideIcon } from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatusCard({ title, value, subtitle, icon: Icon, color, trend }: StatusCardProps) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1 truncate">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1 break-words">{value}</p>
            <p className="text-xs sm:text-sm text-gray-600 truncate">{subtitle}</p>
            {trend && (
              <div className="mt-1 sm:mt-2">
                <span className={`text-xs sm:text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isPositive ? '↑' : '↓'} {trend.value}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 ml-1">vs. ontem</span>
              </div>
            )}
          </div>
          <div className={`p-1.5 sm:p-2 md:p-3 rounded-lg ${color} flex-shrink-0`}>
            <Icon className="size-4 sm:size-5 md:size-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
