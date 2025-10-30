import { format, startOfWeek, addDays } from "date-fns";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DailyLog {
  id?: string;
  date: string;
  morning_complete?: boolean;
  midday_complete?: boolean;
  evening_complete?: boolean;
  morning_insight?: any;
  midday_insight?: any;
  win?: string;
}

interface WeeklyTrackerProps {
  weeklyLogs: Record<string, DailyLog>;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const WeeklyTracker = ({ weeklyLogs, selectedDate, onDateSelect }: WeeklyTrackerProps) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday

  const getCompletionStatus = (log?: DailyLog) => {
    if (!log) return { completed: 0, total: 3, color: "text-muted-foreground" };
    
    let completed = 0;
    if (log.morning_complete) completed++;
    if (log.midday_complete) completed++;
    if (log.evening_complete) completed++;

    const total = 3;
    const percentage = (completed / total) * 100;

    let color = "text-muted-foreground";
    if (percentage === 100) color = "text-green-500";
    else if (percentage >= 66) color = "text-blue-500";
    else if (percentage >= 33) color = "text-yellow-500";
    else if (percentage > 0) color = "text-orange-500";

    return { completed, total, color, percentage };
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-black uppercase tracking-wider mb-4">Weekly Progress</h3>
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((dayName, index) => {
          const date = addDays(weekStart, index);
          const dateStr = format(date, "yyyy-MM-dd");
          const log = weeklyLogs[dayName];
          const status = getCompletionStatus(log);
          const isSelected = format(selectedDate, "yyyy-MM-dd") === dateStr;
          const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;

          return (
            <button
              key={dayName}
              onClick={() => onDateSelect(date)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                  ? "bg-muted border-2 border-primary"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <span className="text-xs font-bold mb-1">{dayName.slice(0, 3)}</span>
              <span className="text-xs mb-1">{format(date, "d")}</span>
              
              {status.percentage === 100 ? (
                <CheckCircle2 className={`h-5 w-5 ${isSelected ? "text-primary-foreground" : status.color}`} />
              ) : status.percentage > 0 ? (
                <AlertCircle className={`h-5 w-5 ${isSelected ? "text-primary-foreground" : status.color}`} />
              ) : (
                <Circle className={`h-5 w-5 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
              )}
              
              <span className="text-xs font-bold mt-1">
                {status.completed}/{status.total}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
