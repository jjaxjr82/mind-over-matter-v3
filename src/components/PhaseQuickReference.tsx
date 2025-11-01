import { Target, Heart, CheckSquare, BookOpen, TrendingUp, Trophy, ArrowRight, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface PhaseQuickReferenceProps {
  phase: "morning" | "midday" | "evening";
  insight: any;
  checkedItems: number[];
  onCheckItem: (index: number) => void;
  eveningData?: {
    win?: string;
    tomorrowPrep?: string;
    weakness?: string;
  };
}

export const PhaseQuickReference = ({ 
  phase, 
  insight, 
  checkedItems, 
  onCheckItem,
  eveningData 
}: PhaseQuickReferenceProps) => {
  const [isOpen, setIsOpen] = useState(true);
  
  if (!insight && !eveningData) return null;

  // Morning Phase Quick Reference
  if (phase === "morning") {
    const actionItems = insight.actionItems || [];
    const recommendations = insight.recommendations || [];

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-2 shadow-sm">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-black uppercase tracking-wider flex items-center justify-between">
                <span>Morning Insights</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
          {/* Power Question */}
          {insight.powerQuestion && (
            <div className="border-l-4 border-primary pl-4 py-2">
              <div className="flex items-start gap-2 mb-1">
                <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Power Question</span>
              </div>
              <p className="text-sm font-medium italic text-foreground ml-6">{insight.powerQuestion}</p>
            </div>
          )}

          {/* Carry This */}
          {insight.carryThis && (
            <>
              <Separator />
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider text-primary">Carry This</span>
                </div>
                <p className="text-base font-bold text-foreground">{insight.carryThis}</p>
              </div>
            </>
          )}

          {/* Action Items */}
          {actionItems.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Your Mission</span>
                </div>
                <div className="space-y-2">
                  {actionItems.map((item: any, index: number) => {
                    const isChecked = checkedItems.includes(index);
                    const text = typeof item === "string" ? item : item.text;
                    
                    return (
                      <div key={index} className="flex items-start gap-2 group">
                        <Checkbox
                          id={`action-${index}`}
                          checked={isChecked}
                          onCheckedChange={() => onCheckItem(index)}
                          className="mt-0.5 border-2"
                        />
                        <label
                          htmlFor={`action-${index}`}
                          className={`text-sm cursor-pointer flex-1 ${
                            isChecked ? "line-through text-muted-foreground" : "text-foreground font-medium"
                          }`}
                        >
                          {text}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Recommended Resources */}
          {recommendations.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Recommended Resources</span>
                </div>
                <div className="space-y-2">
                  {recommendations.map((rec: any, index: number) => {
                    const content = (
                      <div className="flex items-start gap-2 text-sm border-l-2 border-muted pl-3 py-1 hover:border-primary transition-colors">
                        <span className="text-base flex-shrink-0">{rec.type === "article" ? "📄" : "🎧"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-bold text-foreground hover:text-primary transition-colors">{rec.title}</span>
                            {rec.estimatedTime && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {rec.estimatedTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    
                    return rec.url ? (
                      <a 
                        key={index} 
                        href={rec.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={index}>{content}</div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // Midday Phase Quick Reference
  if (phase === "midday") {
    const actionItems = insight?.actionItems || [];
    const keyAdjustments = insight?.keyAdjustments || [];

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-2 shadow-sm">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-black uppercase tracking-wider flex items-center justify-between">
                <span>Midday Insights</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
          {/* Analysis Summary */}
          {insight?.analysis && (
            <div className="border-l-4 border-primary pl-4 py-2">
              <div className="flex items-start gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Analysis</span>
              </div>
              <p className="text-sm text-foreground ml-6 leading-relaxed">
                {insight.analysis.length > 200 ? `${insight.analysis.substring(0, 200)}...` : insight.analysis}
              </p>
            </div>
          )}

          {/* Key Adjustments */}
          {keyAdjustments.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Key Adjustments</span>
                </div>
                <div className="space-y-2">
                  {keyAdjustments.map((adjustment: string, index: number) => (
                    <div key={index} className="text-sm border-l-2 border-primary/40 pl-3 py-1">
                      <span className="font-medium text-foreground">{adjustment}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Action Items */}
          {actionItems.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Action Items</span>
                </div>
                <div className="space-y-2">
                  {actionItems.map((item: any, index: number) => {
                    const isChecked = checkedItems.includes(index);
                    const text = typeof item === "string" ? item : item.text;
                    
                    return (
                      <div key={index} className="flex items-start gap-2 group">
                        <Checkbox
                          id={`midday-action-${index}`}
                          checked={isChecked}
                          onCheckedChange={() => onCheckItem(index)}
                          className="mt-0.5 border-2"
                        />
                        <label
                          htmlFor={`midday-action-${index}`}
                          className={`text-sm cursor-pointer flex-1 ${
                            isChecked ? "line-through text-muted-foreground" : "text-foreground font-medium"
                          }`}
                        >
                          {text}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // Evening Phase Quick Reference
  if (phase === "evening" && eveningData) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-2 shadow-sm">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-black uppercase tracking-wider flex items-center justify-between">
                <span>Evening Insights</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
          {/* Today's Win */}
          {eveningData.win && (
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-wider text-primary">Today's Win</span>
              </div>
              <p className="text-sm font-medium text-foreground">{eveningData.win}</p>
            </div>
          )}

          {/* Tomorrow's Prep */}
          {eveningData.tomorrowPrep && (
            <>
              <Separator />
              <div className="border-l-4 border-primary pl-4 py-2">
                <div className="flex items-start gap-2 mb-1">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Tomorrow's Focus</span>
                </div>
                <p className="text-sm font-medium text-foreground ml-6">{eveningData.tomorrowPrep}</p>
              </div>
            </>
          )}

          {/* Growth Area */}
          {eveningData.weakness && (
            <>
              <Separator />
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Growth Area</span>
                </div>
                <p className="text-sm text-foreground">{eveningData.weakness}</p>
              </div>
            </>
          )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return null;
};
