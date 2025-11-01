import { Target, Heart, CheckSquare, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface MorningQuickReferenceProps {
  insight: any;
  checkedItems: number[];
  onCheckItem: (index: number) => void;
}

export const MorningQuickReference = ({ insight, checkedItems, onCheckItem }: MorningQuickReferenceProps) => {
  if (!insight) return null;

  const actionItems = insight.actionItems || [];
  const recommendations = insight.recommendations || [];

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-black uppercase tracking-wider">Quick Reference</CardTitle>
      </CardHeader>
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
    </Card>
  );
};
