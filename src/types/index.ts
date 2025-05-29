export interface Character {
  id: string;
  name: string;
  traits: Record<string, number>;
  bgm_id?: string;
  gender: number; // 0=男性, 1=女性, 2=未知/无性别
}

export interface Subset {
  characters: string[];
  name: string;
  displayName: string;
  description?: string;
  femaleCount?: number;
  withImageCount?: number;
}

export interface Rating {
  score: number;
  timestamp: number;
}

export interface SubsetSelectorProps {
  subsets: Record<string, Subset>;
  selectedSubsets: string[];
  onSubsetsChange: (subsets: string[]) => void;
  imageOnly: boolean;
  setImageOnly: (value: boolean) => void;
  selectedGenders: number[];
  setSelectedGenders: (genders: number[]) => void;
  characters: Record<string, Character>;
  mapping: Record<string, string[]>;
}

export interface RatingHistoryItem {
  characterId: string;
  score: number | null; // null表示跳过
  timestamp: number;
}

export interface CharacterRaterProps {
  characters: Record<string, Character>;
  mapping: Record<string, string[]>;
  selectedSubsets: string[];
  subsets: Record<string, Subset>;
  onRate: (characterId: string, score: number) => void;
  onSkip: (characterId: string) => void;
  onRevert: () => void;
  ratings: Record<string, Rating>;
  ratingHistory: RatingHistoryItem[];
  currentCharacter: string | null;
  setCurrentCharacter: (characterId: string | null) => void;
  imageOnly: boolean;
  selectedGenders: number[];
}

export interface ResultPanelProps {
  results: Array<{ trait: string; score: number }>;
  onCalculate: () => void;
  ratings: Record<string, Rating>;
} 