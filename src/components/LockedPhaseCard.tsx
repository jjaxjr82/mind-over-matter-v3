import { Lock } from "lucide-react";

interface LockedPhaseCardProps {
  title: string;
  unlockTime: string;
  icon?: React.ReactNode;
}

export const LockedPhaseCard = ({ title, unlockTime, icon }: LockedPhaseCardProps) => {
  return (
    <div className="flex items-center gap-2 sm:gap-3 opacity-50 py-3 sm:py-4 px-4 bg-muted rounded-lg min-h-[60px]">
      <Lock className="h-4 w-4 flex-shrink-0" />
      {icon && <span className="text-muted-foreground flex-shrink-0">{icon}</span>}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs text-muted-foreground">
          {unlockTime}
        </span>
      </div>
    </div>
  );
};
