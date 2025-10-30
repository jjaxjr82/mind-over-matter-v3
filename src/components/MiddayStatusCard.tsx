import { CheckCircle2, RefreshCw, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MiddayStatusCardProps {
  insight: any;
  adjustment: string | null;
  followUp: any;
  onReopen: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export const MiddayStatusCard = ({ 
  insight, 
  adjustment, 
  followUp, 
  onReopen, 
  onRegenerate, 
  isRegenerating 
}: MiddayStatusCardProps) => {
  return (
    <Card className="bg-muted/50 border-2">
      <CardContent className="p-4">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <span className="font-black uppercase tracking-wide text-sm">Midday Complete</span>
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
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  onRegenerate();
                }}
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
              <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
            </div>
          </summary>
          
          <div className="mt-4 space-y-4 pt-4 border-t">
            {adjustment && (
              <div className="bg-background/50 rounded-lg p-4">
                <h4 className="font-bold text-sm uppercase tracking-wide mb-2">Your Adjustment</h4>
                <p className="text-sm whitespace-pre-wrap">{adjustment}</p>
              </div>
            )}
            
            {insight && (
              <div className="bg-background/50 rounded-lg p-4">
                <h4 className="font-bold text-sm uppercase tracking-wide mb-2">Coach's Response</h4>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{insight.analysis}</p>
              </div>
            )}
            
            {followUp && followUp.length > 0 && (
              <div className="bg-background/50 rounded-lg p-4">
                <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Follow-up Conversation</h4>
                <div className="space-y-3">
                  {followUp.map((msg: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded ${msg.role === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
                      <div className="text-xs font-bold uppercase tracking-wide mb-1">
                        {msg.role === 'user' ? 'You' : 'Coach'}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
};
