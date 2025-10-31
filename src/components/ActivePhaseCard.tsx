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
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">{title}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Available now</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};
