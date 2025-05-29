export interface Character {
  _id: string;
  name: string;
  originalName?: string;
  description?: string;
  image: string;
  source?: string;
  sourceType?: 'anime' | 'manga' | 'game' | 'novel' | 'other';
  tags?: string[];
  groups?: string[];
  averageRating: number;
  totalRatings: number;
  attributes: {
    moe: number;
    cool: number;
    pure: number;
    hot: number;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterGroup {
  _id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  characters: string[];
  parentGroup?: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
} 