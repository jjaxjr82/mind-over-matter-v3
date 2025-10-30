import { ReactNode } from "react";

interface DayTimelineProps {
  children: ReactNode;
}

export const DayTimeline = ({ children }: DayTimelineProps) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {children}
    </div>
  );
};
