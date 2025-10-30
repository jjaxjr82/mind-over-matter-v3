import { CheckCircle2, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EveningStatusCardProps {
  win: string | null;
  weakness: string | null;
  tomorrowsPrep: string | null;
  onReopen: () => void;
}

export const EveningStatusCard = ({ 
  win, 
  weakness, 
  tomorrowsPrep, 
  onReopen 
}: EveningStatusCardProps) => {
  return (
    <Card className="bg-muted/50 border-2">
      <CardContent className="p-4">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <span className="font-black uppercase tracking-wide text-sm">Evening Complete</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  onReopen();
                }}
                variant="secondary"
                size="sm"
                className="h-9 text-xs font-bold uppercase tracking-wider"
              >
                <Unlock className="h-3 w-3 mr-1" />
                Reopen
              </Button>
              <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
            </div>
          </summary>
          
          <div className="mt-4 space-y-4 pt-4 border-t">
            {win && (
              <div className="bg-background/50 rounded-lg p-4">
                <h4 className="font-bold text-sm uppercase tracking-wide mb-2 text-green-600 dark:text-green-400">Today's Win</h4>
                <p className="text-sm whitespace-pre-wrap">{win}</p>
              </div>
            )}
            
            {weakness && (
              <div className="bg-background/50 rounded-lg p-4">
                <h4 className="font-bold text-sm uppercase tracking-wide mb-2 text-orange-600 dark:text-orange-400">What Needed Work</h4>
                <p className="text-sm whitespace-pre-wrap">{weakness}</p>
              </div>
            )}
            
            {tomorrowsPrep && (
              <div className="bg-background/50 rounded-lg p-4">
                <h4 className="font-bold text-sm uppercase tracking-wide mb-2">Tomorrow's Prep</h4>
                <p className="text-sm whitespace-pre-wrap">{tomorrowsPrep}</p>
              </div>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
};
