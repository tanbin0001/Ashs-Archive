export interface DiaryImage {
  id: string;
  url: string;
  caption?: string;
}

export interface DiaryEntry {
  id: string;
  pageNumber: number;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g., "11:42 PM"
  mood?: string;
  images: DiaryImage[];
  loves: number;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorProfile {
  name: string;
  bio: string;
  avatarUrl: string;
  coverQuote: string;
  authorTitle?: string;
  lastWritten?: string;
  totalPublished?: number;
  totalDrafts?: number;
}

export type ViewMode = 'cover' | 'page' | 'archive' | 'memories';

export interface MoodOption {
  id: string;
  label: string;
  bengali: string;
  icon: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'reflective', label: 'Reflective', bengali: 'অন্তর্মুখী', icon: '🕯' },
  { id: 'nostalgic', label: 'Nostalgic', bengali: 'স্মৃতিকাতর', icon: '🍂' },
  { id: 'melancholic', label: 'Melancholic', bengali: 'বিষণ্ণ', icon: '🌧' },
  { id: 'calm', label: 'Calm & Quiet', bengali: 'শান্ত', icon: '☕' },
  { id: 'solitary', label: 'Solitary', bengali: 'নিঃসঙ্গ', icon: '🌙' },
  { id: 'hopeful', label: 'Hopeful', bengali: 'আশাবাদী', icon: '🌿' },
  { id: 'wandering', label: 'Wandering', bengali: 'উদ্বেল', icon: '🌊' },
  { id: 'unspoken', label: 'Unspoken', bengali: 'না-বলা', icon: '💭' },
];
