import { useState } from 'react';
import { CheckSquare, Square, FileText, Headphones } from 'lucide-react';

interface InsightData {
  title?: string;
  quote?: {
    text: string;
    author: string;
  };
  powerQuestion?: string;
  metaphor?: string;
  mainInsight?: string;
  actionItems?: Array<{ text: string }>;
  todaysPitfall?: string;
  theAnchor?: string;
  carryThis?: string;
  deeperInsight?: string;
  recommendations?: Array<{
    type: 'article' | 'podcast';
    title: string;
    description: string;
    estimatedTime: string;
  }>;
}

interface InsightCardProps {
  insight: InsightData | null;
}

const InsightCard = ({ insight }: InsightCardProps) => {
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const handleCheck = (itemId: number) => {
    setCheckedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  if (!insight) return null;

  return (
    <div className="p-4 bg-secondary border-4 border-foreground animate-fade-in space-y-4">
      <h2 className="text-2xl font-black text-center text-foreground uppercase tracking-wider mb-3">
        {insight.title || "Daily Briefing"}
      </h2>

      {insight.quote && (
        <blockquote className="text-center p-4 bg-background border-l-4 border-primary">
          <p className="text-lg font-bold text-foreground">"{insight.quote.text}"</p>
          <footer className="mt-2 text-xs text-muted-foreground font-black uppercase tracking-widest">
            - {insight.quote.author}
          </footer>
        </blockquote>
      )}

      {insight.powerQuestion && (
        <div className="border-t-2 border-foreground pt-4">
          <h3 className="font-black text-lg text-foreground mb-2 uppercase tracking-wider">
            🎯 Your Power Question
          </h3>
          <p className="text-foreground font-bold leading-relaxed text-sm italic bg-primary/10 p-3 border-l-4 border-primary">
            {insight.powerQuestion}
          </p>
        </div>
      )}

      {insight.metaphor && (
        <div className="border-t-2 border-foreground pt-4">
          <h3 className="font-black text-lg text-foreground mb-2 uppercase tracking-wider">
            📖 Today's Story
          </h3>
          <p className="text-foreground font-bold leading-relaxed text-sm bg-secondary/30 p-3">
            {insight.metaphor}
          </p>
        </div>
      )}

      {insight.actionItems && insight.actionItems.length > 0 && (
        <div>
          <h3 className="font-black text-lg text-foreground mb-3 uppercase tracking-wider">Mission</h3>
          <div className="space-y-2">
            {insight.actionItems.map((item, index) => {
              const isChecked = checkedItems.includes(index);
              return (
                <div
                  key={index}
                  onClick={() => handleCheck(index)}
                  className={`flex items-start p-3 border-2 cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-background text-muted-foreground line-through border-muted-foreground'
                      : 'bg-background hover:bg-primary hover:text-background border-foreground'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="ml-2 font-bold text-sm">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {insight.todaysPitfall && (
        <div className="border-t-2 border-foreground pt-4">
          <h3 className="font-black text-lg text-foreground mb-2 uppercase tracking-wider text-destructive">
            ⚠️ Today's Pitfall
          </h3>
          <p className="text-foreground font-bold leading-relaxed text-sm bg-destructive/10 p-3 border-l-4 border-destructive">
            {insight.todaysPitfall}
          </p>
        </div>
      )}

      {insight.theAnchor && (
        <div className="border-t-2 border-foreground pt-4">
          <h3 className="font-black text-lg text-foreground mb-2 uppercase tracking-wider">
            The Anchor
          </h3>
          <p className="text-foreground font-bold leading-relaxed text-sm bg-primary/5 p-3 border-l-4 border-primary">
            {insight.theAnchor}
          </p>
        </div>
      )}

      {insight.carryThis && (
        <div className="border-t-2 border-foreground pt-4">
          <h3 className="font-black text-lg text-foreground mb-2 uppercase tracking-wider">
            💪 Carry This
          </h3>
          <p className="text-foreground font-black leading-relaxed text-base text-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-foreground italic">
            "{insight.carryThis}"
          </p>
        </div>
      )}

      {insight.deeperInsight && (
        <div className="border-t-2 border-foreground pt-4">
          <h3 className="font-black text-lg text-foreground mb-2 uppercase tracking-wider">
            Deeper Dive
          </h3>
          <p className="text-foreground font-bold leading-relaxed text-sm">{insight.deeperInsight}</p>
        </div>
      )}

      {insight.recommendations && insight.recommendations.length > 0 && (
        <div className="border-t-2 border-foreground pt-4">
          <h3 className="font-black text-lg text-foreground mb-3 uppercase tracking-wider">
            Recommended Resources
          </h3>
          <div className="space-y-3">
            {insight.recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-3 bg-background border-2 border-foreground hover:bg-primary hover:text-background transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {rec.type === 'article' ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <Headphones className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-black text-sm uppercase tracking-wide">{rec.title}</h4>
                      <span className="text-xs font-bold uppercase tracking-wider opacity-70 whitespace-nowrap">
                        {rec.estimatedTime}
                      </span>
                    </div>
                    <p className="text-xs font-bold leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightCard;
