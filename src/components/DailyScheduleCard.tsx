import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface DailyScheduleCardProps {
  day: string;
  date: string;
  isToday: boolean;
  workMode: string;
  energyLevel: string;
  focusAreas: string[];
  availableFocusAreas: string[];
  workModes: readonly string[];
  energyLevels: readonly string[];
  onUpdateWorkMode: (value: string) => void;
  onUpdateEnergyLevel: (value: string) => void;
  onToggleFocusArea: (area: string) => void;
}

const DailyScheduleCard = ({
  day,
  date,
  isToday,
  workMode,
  energyLevel,
  focusAreas,
  availableFocusAreas,
  workModes,
  energyLevels,
  onUpdateWorkMode,
  onUpdateEnergyLevel,
  onToggleFocusArea,
}: DailyScheduleCardProps) => {
  return (
    <Card className={`${isToday ? 'border-primary' : ''}`}>
      <CardContent className="p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black">{day}</h3>
              <p className="text-xs text-muted-foreground font-bold">{date}</p>
            </div>
            {isToday && (
              <Badge variant="default" className="font-black">
                TODAY
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black mb-1 uppercase">Work Mode</label>
              <Select value={workMode} onValueChange={onUpdateWorkMode}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-black mb-1 uppercase">Energy</label>
              <Select value={energyLevel} onValueChange={onUpdateEnergyLevel}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {energyLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black mb-2 uppercase">Focus Areas</label>
            <div className="flex flex-wrap gap-1.5">
              {availableFocusAreas.length > 0 ? (
                availableFocusAreas.map((area) => {
                  const isSelected = focusAreas.includes(area);
                  return (
                    <Badge
                      key={area}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer text-xs px-2 py-0.5"
                      onClick={() => onToggleFocusArea(area)}
                    >
                      {area}
                    </Badge>
                  );
                })
              ) : (
                <p className="text-muted-foreground font-bold text-xs">
                  Set up focus areas in Schedule Manager
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyScheduleCard;
