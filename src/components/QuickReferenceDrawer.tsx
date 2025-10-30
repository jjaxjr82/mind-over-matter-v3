import { useState } from "react";
import { BookOpen, Target, AlertTriangle, X, ChevronRight, FileText, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface QuickReferenceDrawerProps {
  morningInsight: any | null;
  middayInsight: any | null;
  isOpen: boolean;
  onToggle: () => void;
  onViewFullInsight: () => void;
}

export function QuickReferenceDrawer({ 
  morningInsight, 
  middayInsight, 
  isOpen, 
  onToggle,
  onViewFullInsight 
}: QuickReferenceDrawerProps) {
  const isMobile = useIsMobile();
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const handleCheck = (itemId: number) => {
    setCheckedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const content = (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-border bg-muted">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-black uppercase tracking-wider">Quick Reference</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!morningInsight && !middayInsight ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-bold">Generate your morning insight to see quick reference items here.</p>
          </div>
        ) : (
          <>
            {/* Mantra Section */}
            {morningInsight?.mantra && (
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary rounded-lg p-4">
                <div className="text-xs font-black uppercase tracking-wider text-primary mb-2">
                  🎯 Carry This
                </div>
                <p className="text-lg font-black leading-tight text-foreground">
                  {morningInsight.mantra}
                </p>
              </div>
            )}

            {/* Power Question */}
            {morningInsight?.powerQuestion && (
              <div className="bg-card border-2 border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider">Power Question</span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {morningInsight.powerQuestion}
                </p>
              </div>
            )}

            {/* Pitfall Warning */}
            {morningInsight?.pitfalls && morningInsight.pitfalls.length > 0 && (
              <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-black uppercase tracking-wider text-destructive">Today's Pitfall</span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {morningInsight.pitfalls[0].text || morningInsight.pitfalls[0]}
                </p>
              </div>
            )}

            {/* Midday Adjustment (if exists) */}
            {middayInsight?.quote && (
              <div className="bg-secondary/30 border-2 border-border rounded-lg p-4">
                <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
                  🌅 Midday Adjustment
                </div>
                <p className="text-sm font-bold italic text-foreground">
                  "{middayInsight.quote.text}"
                </p>
              </div>
            )}

            {/* Action Items Checklist */}
            {(morningInsight?.actionItems || middayInsight?.actionItems) && (
              <div className="bg-card border-2 border-border rounded-lg p-4">
                <div className="text-xs font-black uppercase tracking-wider mb-3">
                  ✓ Action Items
                </div>
                <div className="space-y-2">
                  {[
                    ...(morningInsight?.actionItems?.slice(0, 3) || []),
                    ...(middayInsight?.actionItems?.slice(0, 2) || [])
                  ].slice(0, 5).map((item: any, idx: number) => {
                    const itemText = item.text || item;
                    return (
                      <div key={idx} className="flex items-start gap-2">
                        <Checkbox
                          id={`action-${idx}`}
                          checked={checkedItems.includes(idx)}
                          onCheckedChange={() => handleCheck(idx)}
                          className="mt-0.5"
                        />
                        <label
                          htmlFor={`action-${idx}`}
                          className={cn(
                            "text-sm font-bold cursor-pointer flex-1 leading-tight",
                            checkedItems.includes(idx) && "line-through text-muted-foreground"
                          )}
                        >
                          {itemText}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {morningInsight?.recommendations && morningInsight.recommendations.length > 0 && (
              <div className="bg-card border-2 border-border rounded-lg p-4">
                <div className="text-xs font-black uppercase tracking-wider mb-3">
                  📚 Recommended Reading
                </div>
                <div className="space-y-2">
                  {morningInsight.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {rec.type === 'book' ? (
                        <FileText className="h-3 w-3 text-primary flex-shrink-0" />
                      ) : (
                        <Headphones className="h-3 w-3 text-primary flex-shrink-0" />
                      )}
                      <span className="font-bold text-foreground leading-tight">{rec.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {(morningInsight || middayInsight) && (
        <div className="p-4 border-t-2 border-border bg-muted">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onViewFullInsight();
              onToggle();
            }}
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            View Full Insight
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Floating Toggle Button */}
        <Button
          onClick={onToggle}
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        >
          <BookOpen className="h-6 w-6" />
        </Button>

        {/* Mobile Drawer */}
        <Drawer open={isOpen} onOpenChange={onToggle}>
          <DrawerContent className="max-h-[85vh]">
            {content}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {/* Desktop Toggle Tab */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-foreground px-2 py-8 rounded-l-lg shadow-lg hover:bg-primary/90 transition-all"
          style={{ writingMode: 'vertical-rl' }}
        >
          <span className="text-sm font-black uppercase tracking-wider">Quick Ref</span>
        </button>
      )}

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-screen w-[350px] bg-background border-l-2 border-border shadow-2xl z-50 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {content}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onToggle}
        />
      )}
    </>
  );
}
