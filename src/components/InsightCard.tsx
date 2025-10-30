import { useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface InsightData {
  title?: string;
  quote?: {
    text: string;
    author: string;
  };
  mainInsight?: string;
  actionItems?: Array<{ text: string }>;
  deeperInsight?: string;
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

      {insight.mainInsight && (
        <div>
          <h3 className="font-black text-lg text-foreground mb-2 uppercase tracking-wider">Core Thought</h3>
          <p className="text-foreground font-bold leading-relaxed text-sm">{insight.mainInsight}</p>
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

      {insight.deeperInsight && (
        <div className="border-t-2 border-foreground pt-4">
          <h3 className="font-black text-lg text-foreground mb-2 uppercase tracking-wider">
            Deeper Dive
          </h3>
          <p className="text-foreground font-bold leading-relaxed text-sm">{insight.deeperInsight}</p>
        </div>
      )}
    </div>
  );
};

export default InsightCard;
