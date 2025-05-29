interface AttributeWeight {
  moe: number;
  cool: number;
  pure: number;
  hot: number;
}

interface RatingResult {
  attribute: string;
  score: number;
  weight: number;
}

const ATTRIBUTE_WEIGHTS: AttributeWeight = {
  moe: 0.8,
  cool: 0.6,
  pure: 0.7,
  hot: 0.5
};

export function calculateRatings(scores: number[]): RatingResult[] {
  if (scores.length < 5) {
    return [];
  }

  // 计算每个属性的得分
  const attributeScores = {
    moe: calculateAttributeScore(scores, 'moe'),
    cool: calculateAttributeScore(scores, 'cool'),
    pure: calculateAttributeScore(scores, 'pure'),
    hot: calculateAttributeScore(scores, 'hot')
  };

  // 转换为结果数组并排序
  const results: RatingResult[] = Object.entries(attributeScores).map(([attribute, score]) => ({
    attribute: getAttributeDisplayName(attribute),
    score,
    weight: ATTRIBUTE_WEIGHTS[attribute as keyof AttributeWeight]
  }));

  return results.sort((a, b) => b.score - a.score);
}

function calculateAttributeScore(scores: number[], attribute: string): number {
  // 这里可以根据不同属性使用不同的计算方法
  const sum = scores.reduce((acc, score) => acc + score, 0);
  const avg = sum / scores.length;
  
  // 添加一些随机波动，模拟更真实的评分
  const randomFactor = 0.9 + Math.random() * 0.2;
  return Math.min(10, Math.max(0, avg * randomFactor));
}

function getAttributeDisplayName(attribute: string): string {
  const displayNames: Record<string, string> = {
    moe: '萌',
    cool: '帅',
    pure: '纯',
    hot: '热'
  };
  return displayNames[attribute] || attribute;
}

// 本地存储相关函数
export function saveScores(scores: number[]): void {
  localStorage.setItem('moeranker_scores', JSON.stringify(scores));
}

export function loadScores(): number[] {
  const saved = localStorage.getItem('moeranker_scores');
  return saved ? JSON.parse(saved) : [];
}

export function clearScores(): void {
  localStorage.removeItem('moeranker_scores');
} 