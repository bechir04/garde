import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export const STATS_SECTIONS = ['kpi', 'map', 'govBar', 'causePie', 'brandBar', 'hourBar', 'trendLine'] as const;
export const INSIGHTS_SECTIONS = ['gauge', 'kpi', 'anomalies', 'timeSlots', 'causeLethality', 'weekday', 'monthlyTrend', 'topRoutes', 'heatmap', 'brands', 'recommendations'] as const;

export type StatsSection = typeof STATS_SECTIONS[number];
export type InsightsSection = typeof INSIGHTS_SECTIONS[number];

export interface DisplaySettings {
  stats: Record<StatsSection, boolean>;
  insights: Record<InsightsSection, boolean>;
}

const DEFAULT_SETTINGS: DisplaySettings = {
  stats: { kpi: true, map: true, govBar: true, causePie: true, brandBar: true, hourBar: true, trendLine: true },
  insights: { gauge: true, kpi: true, anomalies: true, timeSlots: true, causeLethality: true, weekday: true, monthlyTrend: true, topRoutes: true, heatmap: true, brands: true, recommendations: true },
};

const STORAGE_KEY = 'display_settings';
const ORDER_KEY = 'stats_order';

interface DisplayContextValue {
  settings: DisplaySettings;
  statsOrder: StatsSection[];
  toggleStats: (section: StatsSection) => void;
  toggleInsights: (section: InsightsSection) => void;
  reorderStats: (order: StatsSection[]) => void;
  resetAll: () => void;
}

const DisplayContext = createContext<DisplayContextValue | null>(null);

export function DisplayProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [statsOrder, setStatsOrder] = useState<StatsSection[]>(() => {
    try {
      const stored = localStorage.getItem(ORDER_KEY);
      if (stored) {
        const parsed: StatsSection[] = JSON.parse(stored);
        // ensure all sections are present (handles new sections added later)
        const missing = STATS_SECTIONS.filter(s => !parsed.includes(s));
        return [...parsed, ...missing];
      }
    } catch { /* ignore */ }
    return [...STATS_SECTIONS];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(statsOrder));
  }, [statsOrder]);

  const toggleStats = (section: StatsSection) =>
    setSettings(prev => ({ ...prev, stats: { ...prev.stats, [section]: !prev.stats[section] } }));

  const toggleInsights = (section: InsightsSection) =>
    setSettings(prev => ({ ...prev, insights: { ...prev.insights, [section]: !prev.insights[section] } }));

  const reorderStats = (order: StatsSection[]) => setStatsOrder(order);

  const resetAll = () => { setSettings(DEFAULT_SETTINGS); setStatsOrder([...STATS_SECTIONS]); };

  return (
    <DisplayContext.Provider value={{ settings, statsOrder, toggleStats, toggleInsights, reorderStats, resetAll }}>
      {children}
    </DisplayContext.Provider>
  );
}

export function useDisplaySettings() {
  const ctx = useContext(DisplayContext);
  if (!ctx) throw new Error('useDisplaySettings must be used within DisplayProvider');
  return ctx;
}

