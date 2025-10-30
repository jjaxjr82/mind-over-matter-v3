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
      <div className="border-l-2 border-primary bg-accent/50 rounded-lg p-4">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex items-center gap-2">
                {icon}
                <span className="font-semibold">{title}</span>
              </div>
              {timestamp && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(timestamp), "h:mm a")}
                </span>
              )}
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 pt-4 border-t">
          <div className="space-y-4">
            {children}
            
            <div className="flex gap-2 pt-2">
              {onReopen && (
                <Button size="sm" variant="outline" onClick={onReopen}>
                  Reopen Phase
                </Button>
              )}
              {onRegenerate && (
                <Button size="sm" variant="outline" onClick={onRegenerate}>
                  Regenerate
                </Button>
              )}
              {onReset && (
                <Button size="sm" variant="destructive" onClick={onReset}>
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
