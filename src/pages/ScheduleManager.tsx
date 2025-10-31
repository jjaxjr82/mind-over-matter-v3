import { ArrowLeft, Save, Plus, X, Sun, Target, BookOpen, Calendar, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { externalClient } from '@/integrations/supabase/externalClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useScheduleManager } from '@/hooks/useScheduleManager';
import { DEFAULT_FOCUS_AREAS } from '@/hooks/useScheduleManager';

const ScheduleManager = () => {
  const nav = useNavigate();
  const [newFocusArea, setNewFocusArea] = useState('');

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await externalClient.auth.getSession();
      if (!session) {
        nav('/auth');
      }
    };

    checkAuth();

    const { data: { subscription } } = externalClient.auth.onAuthStateChange((event, session) => {
      if (!session) {
        nav('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [nav]);

  const {
    DAYS,
    WORK_MODES,
    focusAreas,
    schedules,
    isLoading,
    isSaving,
    updateSchedule,
    toggleFocusArea,
    addFocusArea,
    removeFocusArea,
    saveSchedules,
    navigate,
  } = useScheduleManager();

  const handleAddFocusArea = () => {
    if (newFocusArea.trim()) {
      addFocusArea(newFocusArea);
      setNewFocusArea('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-2xl font-black text-foreground">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 md:mb-8 pb-4 md:pb-6 border-b border-border">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 md:mb-6">
            <div>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-impact leading-none tracking-tight uppercase mb-1"
                style={{
                  background: "linear-gradient(180deg, #FF0000 0%, #8B0000 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.9))",
                  fontWeight: "900",
                }}
              >
                MindFlow
              </h1>
              <p className="text-sm text-muted-foreground">Schedule Manager</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={saveSchedules} 
                disabled={isSaving} 
                size="lg" 
                className="flex-1 sm:flex-initial sm:px-8"
              >
                <Save className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{isSaving ? 'SAVING...' : 'SAVE'}</span>
                <span className="sm:hidden">{isSaving ? '...' : 'SAVE'}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={async () => {
                  await externalClient.auth.signOut();
                  nav('/auth');
                }}
                className="text-muted-foreground shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Navigation Bar */}
          <nav className="bg-muted/50 rounded-lg p-2 flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="h-10 px-2 sm:px-3"
            >
              <Sun className="h-4 w-4 sm:mr-2" />
              <span className="text-sm font-bold hidden sm:inline">Today</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="h-10 px-2 sm:px-3"
            >
              <Target className="h-4 w-4 sm:mr-2" />
              <span className="text-sm font-bold hidden sm:inline">Challenges</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="h-10 px-2 sm:px-3"
            >
              <BookOpen className="h-4 w-4 sm:mr-2" />
              <span className="text-sm font-bold hidden sm:inline">Library</span>
            </Button>
            <Button
              variant="ghost"
              className="h-10 px-2 sm:px-3 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Calendar className="h-4 w-4 sm:mr-2" />
              <span className="text-sm font-bold hidden sm:inline">Schedule</span>
            </Button>
          </nav>
        </header>

        {/* Focus Area Management */}
        <div className="mb-4 md:mb-6 border-2 md:border-4 border-border p-4 md:p-6 bg-card">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-3 md:mb-4 text-primary">
            Manage Focus Areas
          </h3>
          <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
            {focusAreas.map((area) => (
              <Badge 
                key={area} 
                variant="outline" 
                className="text-sm border-2 border-border px-3 py-1.5 flex items-center gap-2"
              >
                {area}
                {!DEFAULT_FOCUS_AREAS.includes(area) && (
                  <button
                    onClick={() => removeFocusArea(area)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newFocusArea}
              onChange={(e) => setNewFocusArea(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFocusArea()}
              placeholder="Add custom focus area..."
              className="border-2 border-border flex-1"
            />
            <Button onClick={handleAddFocusArea} variant="outline" className="border-2 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4 md:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 border-2 md:border-4 border-border p-4 md:p-6 bg-card">
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-2 text-primary">Work Mode</h3>
            <p className="text-xs text-muted-foreground">Your default work location for this day</p>
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-2 text-primary">Focus Areas</h3>
            <p className="text-xs text-muted-foreground">Main activities for this day (select multiple)</p>
          </div>
        </div>
        {/* Schedule Grid */}
        <div className="grid gap-3 md:gap-4">
          {DAYS.map((day) => {
            const schedule = schedules[day] || { work_mode: 'Deep Work', focus_areas: [] };
            return (
              <div
                key={day}
                className="border-2 md:border-4 border-border bg-card p-4 md:p-6 hover:border-primary transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_2fr] gap-4 md:gap-6">
                  {/* Day Name */}
                  <div className="md:pt-2">
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider">
                      {day}
                    </h2>
                  </div>

                  {/* Work Mode */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-2 text-muted-foreground">
                      Work Mode
                    </label>
                    <Select
                      value={schedule.work_mode}
                      onValueChange={(value) => updateSchedule(day, 'work_mode', value)}
                    >
                      <SelectTrigger className="border-2 border-border bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {WORK_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Focus Areas (Multi-select) */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-2 text-muted-foreground">
                      Focus Areas {schedule.focus_areas?.length > 0 && `(${schedule.focus_areas.length} selected)`}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {focusAreas.length > 0 ? (
                        focusAreas.map((area) => {
                          const isSelected = schedule.focus_areas?.includes(area) || false;
                          return (
                            <Badge
                              key={area}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer border-2 transition-all ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary font-bold' 
                                  : 'bg-background hover:bg-muted border-muted-foreground/30'
                              }`}
                              onClick={() => toggleFocusArea(day, area)}
                            >
                              {area}
                            </Badge>
                          );
                        })
                      ) : (
                        <p className="text-xs text-muted-foreground">Add focus areas above to get started</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default ScheduleManager;
