export enum NavSection {
  TIMETABLE = 'timetable',
  TARGETS = 'targets',
  FINANCE_INSIGHTS = 'finance_insights',
  MONEY_FLOW = 'money_flow',
  WISHLIST = 'wishlist',
  BLUEPRINT = 'blueprint'
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  category: 'work' | 'personal' | 'health';
}

export interface MealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

export interface ScheduleEvent {
  id: string;
  time: string;
  activity: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense' | 'donation';
  category: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  type: 'small_joy' | 'long_term';
  completed: boolean;
  cost?: number;
}

export interface BlueprintData {
  content: string;
  lastEdited: number; // timestamp
  editCount: number; // resets yearly
}

export interface TargetData {
  id: string;
  title: string;
  type: 'strategy' | 'reflection' | 'brand';
  content: string;
  date: string;
}

export interface DailyReflection {
  date: string;
  mood: 'happy' | 'neutral' | 'sad' | 'energetic' | 'tired';
  notes: string;
}