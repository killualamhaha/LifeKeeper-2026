import { NavSection } from './types';
import { LayoutDashboard, Target, BookOpen, LineChart, Gift, Lock } from 'lucide-react';

export const COLORS = {
  macaron: {
    // Luminary Palette: High-vibrational, healing colors
    // Pink -> Rose (Compassion)
    pink: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', hover: 'hover:bg-rose-100' },
    // Blue -> Violet (Spirituality/Wisdom)
    blue: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', hover: 'hover:bg-violet-100' },
    // Green -> Emerald (Deep Healing)
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', hover: 'hover:bg-emerald-100' },
    // Purple -> Indigo/Iris (Intuition)
    purple: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', hover: 'hover:bg-indigo-100' },
    // Yellow -> Amber/Gold (Illumination/Abundance)
    yellow: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', hover: 'hover:bg-amber-100' },
  }
};

export const NAV_ITEMS = [
  { id: NavSection.TIMETABLE, label: 'Daily Rhythm', icon: LayoutDashboard, color: COLORS.macaron.blue },
  { id: NavSection.TARGETS, label: '2026 Targets', icon: Target, color: COLORS.macaron.pink },
  { id: NavSection.FINANCE_INSIGHTS, label: 'Fin. Insights', icon: BookOpen, color: COLORS.macaron.purple },
  { id: NavSection.MONEY_FLOW, label: 'Money Flow', icon: LineChart, color: COLORS.macaron.green },
  { id: NavSection.WISHLIST, label: 'Wishlist', icon: Gift, color: COLORS.macaron.yellow },
  { id: NavSection.BLUEPRINT, label: 'My Blueprint', icon: Lock, color: COLORS.macaron.blue }, 
];