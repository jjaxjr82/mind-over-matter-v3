import { useState } from "react";
import { CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

interface CompactPhaseCardProps {
  phase: "morning" | "midday" | "evening";
  title: string;
  timestamp?: string | null;
  icon: React.ReactNode;
  children: React.ReactNode;
  onReopen?: () => void;
  onRegenerate?: () => void;
  onReset?: () => void;
}

export const CompactPhaseCard = ({
  phase,
  title,
  timestamp,
  icon,
  children,
  onReopen,
  onRegenerate,
  onReset
}: CompactPhaseCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="border-l-2 border-primary bg-accent/50 rounded-lg p-4 sm:p-5">
        <CollapsibleTrigger className="w-full min-h-[44px]">
          <div className="flex items-center justify-between hover:opacity-80 transition-opacity gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0">{icon}</span>
                <span className="font-semibold text-sm sm:text-base">{title}</span>
              </div>
              {timestamp && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(timestamp), "h:mm a")}
                </span>
              )}
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 pt-4 border-t">
          <div className="space-y-4">
            {children}
            
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {onReopen && (
                <Button size="sm" variant="outline" onClick={onReopen} className="min-h-[44px] w-full sm:w-auto">
                  Reopen Phase
                </Button>
              )}
              {onRegenerate && (
                <Button size="sm" variant="outline" onClick={onRegenerate} className="min-h-[44px] w-full sm:w-auto">
                  Regenerate
                </Button>
              )}
              {onReset && (
                <Button size="sm" variant="destructive" onClick={onReset} className="min-h-[44px] w-full sm:w-auto">
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
