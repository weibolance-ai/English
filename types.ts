export enum ExerciseMode {
  SYNTAX = 'SYNTAX', // Logic & Hypotaxis
  LEXICON = 'LEXICON', // Precision & Collocation
  GRAMMAR = 'GRAMMAR', // Prepositions & Articles
  STYLE = 'STYLE', // Voice & Register
}

export type AppView = 'EXERCISE' | 'PROGRESS';

export interface UserState {
  apiKey: string | null;
  level: 'B2' | 'C1' | 'C2';
  topic: string;
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  secondsActive: number;
  goalSeconds: number;
  completed: boolean;
}

export interface UserSettings {
  dailyGoalMinutes: number;
}

export interface VocabularyItem {
  word: string;
  pos: string; // Part of speech
  definition: string; // Short Chinese definition
}

export interface WritingFeedback {
  overallScore: number;
  syntax: {
    score: number;
    comment: string; // Chinese advice on hypotaxis/logic
    examples: string[]; // Specific rewrites
  };
  lexicon: {
    score: number;
    comment: string; // Chinese advice on precision/collocation
    vocabUsageCheck: { word: string; usedCorrectly: boolean; comment?: string }[];
    collocationCorrections: { original: string; betterAlternative: string; reason: string }[];
  };
  grammar: {
    score: number;
    comment: string; // Chinese advice on articles/prepositions
    corrections: { original: string; correction: string; reason: string }[];
  };
  generalAdvice: string; // Encouraging summary
}

export type LoadingState = 'idle' | 'generating_topics' | 'generating_vocab' | 'evaluating' | 'error';