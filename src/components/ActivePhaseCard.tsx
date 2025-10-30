import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ActivePhaseCardProps {
  phase: "morning" | "midday" | "evening";
  title: string;
  icon: React.ReactNode;
  children: ReactNode;
}

export const ActivePhaseCard = ({ phase, title, icon, children }: ActivePhaseCardProps) => {
  const borderColors = {
    morning: "border-orange-500",
    midday: "border-yellow-500",
    evening: "border-purple-500"
  };

  const bgColors = {
    morning: "bg-orange-500/10",
    midday: "bg-yellow-500/10",
    evening: "bg-purple-500/10"
  };

  return (
    <Card className={`border-2 ${borderColors[phase]} shadow-lg`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-full ${bgColors[phase]} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">Available now</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};
