import { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ActivePhaseCardProps {
  phase: "morning" | "midday" | "evening";
  title: string;
  icon: React.ReactNode;
  children: ReactNode;
}

export const ActivePhaseCard = ({ phase, title, icon, children }: ActivePhaseCardProps) => {
  return (
    <Card className="border-2 border-primary shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
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
