import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { externalClient } from "@/integrations/supabase/externalClient";
import { dualInsert, dualUpdate, dualDelete } from "@/integrations/supabase/dualWrite";
import { supabase } from "@/integrations/supabase/client";
import { parseScheduleFromExternalDB } from "@/utils/databaseSchemaAdapters";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Lock,
  BrainCircuit,
  Loader,
  Zap,
  BookOpen,
  ShieldCheck,
  ChevronsRight,
  AlertTriangle,
  Target,
  Calendar as CalendarIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import InsightCard from "@/components/InsightCard";
import ChallengesModal from "@/components/ChallengesModal";
import WisdomLibraryModal from "@/components/WisdomLibraryModal";
import FollowUpChat from "@/components/FollowUpChat";
import DailyScheduleCard from "@/components/DailyScheduleCard";
import { WeeklyTracker } from "@/components/WeeklyTracker";
import { MorningQuickReference } from "@/components/MorningQuickReference";
import { DayTimeline } from "@/components/DayTimeline";
import { CompactPhaseCard } from "@/components/CompactPhaseCard";
import { ActivePhaseCard } from "@/components/ActivePhaseCard";
import { LockedPhaseCard } from "@/components/LockedPhaseCard";
import { getQuoteDisplay } from "@/utils/safeDisplay";
import { WORK_MODES, ENERGY_LEVELS } from "@/hooks/useScheduleManager";

interface Challenge {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface WisdomEntry {
  id: string;
  name: string;
  description: string;
  tag: string;
  is_active: boolean;
}

interface DailyLog {
  id?: string;
  date: string;
  situation: string;
  morning_insight: any;
  morning_follow_up: any[];
  midday_insight?: any;
  midday_adjustment: string;
  midday_follow_up: any[];
  win: string;
  weakness: string;
  tomorrows_prep: string;
  completed_action_items?: {
    morning?: number[];
    midday?: number[];
  };
}

interface WeekSchedule {
  day_of_week: string;
  work_mode: string;
  focus_areas: string[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const seedUserWisdom = async (userId: string) => {
  const wisdomSources = [
    { name: 'Stoic Philosophy', description: 'Dichotomy of Control and what you can influence', tag: 'Philosophy' },
    { name: 'Marcus Aurelius - Meditations', description: 'Roman emperor and Stoic philosopher', tag: 'Philosophy' },
    { name: 'Epictetus', description: 'Stoic philosophy', tag: 'Philosophy' },
    { name: 'Can\'t Hurt Me - David Goggins', description: 'Master Your Mind and Defy the Odds', tag: 'Self-Help' },
    { name: 'The 5 Second Rule', description: 'Transform your Life, Work, and Confidence with Everyday Courage', tag: 'Self-Help' },
    { name: 'Atomic Habits - James Clear', description: 'Systems and habit formation', tag: 'Self-Help' },
    { name: 'The Charisma Myth', description: 'Charisma as a learnable skill', tag: 'Self-Help' },
    { name: 'Think Like a Monk - Jay Shetty', description: 'Mindfulness and purpose', tag: 'Spirituality' },
    { name: 'Jay Shetty', description: 'Mindfulness and purpose-driven living', tag: 'Spirituality' },
    { name: 'Eckhart Tolle', description: 'Present moment awareness and consciousness', tag: 'Spirituality' },
    { name: 'Dopamine Nation', description: 'Finding Balance in the Age of Indulgence', tag: 'Psychology' },
    { name: 'Chatter', description: 'The Voice in Our Head, Why It Matters, and How to Harness It', tag: 'Psychology' },
    { name: 'Shift', description: 'Managing Your Emotions—So They Don\'t Manage You', tag: 'Psychology' },
    { name: 'The Happiness Trap', description: 'Acceptance and Commitment Therapy', tag: 'Psychology' },
    { name: 'Tony Robbins', description: 'Peak performance and personal power', tag: 'Leadership' },
    { name: 'Simon Sinek', description: 'Concept of "Why" and finding purpose', tag: 'Leadership' },
    { name: 'Kirby Smart', description: 'Leadership and coaching excellence', tag: 'Leadership' },
    { name: 'Eric Thomas', description: 'Motivational speaking and overcoming adversity', tag: 'Motivation' },
    { name: 'Les Brown', description: 'Motivational speaking and personal development', tag: 'Motivation' },
    { name: 'David Goggins', description: 'Mental toughness and embracing discomfort', tag: 'Mindset' },
    { name: 'Kobe Bryant - Mamba Mentality', description: 'Relentless preparation and focus', tag: 'Mindset' },
    { name: 'Don\'t Believe Everything You Think', description: 'Cognitive awareness and mental clarity', tag: 'Mindfulness' },
    { name: 'The Naked Mind', description: 'Understanding and overcoming addiction', tag: 'Addiction Recovery' },
    { name: 'Alcohol Lied to Me', description: 'The Intelligent Escape from Alcohol Addiction', tag: 'Addiction Recovery' },
    { name: 'The Explosive Child', description: 'Parenting strategies', tag: 'Parenting' },
    { name: 'Raising Good Humans', description: 'Mindful approach to parenting', tag: 'Parenting' },
    { name: 'How to Talk to Anyone', description: '92 Little Tricks for Big Success in Relationships', tag: 'Communication' },
    { name: 'More Than a Body', description: 'Your Body Is an Instrument, Not an Ornament', tag: 'Body Positivity' },
    { name: 'Greenlights - Matthew McConaughey', description: 'Autobiography', tag: 'Biography' },
  ];

  const entries = wisdomSources.map(w => ({
    user_id: userId,
    name: w.name,
    description: w.description,
    tag: w.tag,
    is_active: true
  }));

  await dualInsert('wisdom_library', entries);
};

const seedUserChallenges = async (userId: string) => {
  const challengeTexts = [
    'Control - Stop Trying to Control the Uncontrollable',
    'Patience - To Remain Calm when dealing with frustration with wife and daughter',
    'Hopelessness - Current political climate is giving me anxiety for future and disappointment in my family and friends who voted for Trump',
    'Road Rage - Help with not losing temper',
    'Body Image - Feel fat when I know I am not, I avoid situation and clothes that don\'t fit',
  ];

  const entries = challengeTexts.map(text => {
    const [name, ...descParts] = text.split(' - ');
    return {
      user_id: userId,
      name: name.trim(),
      description: descParts.join(' - ').trim(),
      is_active: true
    };
  });

  await dualInsert('challenges', entries);
};

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [wisdomEntries, setWisdomEntries] = useState<WisdomEntry[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const [weekSchedule, setWeekSchedule] = useState<Record<string, WeekSchedule>>({});
  const [availableFocusAreas, setAvailableFocusAreas] = useState<string[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, DailyLog>>({});
  const [isChallengesModalOpen, setIsChallengesModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [situationText, setSituationText] = useState("");
  const [middayAdjustmentText, setMiddayAdjustmentText] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Today's schedule settings (from schedule, not stored in daily_logs)
  const [todayWorkMode, setTodayWorkMode] = useState<string>("WFH");
  const [todayEnergyLevel, setTodayEnergyLevel] = useState<string>("Medium");
  const [todayFocusAreas, setTodayFocusAreas] = useState<string[]>([]);
  
  // Phase completion tracking (local state only)
  const [morningCompleted, setMorningCompleted] = useState(false);
  const [middayCompleted, setMiddayCompleted] = useState(false);
  const [eveningCompleted, setEveningCompleted] = useState(false);
  
  // Completed action items tracking
  const [completedActionItems, setCompletedActionItems] = useState<{ morning: number[]; midday: number[] }>({
    morning: [],
    midday: []
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await externalClient.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setAuthChecked(true);
    };

    checkAuth();

    const {
      data: { subscription },
    } = externalClient.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setAuthChecked(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load focus areas from schedule
  const loadFocusAreas = useCallback(async () => {
    if (!user) return;

    try {
      const { data: scheduleData, error: scheduleError } = await externalClient.from("schedules").select("*").eq("user_id", user.id);

      if (scheduleError) throw scheduleError;

      // Load focus areas ONLY from master record
      const masterRecord = scheduleData?.find((d) => d.day_of_week === "_focus_areas_");
      const masterFocusAreas = masterRecord?.tags || [];
      console.log("🎯 Daily view loaded focus areas from master:", masterFocusAreas);

      const scheduleMap: Record<string, string> = {};
      const weekScheduleMap: Record<string, WeekSchedule> = {};

      scheduleData?.forEach((day) => {
        if (day.day_of_week === "_focus_areas_") return; // Skip master record

        const tags = day.tags || [];
        const workMode = tags.find((t: string) => WORK_MODES.includes(t as any)) || "WFH";
        const focusAreas = tags.filter(
          (t: string) => !WORK_MODES.includes(t as any) && !ENERGY_LEVELS.includes(t as any),
        );

        const tagsPart = day.tags?.length ? `${day.tags.join(", ")}. ` : "";
        scheduleMap[day.day_of_week] = `${tagsPart}${day.description || ""}`.trim();

        weekScheduleMap[day.day_of_week] = {
          day_of_week: day.day_of_week,
          work_mode: workMode,
          focus_areas: focusAreas,
        };
      });

      setSchedule(scheduleMap);
      setWeekSchedule(weekScheduleMap);
      setAvailableFocusAreas(masterFocusAreas);

      return weekScheduleMap;
    } catch (error: any) {
      console.error("Error loading focus areas:", error);
      return {};
    }
  }, [user]);

  // Load data on mount
  useEffect(() => {
    if (!user || !authChecked) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Clean up duplicates first
        const { cleanupDuplicateChallenges, cleanupDuplicateWisdom } = await import('@/utils/cleanupDuplicates');
        const [challengesResult, wisdomResult] = await Promise.all([
          cleanupDuplicateChallenges(user.id),
          cleanupDuplicateWisdom(user.id)
        ]);
        
        if (challengesResult.removed > 0 || wisdomResult.removed > 0) {
          toast.success(`Cleaned up ${challengesResult.removed} duplicate challenges and ${wisdomResult.removed} duplicate wisdom entries`);
        }
        
        // Load wisdom entries
        const { data: wisdomData, error: wisdomError } = await externalClient
          .from("wisdom_library")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (wisdomError) throw wisdomError;
        
        // Seed wisdom sources if empty
        if (!wisdomData || wisdomData.length === 0) {
          await seedUserWisdom(user.id);
          const { data: reloadedWisdom } = await externalClient
            .from("wisdom_library")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });
          setWisdomEntries(reloadedWisdom || []);
        } else {
          setWisdomEntries(wisdomData);
        }

        // Load challenges
        const { data: challengesData, error: challengesError } = await externalClient
          .from("challenges")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (challengesError) throw challengesError;
        
        // Seed challenges if empty
        if (!challengesData || challengesData.length === 0) {
          await seedUserChallenges(user.id);
          const { data: reloadedChallenges } = await externalClient
            .from("challenges")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });
          setChallenges(reloadedChallenges || []);
        } else {
          setChallenges(challengesData);
        }

        // Load focus areas and schedule - get the data directly
        const loadedWeekSchedule = await loadFocusAreas();

        // Load this week's daily logs
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

        const { data: weekLogsData, error: weekLogsError } = await externalClient
          .from("daily_logs")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", startOfWeek.toISOString().split("T")[0])
          .lte("date", endOfWeek.toISOString().split("T")[0]);

        if (weekLogsError) throw weekLogsError;

        const weekLogsMap: Record<string, DailyLog> = {};
        weekLogsData?.forEach((log) => {
          const logDate = new Date(log.date);
          const dayName = DAYS[logDate.getDay() === 0 ? 6 : logDate.getDay() - 1];
          weekLogsMap[dayName] = {
            id: log.id,
            date: log.date,
            situation: log.situation || "",
            morning_insight: log.morning_insight,
            morning_follow_up: Array.isArray(log.morning_follow_up) ? log.morning_follow_up : [],
            midday_insight: log.midday_insight,
            midday_adjustment: log.midday_adjustment || "",
            midday_follow_up: Array.isArray(log.midday_follow_up) ? log.midday_follow_up : [],
            win: log.win || "",
            weakness: log.weakness || "",
            tomorrows_prep: log.tomorrows_prep || "",
            completed_action_items: log.completed_action_items as any,
          };
        });
        setWeeklyLogs(weekLogsMap);
      } catch (error: any) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, authChecked, loadFocusAreas]);

  // Load daily log when selected date changes
  useEffect(() => {
    if (!user || !authChecked) return;

    const loadDailyLog = async () => {
      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const dayName = DAYS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1];
        const daySchedule = weekSchedule[dayName];

        const { data: logData, error: logError } = await externalClient
          .from("daily_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", dateStr)
          .maybeSingle();

        if (logError) throw logError;

        if (logData) {
          const log: DailyLog = {
            id: logData.id,
            date: logData.date,
            situation: logData.situation || "",
            morning_insight: logData.morning_insight,
            morning_follow_up: Array.isArray(logData.morning_follow_up) ? logData.morning_follow_up : [],
            midday_insight: logData.midday_insight,
            midday_adjustment: logData.midday_adjustment || "",
            midday_follow_up: Array.isArray(logData.midday_follow_up) ? logData.midday_follow_up : [],
            win: logData.win || "",
            weakness: logData.weakness || "",
            tomorrows_prep: logData.tomorrows_prep || "",
            completed_action_items: logData.completed_action_items as any,
          };
          setDailyLog(log);
          setSituationText(log.situation || "");
          setMiddayAdjustmentText(log.midday_adjustment || "");
          
          // Load completed action items
          const completedItems = (logData.completed_action_items as any) || {};
          setCompletedActionItems({
            morning: (completedItems.morning as number[]) || [],
            midday: (completedItems.midday as number[]) || []
          });
          
          // Set schedule settings for this day
          if (daySchedule) {
            setTodayWorkMode(daySchedule.work_mode);
            setTodayFocusAreas(daySchedule.focus_areas);
          }
          
          // Set phase completion based on log
          setMorningCompleted(!!logData.morning_complete);
          setMiddayCompleted(!!logData.midday_complete);
          setEveningCompleted(!!logData.evening_complete);
        } else {
          // Create new log for this date
          const newLog = {
            date: dateStr,
            situation: "",
            morning_insight: null,
            morning_follow_up: [],
            midday_adjustment: "",
            midday_follow_up: [],
            win: "",
            weakness: "",
            tomorrows_prep: "",
            user_id: user.id,
          };

          const { data: insertedLog, error: insertError } = await dualInsert("daily_logs", [newLog]);

          if (insertError) throw insertError;
          const log = {
            ...(insertedLog?.[0] || newLog),
            morning_follow_up: [],
            midday_follow_up: [],
          };
          setDailyLog(log);
          setSituationText(log.situation || "");
          
          // Reset completed action items for new log
          setCompletedActionItems({ morning: [], midday: [] });
          
          // Set schedule settings for this day
          if (daySchedule) {
            setTodayWorkMode(daySchedule.work_mode);
            setTodayFocusAreas(daySchedule.focus_areas);
          }
          
          // Reset phase completion for new log
          setMorningCompleted(false);
          setMiddayCompleted(false);
          setEveningCompleted(false);
        }
      } catch (error: any) {
        console.error("Error loading daily log:", error);
        toast.error("Failed to load daily log");
      }
    };

    loadDailyLog();
  }, [selectedDate, user, authChecked, weekSchedule]);

  // Refresh schedule data when page becomes visible (e.g., after navigating back from Schedule Manager)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('🔄 Page visible again, reloading schedule data...');
        loadFocusAreas().then((loadedSchedule) => {
          // Update today's schedule settings with fresh data
          const dateStr = selectedDate.toISOString().split("T")[0];
          const dayName = DAYS[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1];
          const daySchedule = loadedSchedule?.[dayName];
          
          if (daySchedule) {
            setTodayWorkMode(daySchedule.work_mode);
            setTodayFocusAreas(daySchedule.focus_areas);
            console.log('✅ Updated today\'s schedule:', { workMode: daySchedule.work_mode, focusAreas: daySchedule.focus_areas });
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, loadFocusAreas, selectedDate]);

  const updateLog = useCallback(
    async (updates: Partial<DailyLog>) => {
      if (!dailyLog) return;

      try {
        // Use externalClient directly to ensure data goes to the right database
        const { error } = await externalClient
          .from("daily_logs")
          .update(updates)
          .eq("id", dailyLog.id);

        if (error) throw error;

        setDailyLog(prev => prev ? { ...prev, ...updates } : null);
      } catch (error: any) {
        console.error("Error updating log:", error);
        toast.error("Failed to save changes");
      }
    },
    [dailyLog],
  );

  const resetMorning = async () => {
    if (!dailyLog?.id) return;
    
    try {
      const { error } = await externalClient
        .from("daily_logs")
        .update({
          morning_complete: false,
          morning_insight: null,
          morning_follow_up: []
        })
        .eq("id", dailyLog.id);
      
      if (error) throw error;
      
      // Refresh the UI
      const { data: refreshed, error: refreshError } = await externalClient
        .from("daily_logs")
        .select("*")
        .eq("id", dailyLog.id)
        .maybeSingle();
      
      if (refreshError) throw refreshError;
      
      if (refreshed) {
        setDailyLog(refreshed as any);
        setMorningCompleted(false);
        setCompletedActionItems({ ...completedActionItems, morning: [] });
      }
      
      toast.success("Morning reset - you can now generate a fresh insight");
    } catch (error: any) {
      console.error("Error resetting morning:", error);
      toast.error(`Failed to reset: ${error.message}`);
    }
  };

  const handleSituationChange = useCallback(
    (value: string) => {
      setSituationText(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        updateLog({ situation: value });
      }, 500);
    },
    [updateLog],
  );

  const handleMiddayAdjustmentChange = useCallback(
    (value: string) => {
      setMiddayAdjustmentText(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        updateLog({ midday_adjustment: value });
      }, 500);
    },
    [updateLog],
  );

  const updateDailySchedule = async (day: string, updates: Partial<DailyLog>) => {
    try {
      const dayLog = weeklyLogs[day];

      // Calculate the date for this day
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      const dayIndex = DAYS.indexOf(day);
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + dayIndex);
      const dateStr = dayDate.toISOString().split("T")[0];

      if (!dayLog || !dayLog.id) {
        // Create new log for this day
        const newLog = {
          date: dateStr,
          situation: "",
          morning_insight: null,
          morning_follow_up: [],
          midday_adjustment: "",
          midday_follow_up: [],
          win: "",
          weakness: "",
          tomorrows_prep: "",
          user_id: user.id,
          ...updates,
        };

        const { data, error } = await dualInsert("daily_logs", [newLog]);

        if (error) throw error;

        setWeeklyLogs({
          ...weeklyLogs,
          [day]: {
            ...(data?.[0] || newLog),
            morning_follow_up: [],
            midday_follow_up: [],
          },
        });
      } else {
        // Update existing log
        const { error } = await dualUpdate("daily_logs", updates, { column: "id", value: dayLog.id });

        if (error) throw error;

        setWeeklyLogs({
          ...weeklyLogs,
          [day]: { ...dayLog, ...updates },
        });
      }

      // If it's today, also update dailyLog
      const todayDayName = new Date().toLocaleString("en-us", { weekday: "long" });
      if (day === todayDayName && dailyLog) {
        setDailyLog({ ...dailyLog, ...updates });
      }
    } catch (error: any) {
      console.error("Error updating daily schedule:", error);
      toast.error("Failed to update schedule");
    }
  };

  const generateDailyInsight = async (phase: "morning" | "midday" = "morning") => {
    setIsGenerating(true);
    try {
      const today = new Date().toLocaleString("en-us", { weekday: "long" });
      
      // 🔄 FETCH FRESH SCHEDULE DATA from database
      console.log('🔄 Fetching fresh schedule data from database...');
      const { data: scheduleData, error: scheduleError } = await externalClient
        .from("schedules")
        .select("*")
        .eq("user_id", user?.id);
      
      if (scheduleError) {
        console.error("❌ Error fetching schedule:", scheduleError);
        toast.error("Failed to load schedule data");
        return;
      }
      
      console.log(`📊 Found ${scheduleData?.length || 0} schedules in external database`);
      
      // Parse today's schedule from fresh data
      const todaySchedule = scheduleData?.find(d => d.day_of_week === today);
      
      if (!todaySchedule) {
        console.warn(`⚠️ No schedule found for ${today}, using defaults`);
      }
      
      // External DB has work_mode as a separate column, NOT in tags
      // Use parseScheduleFromExternalDB to correctly parse the schema
      const parsed = todaySchedule 
        ? parseScheduleFromExternalDB(todaySchedule)
        : { work_mode: 'WFH', focus_areas: [] };
      
      const freshWorkMode = parsed.work_mode;
      const freshEnergyLevel = null; // Energy level not stored in schedules table
      const freshFocusAreas = parsed.focus_areas;
      
      console.log('✅ Fresh schedule loaded from EXTERNAL DB:', { 
        workMode: freshWorkMode, 
        energyLevel: freshEnergyLevel,
        focusAreas: freshFocusAreas,
        description: todaySchedule?.description,
        rawData: todaySchedule
      });
      
      const activeChallenges = challenges
        .filter((c) => c.is_active)
        .map((c) => c.name)
        .join(", ");
      
      const activeWisdomSources = wisdomEntries
        .filter((w) => w.is_active)
        .map((w) => w.name)
        .join(", ");

      const regenerationId = Date.now();
      
      const requestBody: any = {
        phase,
        challenges: activeChallenges || "None",
        wisdomSources: activeWisdomSources || "General wisdom",
        schedule: todaySchedule?.description || "No schedule set",
        workMode: freshWorkMode,
        energyLevel: freshEnergyLevel,
        focusAreas: freshFocusAreas.join(", ") || "None",
        situation: dailyLog?.situation || "None",
        regenerationId, // Force unique generation each time
      };

      if (phase === "midday") {
        requestBody.morningInsight = dailyLog?.morning_insight;
        requestBody.middayReflection = middayAdjustmentText || dailyLog?.midday_adjustment;
      }

      console.log(`🚀 Regeneration #${regenerationId} - Generating ${phase} insight with context:`, requestBody);

      const { data, error } = await supabase.functions.invoke("generate-daily-insight", {
        body: requestBody,
      });

      console.log(`📥 Regeneration #${regenerationId} - Edge function response:`, { 
        hasData: !!data, 
        title: data?.title,
        firstActionItem: data?.actionItems?.[0]?.text?.substring(0, 50)
      });

      if (error) {
        console.error(`❌ Regeneration #${regenerationId} - Edge function error:`, error);
        
        if (error.message?.includes('AI service not configured')) {
          toast.error("AI service not configured. Please contact support.");
        } else if (error.message?.includes('Rate limit')) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.");
        } else if (error.message?.includes('Credits exhausted')) {
          toast.error("AI credits exhausted. Please add credits to your workspace.");
        } else if (error.message?.includes('FunctionsFetchError')) {
          toast.error("Could not connect to AI service. The function may still be deploying.");
        } else {
          toast.error(error.message || "Failed to generate insight");
        }
        return;
      }

      if (!data || Object.keys(data).length === 0) {
        console.error(`❌ Regeneration #${regenerationId} - No data returned from edge function`);
        toast.error("No insight generated. Please try again.");
        return;
      }

      console.log(`✅ Regeneration #${regenerationId} - Insight received successfully:`, { title: data.title });
      
      if (phase === "morning") {
        console.log(`💾 Regeneration #${regenerationId} - Saving morning insight to database...`);
        
        try {
          // Reset completed action items when regenerating morning insight
          const newCompletedItems = { ...completedActionItems, morning: [] };
          setCompletedActionItems(newCompletedItems);
          
          // Use externalClient directly to save to the correct database
          const { error: saveError } = await externalClient
            .from("daily_logs")
            .update({ 
              morning_insight: data, 
              morning_follow_up: [],
              completed_action_items: newCompletedItems
            })
            .eq("id", dailyLog?.id);
          
          if (saveError) throw saveError;
          
          console.log(`✅ Regeneration #${regenerationId} - Saved to database successfully`);
          
          // Force UI refresh by re-fetching from database
          const { data: refreshedLog, error: refreshError } = await externalClient
            .from("daily_logs")
            .select("*")
            .eq("id", dailyLog?.id)
            .maybeSingle();
          
          if (refreshError) {
            console.error(`⚠️ Regeneration #${regenerationId} - Error refreshing log:`, refreshError);
          } else if (refreshedLog) {
            setDailyLog(refreshedLog as any);
            console.log(`🎉 Regeneration #${regenerationId} - UI refreshed with new insight`);
          }
          
        } catch (saveError: any) {
          console.error(`❌ Regeneration #${regenerationId} - Database save error:`, saveError);
          toast.error(`Failed to save insight: ${saveError.message}`);
          return;
        }
      } else {
        console.log(`💾 Regeneration #${regenerationId} - Saving midday insight to database...`);
        
        try {
          // Use externalClient directly to save to the correct database
          const { error: saveError } = await externalClient
            .from("daily_logs")
            .update({ midday_insight: data })
            .eq("id", dailyLog?.id);
          
          if (saveError) throw saveError;
          
          console.log(`✅ Regeneration #${regenerationId} - Midday insight saved successfully`);
          
          // Force UI refresh
          const { data: refreshedLog, error: refreshError } = await externalClient
            .from("daily_logs")
            .select("*")
            .eq("id", dailyLog?.id)
            .maybeSingle();
          
          if (refreshError) {
            console.error(`⚠️ Regeneration #${regenerationId} - Error refreshing log:`, refreshError);
          } else if (refreshedLog) {
            setDailyLog(refreshedLog as any);
            console.log(`🎉 Regeneration #${regenerationId} - UI refreshed with new midday insight`);
          }
          
        } catch (saveError: any) {
          console.error(`❌ Regeneration #${regenerationId} - Database save error:`, saveError);
          toast.error(`Failed to save insight: ${saveError.message}`);
          return;
        }
      }
      
      toast.success(`${phase === "morning" ? "Daily" : "Midday"} insight generated!`);
    } catch (error: any) {
      console.error("❌ Unexpected error:", error);
      toast.error(error.message || "Failed to generate insight");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFollowUp = async (question: string, phase: "morning" | "midday") => {
    setIsGenerating(true);
    
    try {
      // Get current conversation history
      const currentConversation = phase === "morning" 
        ? dailyLog.morning_follow_up || []
        : dailyLog.midday_follow_up || [];
      
      // Get the insight for context
      const insight = phase === "morning" 
        ? dailyLog.morning_insight 
        : dailyLog.midday_insight;
      
      if (!insight) {
        toast.error("No insight available for this phase");
        setIsGenerating(false);
        return;
      }
      
      // Add user message to conversation
      const updatedConversation = [
        ...currentConversation,
        { role: "user" as const, text: question }
      ];
      
      // Update UI immediately with user's question
      const fieldToUpdate = phase === "morning" ? "morning_follow_up" : "midday_follow_up";
      await updateLog({ [fieldToUpdate]: updatedConversation });
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke('chat-with-insight', {
        body: {
          phase,
          question,
          insight,
          conversationHistory: currentConversation,
          userContext: {
            situation: dailyLog.situation,
            challenges: challenges.filter(c => c.is_active).map(c => c.name),
            wisdomSources: wisdomEntries.filter(w => w.is_active).map(w => w.name)
          }
        }
      });
      
      if (error) throw error;
      
      // Add AI response to conversation
      const finalConversation = [
        ...updatedConversation,
        { role: "assistant" as const, text: data.response }
      ];
      
      await updateLog({ [fieldToUpdate]: finalConversation });
      
    } catch (error: any) {
      console.error("Error in follow-up:", error);
      toast.error("Failed to get AI response. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const markPhaseComplete = (phase: "morning" | "midday" | "evening") => {
    if (phase === "morning") setMorningCompleted(true);
    if (phase === "midday") setMiddayCompleted(true);
    if (phase === "evening") setEveningCompleted(true);
    toast.success(`${phase.charAt(0).toUpperCase() + phase.slice(1)} phase complete!`);
  };

  const reopenPhase = (phase: "morning" | "midday" | "evening") => {
    if (phase === "morning") setMorningCompleted(false);
    if (phase === "midday") setMiddayCompleted(false);
    if (phase === "evening") setEveningCompleted(false);
    toast.success(`${phase.charAt(0).toUpperCase() + phase.slice(1)} phase reopened`);
  };

  // Handle checking action items
  const handleCheckActionItem = async (phase: "morning" | "midday", index: number) => {
    const currentChecked = completedActionItems[phase];
    const newChecked = currentChecked.includes(index)
      ? currentChecked.filter(i => i !== index)
      : [...currentChecked, index];
    
    const newCompletedItems = { ...completedActionItems, [phase]: newChecked };
    setCompletedActionItems(newCompletedItems);
    
    // Persist to database
    await updateLog({ completed_action_items: newCompletedItems });
  };

  // Challenge management
  const handleToggleChallenge = async (id: string) => {
    try {
      const challenge = challenges.find((c) => c.id === id);
      if (!challenge) return;

      const { error } = await dualUpdate("challenges", { is_active: !challenge.is_active }, { column: "id", value: id });

      if (error) throw error;

      setChallenges(challenges.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c)));
    } catch (error: any) {
      console.error("Error toggling challenge:", error);
      toast.error("Failed to update challenge");
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    try {
      const { error } = await dualDelete("challenges", { column: "id", value: id });

      if (error) throw error;

      setChallenges(challenges.filter((c) => c.id !== id));
      toast.success("Challenge deleted");
    } catch (error: any) {
      console.error("Error deleting challenge:", error);
      toast.error("Failed to delete challenge");
    }
  };

  const handleAddChallenge = async (name: string, description: string) => {
    if (!user) return;
    try {
      const { data, error } = await dualInsert("challenges", [
        {
          name,
          description,
          is_active: true,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      setChallenges([...challenges, data?.[0]]);
      toast.success("Challenge added");
    } catch (error: any) {
      console.error("Error adding challenge:", error);
      toast.error("Failed to add challenge");
    }
  };

  // Wisdom library management
  const handleToggleWisdom = async (id: string) => {
    try {
      const wisdom = wisdomEntries.find((w) => w.id === id);
      if (!wisdom) return;

      const { error } = await dualUpdate("wisdom_library", { is_active: !wisdom.is_active }, { column: "id", value: id });

      if (error) throw error;

      setWisdomEntries(wisdomEntries.map((w) => (w.id === id ? { ...w, is_active: !w.is_active } : w)));
    } catch (error: any) {
      console.error("Error toggling wisdom:", error);
      toast.error("Failed to update wisdom source");
    }
  };

  const handleAddWisdom = async (name: string, description: string, tag: string) => {
    if (!user) return;
    try {
      const { data, error } = await dualInsert("wisdom_library", [
        {
          name,
          description,
          tag,
          is_active: true,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      setWisdomEntries([...wisdomEntries, data?.[0]]);
      toast.success("Wisdom source added");
    } catch (error: any) {
      console.error("Error adding wisdom:", error);
      toast.error("Failed to add wisdom source");
    }
  };

  const handleDeleteWisdom = async (id: string) => {
    try {
      const { error } = await dualDelete("wisdom_library", { column: "id", value: id });

      if (error) throw error;

      setWisdomEntries(wisdomEntries.filter((w) => w.id !== id));
      toast.success("Wisdom source deleted");
    } catch (error: any) {
      console.error("Error deleting wisdom:", error);
      toast.error("Failed to delete wisdom source");
    }
  };

  const handleResetDay = async () => {
    if (!user || !dailyLog) return;

    const { error } = await dualUpdate("daily_logs",
      {
        situation: null,
        morning_insight: null,
        morning_follow_up: [],
        midday_adjustment: null,
        midday_follow_up: [],
        win: null,
        weakness: null,
        tomorrows_prep: null,
      },
      { column: "id", value: dailyLog.id }
    );

    if (!error) {
      setDailyLog({
        ...dailyLog,
        situation: "",
        morning_insight: null,
        morning_follow_up: [],
        midday_adjustment: "",
        midday_follow_up: [],
        win: "",
        weakness: "",
        tomorrows_prep: "",
      });
      setMorningCompleted(false);
      setMiddayCompleted(false);
      setEveningCompleted(false);
      toast.success("Day reset");
    }
  };

  const handleWinChange = async (value: string) => {
    await updateLog({ win: value });
  };

  const handleWeaknessChange = async (value: string) => {
    await updateLog({ weakness: value });
  };

  const handleTomorrowsPrepChange = async (value: string) => {
    await updateLog({ tomorrows_prep: value });
  };

  const renderMorningDetails = () => {
    if (!dailyLog?.morning_insight) return null;
    const quote = getQuoteDisplay(dailyLog.morning_insight.quote);
    
    return (
      <div className="space-y-4">
        {quote && (
          <div className="bg-background/50 rounded-lg p-4 border-l-4 border-primary">
            <p className="text-sm italic">"{quote.text}"</p>
            {quote.author && (
              <p className="text-xs text-muted-foreground mt-2">— {quote.author}</p>
            )}
          </div>
        )}
        {dailyLog.morning_insight.analysis && (
          <div className="bg-background/50 rounded-lg p-4">
            <h4 className="font-bold text-sm uppercase tracking-wide mb-2">Analysis</h4>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{dailyLog.morning_insight.analysis}</p>
          </div>
        )}
        {dailyLog.morning_insight.mantra && (
          <div className="bg-background/50 rounded-lg p-4">
            <h4 className="font-bold text-sm uppercase tracking-wide mb-2">Your Mantra</h4>
            <p className="text-sm font-bold">{dailyLog.morning_insight.mantra}</p>
          </div>
        )}
        {dailyLog.morning_follow_up && dailyLog.morning_follow_up.length > 0 && (
          <div className="bg-background/50 rounded-lg p-4">
            <h4 className="font-bold text-sm uppercase tracking-wide mb-3">Follow-up Conversation</h4>
            <div className="space-y-3">
              {dailyLog.morning_follow_up.map((msg: any, idx: number) => (
                <div key={idx} className={`p-3 rounded ${msg.role === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-1">
                    {msg.role === 'user' ? 'You' : 'Coach'}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMorningQuickRef = () => {
    if (!dailyLog?.morning_insight || !morningCompleted) return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t shadow-lg p-4 z-50">
        <div className="max-w-4xl mx-auto">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="font-bold text-lg">📋 Today's Action Plan</span>
              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4 pt-4 border-t">
              <MorningQuickReference
                insight={dailyLog.morning_insight}
                checkedItems={completedActionItems.morning}
                onCheckItem={(index) => handleCheckActionItem("morning", index)}
              />
            </div>
          </details>
        </div>
      </div>
    );
  };

  const renderPhase = () => {
    if (!dailyLog) return null;

    const hour = new Date().getHours();
    const dayComplete = morningCompleted && middayCompleted && eveningCompleted;

    return (
      <DayTimeline>
        {/* MORNING PHASE */}
        {!morningCompleted ? (
          <ActivePhaseCard 
            phase="morning" 
            title="Morning Briefing" 
            icon={<Sunrise className="h-6 w-6" />}
          >
            {dailyLog.morning_insight ? (
              <div className="space-y-4">
                <InsightCard insight={dailyLog.morning_insight} />
                <FollowUpChat
                  conversation={dailyLog.morning_follow_up || []}
                  onFollowUp={(q) => handleFollowUp(q, "morning")}
                  isLoading={isGenerating}
                />
                <Button onClick={() => markPhaseComplete("morning")} className="w-full" size="lg">
                  Mark Complete
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="situation"
                    className="block text-sm font-black text-foreground mb-2 uppercase tracking-wider"
                  >
                    Situation (Optional)
                  </label>
                  <Textarea
                    id="situation"
                    rows={3}
                    placeholder="DESCRIBE THE SPECIFIC ISSUE..."
                    value={situationText}
                    onChange={(e) => handleSituationChange(e.target.value)}
                  />
                </div>

                <div className="p-4 bg-card border border-border rounded-lg space-y-3">
                  <h3 className="text-base font-black uppercase tracking-wider">Today's Setup</h3>

                  <div>
                    <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-wider">
                      Work Mode
                    </label>
                    <select
                      value={todayWorkMode}
                      onChange={(e) => setTodayWorkMode(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded bg-background text-foreground font-bold"
                    >
                      {WORK_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-wider">
                      Energy Level
                    </label>
                    <select
                      value={todayEnergyLevel}
                      onChange={(e) => setTodayEnergyLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded bg-background text-foreground font-bold"
                    >
                      {ENERGY_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-wider">
                      Focus Areas
                    </label>
                    <div className="space-y-2">
                      {availableFocusAreas.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {availableFocusAreas.map((area) => {
                            const isSelected = todayFocusAreas.includes(area);
                            return (
                              <button
                                key={area}
                                onClick={() => {
                                  const updated = isSelected 
                                    ? todayFocusAreas.filter((a) => a !== area) 
                                    : [...todayFocusAreas, area];
                                  setTodayFocusAreas(updated);
                                }}
                                className={`px-3 py-1 border rounded font-bold text-sm transition-all ${
                                  isSelected
                                    ? "bg-primary text-background border-primary"
                                    : "bg-background text-foreground border-border hover:bg-foreground hover:text-background"
                                }`}
                              >
                                {area}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add custom focus area..."
                          className="flex-1 px-3 py-2 border border-border rounded bg-background text-foreground font-bold"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.currentTarget.value.trim()) {
                              const newArea = e.currentTarget.value.trim();
                              if (!todayFocusAreas.includes(newArea)) {
                                setTodayFocusAreas([...todayFocusAreas, newArea]);
                              }
                              e.currentTarget.value = "";
                            }
                          }}
                        />
                      </div>

                      {todayFocusAreas.filter((area) => !availableFocusAreas.includes(area)).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {todayFocusAreas
                            .filter((area) => !availableFocusAreas.includes(area))
                            .map((area) => (
                              <button
                                key={area}
                                onClick={() => {
                                  setTodayFocusAreas(todayFocusAreas.filter((a) => a !== area));
                                }}
                                className="px-3 py-1 border rounded border-primary bg-primary text-background font-bold text-sm hover:bg-destructive hover:border-destructive"
                              >
                                {area} ✕
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => setIsChallengesModalOpen(true)} variant="outline" className="w-full">
                    <Zap className="h-5 w-5 mr-2" />
                    Manage Challenges
                  </Button>
                  <Button onClick={() => setIsLibraryModalOpen(true)} variant="outline" className="w-full">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Wisdom Library
                  </Button>
                </div>

                <Button 
                  onClick={() => generateDailyInsight("morning")} 
                  disabled={isGenerating}
                  size="lg"
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Generating Insight...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-5 w-5 mr-2" />
                      Generate Morning Insight
                    </>
                  )}
                </Button>
              </div>
            )}
          </ActivePhaseCard>
        ) : (
          <CompactPhaseCard
            phase="morning"
            title="Morning Insight Complete"
            icon={<Sunrise className="h-5 w-5 text-orange-500" />}
            onReopen={() => reopenPhase("morning")}
            onRegenerate={() => generateDailyInsight("morning")}
            onReset={resetMorning}
          >
            {renderMorningDetails()}
          </CompactPhaseCard>
        )}

        {/* MIDDAY PHASE */}
        {!morningCompleted ? (
          <LockedPhaseCard 
            title="Midday Check-In" 
            unlockTime="Complete morning first"
            icon={<Sun className="h-4 w-4" />}
          />
        ) : !middayCompleted ? (
          hour < 12 ? (
            <LockedPhaseCard 
              title="Midday Check-In" 
              unlockTime="Unlocks at 12:00 PM"
              icon={<Sun className="h-4 w-4" />}
            />
          ) : (
            <ActivePhaseCard 
              phase="midday" 
              title="Halftime Adjustment" 
              icon={<Sunset className="h-6 w-6" />}
            >
              {dailyLog.midday_insight ? (
                <div className="space-y-4">
                  <InsightCard insight={dailyLog.midday_insight} />
                  <FollowUpChat
                    conversation={dailyLog.midday_follow_up || []}
                    onFollowUp={(q) => handleFollowUp(q, "midday")}
                    isLoading={isGenerating}
                  />
                  <Button onClick={() => markPhaseComplete("midday")} className="w-full" size="lg">
                    Mark Complete
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="midday"
                      className="block text-sm font-black text-foreground mb-2 uppercase tracking-wider"
                    >
                      How's Your Day Going?
                    </label>
                    <Textarea
                      id="midday"
                      rows={3}
                      placeholder="WHAT'S WORKING? WHAT'S NOT?"
                      value={middayAdjustmentText}
                      onChange={(e) => handleMiddayAdjustmentChange(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={() => generateDailyInsight("midday")} 
                    disabled={isGenerating}
                    size="lg"
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                        Generating Adjustment...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="h-5 w-5 mr-2" />
                        Generate Midday Insight
                      </>
                    )}
                  </Button>
                </div>
              )}
            </ActivePhaseCard>
          )
        ) : (
          <CompactPhaseCard
            phase="midday"
            title="Midday Check-In Complete"
            icon={<Sunset className="h-5 w-5 text-yellow-500" />}
            onReopen={() => reopenPhase("midday")}
            onRegenerate={() => generateDailyInsight("midday")}
          >
            <div className="space-y-4">
              {dailyLog.midday_adjustment && (
                <div className="bg-background/50 rounded-lg p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-2">Your Update</h4>
                  <p className="text-sm whitespace-pre-wrap">{dailyLog.midday_adjustment}</p>
                </div>
              )}
              {dailyLog.midday_insight?.analysis && (
                <div className="bg-background/50 rounded-lg p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-2">Midday Analysis</h4>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{dailyLog.midday_insight.analysis}</p>
                </div>
              )}
            </div>
          </CompactPhaseCard>
        )}

        {/* EVENING PHASE */}
        {!middayCompleted ? (
          <LockedPhaseCard 
            title="Evening Reflection" 
            unlockTime="Complete midday first"
            icon={<Moon className="h-4 w-4" />}
          />
        ) : !eveningCompleted ? (
          hour < 17 ? (
            <LockedPhaseCard 
              title="Evening Reflection" 
              unlockTime="Unlocks at 5:00 PM"
              icon={<Moon className="h-4 w-4" />}
            />
          ) : (
            <ActivePhaseCard 
              phase="evening" 
              title="Evening Reflection" 
              icon={<Moon className="h-6 w-6" />}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-wider">
                    Today's Win
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="WHAT WENT WELL TODAY?"
                    value={dailyLog.win || ""}
                    onChange={(e) => handleWinChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-wider">
                    Growth Area
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="WHERE CAN YOU IMPROVE?"
                    value={dailyLog.weakness || ""}
                    onChange={(e) => handleWeaknessChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-foreground mb-2 uppercase tracking-wider">
                    Tomorrow's Prep
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="WHAT WILL MAKE TOMORROW BETTER?"
                    value={dailyLog.tomorrows_prep || ""}
                    onChange={(e) => handleTomorrowsPrepChange(e.target.value)}
                  />
                </div>

                <Button onClick={() => markPhaseComplete("evening")} className="w-full" size="lg">
                  Complete Day
                </Button>
              </div>
            </ActivePhaseCard>
          )
        ) : (
          <CompactPhaseCard
            phase="evening"
            title="Evening Reflection Complete"
            icon={<Moon className="h-5 w-5 text-purple-500" />}
            onReopen={() => reopenPhase("evening")}
          >
            <div className="space-y-4">
              {dailyLog.win && (
                <div className="bg-background/50 rounded-lg p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-2">Today's Win</h4>
                  <p className="text-sm whitespace-pre-wrap">{dailyLog.win}</p>
                </div>
              )}
              {dailyLog.weakness && (
                <div className="bg-background/50 rounded-lg p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-2">Growth Area</h4>
                  <p className="text-sm whitespace-pre-wrap">{dailyLog.weakness}</p>
                </div>
              )}
              {dailyLog.tomorrows_prep && (
                <div className="bg-background/50 rounded-lg p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-2">Tomorrow's Prep</h4>
                  <p className="text-sm whitespace-pre-wrap">{dailyLog.tomorrows_prep}</p>
                </div>
              )}
            </div>
          </CompactPhaseCard>
        )}

        {/* DAY COMPLETE MESSAGE */}
        {dayComplete && (
          <div className="p-8 bg-secondary border border-primary rounded-lg text-center space-y-6">
            <div>
              <BrainCircuit className="mx-auto h-12 w-12 mb-3" />
              <h3 className="text-2xl font-black text-foreground uppercase tracking-wider">Day Won.</h3>
              <p className="text-muted-foreground mt-2 font-bold uppercase text-xs">Recover. Return Tomorrow.</p>
            </div>
          </div>
        )}
      </DayTimeline>
    );
  };

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!dailyLog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Failed to load daily log</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ChallengesModal
        isOpen={isChallengesModalOpen}
        onClose={() => setIsChallengesModalOpen(false)}
        challenges={challenges}
        onToggle={handleToggleChallenge}
        onDelete={handleDeleteChallenge}
        onAdd={handleAddChallenge}
      />
      <WisdomLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        entries={wisdomEntries}
        onToggle={handleToggleWisdom}
        onAdd={handleAddWisdom}
        onDelete={handleDeleteWisdom}
      />

      <div className="min-h-screen bg-background flex flex-col p-4">
        <div className="w-full max-w-7xl mx-auto">
          <header className="mb-6 pb-6 border-b border-border">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1
                  className="text-5xl font-impact leading-none tracking-tight uppercase mb-1"
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
                <p className="text-sm text-muted-foreground">From Chaos to Clarity</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={async () => {
                  await externalClient.auth.signOut();
                  navigate("/auth");
                }}
                className="text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            
            <nav className="bg-muted/50 rounded-lg p-2 flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="h-10 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Sun className="h-4 w-4 mr-2" />
                <span className="text-sm font-bold">Today</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsChallengesModalOpen(true)}
                className="h-10 px-3"
              >
                <Target className="h-4 w-4 mr-2" />
                <span className="text-sm font-bold">Challenges</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsLibraryModalOpen(true)}
                className="h-10 px-3"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                <span className="text-sm font-bold">Library</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/schedule")}
                className="h-10 px-3"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-bold">Schedule</span>
              </Button>
            </nav>
          </header>

          {/* Weekly Progress Tracker */}
          <div className="mb-6">
            <WeeklyTracker 
              weeklyLogs={weeklyLogs}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          <div className="w-full max-w-3xl mx-auto bg-card border border-border rounded-lg p-6 mb-24">
            <div className="space-y-4">{renderPhase()}</div>
          </div>

          {/* Sticky Action Plan Footer */}
          {renderMorningQuickRef()}
        </div>
      </div>
    </>
  );
};

export default Index;
