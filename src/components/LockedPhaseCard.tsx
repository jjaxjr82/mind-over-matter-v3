import { Lock } from "lucide-react";

interface LockedPhaseCardProps {
  title: string;
  unlockTime: string;
  icon?: React.ReactNode;
}

export const LockedPhaseCard = ({ title, unlockTime, icon }: LockedPhaseCardProps) => {
  return (
    <div className="flex items-center gap-3 opacity-50 py-3 px-4 bg-muted rounded-lg">
      <Lock className="h-4 w-4" />
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <div>
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs text-muted-foreground ml-2">
          {unlockTime}
        </span>
      </div>
    </div>
  );
};
