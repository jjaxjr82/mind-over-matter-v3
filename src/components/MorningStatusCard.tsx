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
    <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-emerald-900 dark:text-emerald-100">Morning Complete</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onReopen}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
            >
              <Unlock className="h-3 w-3 mr-1" />
              Reopen
            </Button>
            <Button
              onClick={onRegenerate}
              variant="outline"
              size="sm"
              disabled={isRegenerating}
              className="h-8 text-xs"
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
