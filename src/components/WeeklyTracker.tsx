import { format, addDays } from "date-fns";
import { formatDateForDB, getEasternWeekStart, addDaysET, getEasternDate } from "@/utils/timezoneUtils";
import { CheckCircle2, Circle, AlertCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const weekStart = getEasternWeekStart(selectedDate); // Monday in ET

  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateSelect(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateSelect(newDate);
  };

  const goToToday = () => {
    onDateSelect(new Date());
  };

  const getWeekRangeText = () => {
    const start = weekStart;
    const end = addDaysET(weekStart, 6); // Sunday
    
    const startMonth = format(start, "MMM");
    const endMonth = format(end, "MMM");
    
    if (startMonth === endMonth) {
      return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
    }
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  const getCompletionStatus = (log?: DailyLog) => {
    if (!log) return { completed: 0, total: 3, color: "text-muted-foreground" };
    
    let completed = 0;
    // Only count as complete if BOTH the flag is true AND the data exists
    if (log.morning_complete && log.morning_insight) completed++;
    if (log.midday_complete && log.midday_insight) completed++;
    if (log.evening_complete && log.win) completed++; // Evening uses win/weakness/tomorrows_prep

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider">Weekly Progress</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousWeek}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[180px] text-center">
            {getWeekRangeText()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextWeek}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-8 px-3 text-xs"
          >
            Today
          </Button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onDateSelect(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((dayName, index) => {
          const date = addDaysET(weekStart, index);
          const dateStr = formatDateForDB(date);
          const log = weeklyLogs[dayName];
          const status = getCompletionStatus(log);
          const isSelected = formatDateForDB(selectedDate) === dateStr;
          const isToday = formatDateForDB(getEasternDate()) === dateStr;

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
