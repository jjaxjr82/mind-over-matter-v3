import { ReactNode } from "react";
import { ChevronDown, RefreshCw, Unlock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PhaseStatusCardProps {
  phase: "morning" | "midday" | "evening";
  title: string;
  icon: ReactNode;
  preview: {
    primary: string;
    secondary?: string;
  };
  details: ReactNode;
  actions: {
    onReopen: () => void;
    onRegenerate?: () => void;
    onReset?: () => void;
    isRegenerating?: boolean;
  };
}

const phaseColors = {
  morning: "border-orange-500/20 bg-orange-50/5 dark:bg-orange-950/5",
  midday: "border-blue-500/20 bg-blue-50/5 dark:bg-blue-950/5",
  evening: "border-purple-500/20 bg-purple-50/5 dark:bg-purple-950/5",
};

export const PhaseStatusCard = ({
  phase,
  title,
  icon,
  preview,
  details,
  actions,
}: PhaseStatusCardProps) => {
  return (
    <Card className={cn("border-2", phaseColors[phase])}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {icon}
          <span className="font-black uppercase tracking-wide text-sm">
            {title} Complete
          </span>
        </div>

        <div className="bg-background/30 rounded-lg p-3 mb-3 space-y-2">
          <p className="text-sm font-semibold leading-relaxed">{preview.primary}</p>
          {preview.secondary && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {preview.secondary}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <details className="group w-full sm:flex-1">
            <summary className="cursor-pointer font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:text-primary transition-colors list-none">
              View Full Details
              <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-4 pt-4 border-t">{details}</div>
          </details>

          <div className="flex gap-2 w-full sm:w-auto">
            {actions.onReset && (
              <Button
                onClick={actions.onReset}
                variant="destructive"
                size="sm"
                className="h-9 text-xs font-bold uppercase tracking-wider flex-1 sm:flex-none"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
            <Button
              onClick={actions.onReopen}
              variant="secondary"
              size="sm"
              className="h-9 text-xs font-bold uppercase tracking-wider flex-1 sm:flex-none"
            >
              <Unlock className="h-3 w-3 mr-1" />
              Reopen
            </Button>
            {actions.onRegenerate && (
              <Button
                onClick={actions.onRegenerate}
                disabled={actions.isRegenerating}
                size="sm"
                className="h-9 text-xs font-bold uppercase tracking-wider flex-1 sm:flex-none"
              >
                {actions.isRegenerating ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
