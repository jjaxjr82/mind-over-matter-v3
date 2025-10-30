import { CheckCircle2, RefreshCw, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MorningStatusCardProps {
  onReopen: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export const MorningStatusCard = ({ onReopen, onRegenerate, isRegenerating }: MorningStatusCardProps) => {
  return (
    <Card className="bg-muted/50 border-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <span className="font-black uppercase tracking-wide text-sm">Morning Complete</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onReopen}
              variant="secondary"
              size="sm"
              className="h-9 text-xs font-bold uppercase tracking-wider"
            >
              <Unlock className="h-3 w-3 mr-1" />
              Reopen
            </Button>
            <Button
              onClick={onRegenerate}
              variant="default"
              size="sm"
              disabled={isRegenerating}
              className="h-9 text-xs font-bold uppercase tracking-wider"
            >
              {isRegenerating ? (
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
