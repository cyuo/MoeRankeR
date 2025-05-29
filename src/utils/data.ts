import { Character } from '@/types/character';

interface CharacterSubset {
  name: string;
  description?: string;
  characters: Character[];
  mappingRatio?: number;
}

interface SubsetData {
  name: string;
  description?: string;
  characters: string[];
}

interface CharacterData {
  name: string;
  original_name?: string;
  source?: string;
  source_type?: 'anime' | 'manga' | 'game' | 'novel' | 'other';
}

interface DataState {
  subsets: Record<string, CharacterSubset>;
  selectedSubsets: string[];
  forceMapping: boolean;
  random: boolean;
  conservative: boolean;
  autoCompute: boolean;
  gender: {
    male: boolean;
    female: boolean;
    unknown: boolean;
  };
  kImage: number;
}

// 加载角色数据
export async function loadCharacterData(): Promise<Record<string, CharacterSubset>> {
  try {
    // 从public/data目录加载数据
    const response = await fetch('/data/subsets.json');
    const subsetsData = await response.json() as Record<string, SubsetData>;

    // 加载角色数据
    const charactersResponse = await fetch('/data/characters.json');
    const charactersData = await charactersResponse.json() as Record<string, CharacterData>;

    // 加载图片映射数据
    const mappingResponse = await fetch('/data/mapping.json');
    const mappingData = await mappingResponse.json() as Record<string, string[]>;

    // 处理数据
    const subsets: Record<string, CharacterSubset> = {};
    
    for (const [key, subset] of Object.entries(subsetsData)) {
      const characters = subset.characters.map((charId: string) => {
        const char = charactersData[charId];
        if (!char) return null;

        return {
          _id: charId,
          name: char.name,
          originalName: char.original_name,
          image: mappingData[charId]?.[0] || '', // 使用第一张图片
          source: char.source,
          sourceType: char.source_type || 'other',
          averageRating: 0,
          totalRatings: 0,
          attributes: { moe: 0, cool: 0, pure: 0, hot: 0 },
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Character;
      }).filter((char): char is Character => char !== null);

      const mappedCharacters = characters.filter(char => char.image);
      const mappingRatio = mappedCharacters.length / characters.length;

      subsets[key] = {
        name: subset.name,
        description: subset.description,
        characters,
        mappingRatio
      };
    }

    return subsets;
  } catch (error) {
    console.error('加载角色数据失败:', error);
    return {};
  }
}

// 保存状态到localStorage
export function saveState(state: DataState): void {
  localStorage.setItem('moeranker_state', JSON.stringify(state));
}

// 从localStorage加载状态
export function loadState(): DataState {
  const defaultState: DataState = {
    subsets: {},
    selectedSubsets: [],
    forceMapping: true,
    random: true,
    conservative: true,
    autoCompute: false,
    gender: {
      male: true,
      female: true,
      unknown: true
    },
    kImage: 1
  };

  try {
    const saved = localStorage.getItem('moeranker_state');
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  } catch {
    return defaultState;
  }
}

// 清除状态
export function clearState(): void {
  localStorage.removeItem('moeranker_state');
}

// 导出状态
export function exportState(): string {
  const state = loadState();
  return JSON.stringify(state);
}

// 导入状态
export function importState(stateJson: string): void {
  try {
    const state = JSON.parse(stateJson);
    saveState(state);
  } catch (error) {
    console.error('导入状态失败:', error);
  }
} 