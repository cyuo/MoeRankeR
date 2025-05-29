'use client';

import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Grid, Box, Button, Stepper, Step, StepLabel } from '@mui/material';
import SubsetSelector from '@/components/SubsetSelector';
import CharacterRater from '@/components/CharacterRater';
import ResultPanel from '@/components/ResultPanel';
import { Character, Subset, Rating, RatingHistoryItem } from '@/types';
import HCaptcha from '@hcaptcha/react-hcaptcha';

// 定义步骤
const steps = ['选择分组', '角色评分', '查看结果'];

export default function Home() {
  const [subsets, setSubsets] = useState<Record<string, Subset>>({});
  const [characters, setCharacters] = useState<Record<string, Character>>({});
  const [mapping, setMapping] = useState<Record<string, string[]>>({});
  const [selectedSubsets, setSelectedSubsets] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [ratingHistory, setRatingHistory] = useState<RatingHistoryItem[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{ trait: string; score: number }>>([]);
  
  // 图片模式和性别筛选
  const [imageOnly, setImageOnly] = useState<boolean>(false);
  const [selectedGenders, setSelectedGenders] = useState<number[]>([0, 1, 2]); // 默认选择所有性别
  
  // 当前步骤状态
  const [activeStep, setActiveStep] = useState<number>(0);

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const [loadingCharacters, setLoadingCharacters] = useState(false);

  // 加载数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 仅加载分组数据，不加载角色数据
        const subsetsData = await fetch('/api/subsets').then(res => res.json());
        setSubsets(subsetsData);
        
        // 从 localStorage 恢复评分数据和评分历史
        const savedRatings = localStorage.getItem('moeranker_ratings');
        const savedHistory = localStorage.getItem('moeranker_history');
        
        if (savedRatings) {
          setRatings(JSON.parse(savedRatings));
        }
        
        if (savedHistory) {
          setRatingHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.error('加载初始数据失败:', error);
      }
    };

    loadInitialData();
  }, []);

  // 只有在 activeStep === 1 时拉角色数据
  useEffect(() => {
    if (activeStep !== 1) return;
    const loadCharacterData = async () => {
      setLoadingCharacters(true);
      if (selectedSubsets.length === 0) {
        setCharacters({});
        setMapping({});
        setLoadingCharacters(false);
        return;
      }
      try {
        let token = captchaToken;
        if (!token && typeof window !== 'undefined') {
          token = localStorage.getItem('moeranker_captcha_token');
        }
        if (!token) {
          setActiveStep(0);
          setCaptchaOpen(true);
          setLoadingCharacters(false);
          return;
        }
        const characterDataPromises = selectedSubsets.map(subsetId =>
          fetch(`/api/subsets/${subsetId}/characters`, {
            headers: { 'X-Captcha-Token': token }
          }).then(res => {
            if (res.status === 400 || res.status === 401) throw new Error('人机验证已失效，请重新验证');
            return res.json();
          })
        );
        const results = await Promise.all(characterDataPromises);
        const mergedCharacters: Record<string, Character> = {};
        const mergedMapping: Record<string, string[]> = {};
        results.forEach(result => {
          Object.entries(result.characters).forEach(([charId, charData]) => {
            if (!mergedCharacters[charId]) {
              mergedCharacters[charId] = charData as Character;
            } else {
              const existingTraits = mergedCharacters[charId].traits || {};
              const newTraits = (charData as Character).traits || {};
              mergedCharacters[charId].traits = { ...existingTraits, ...newTraits };
            }
          });
          Object.entries(result.mapping).forEach(([charId, imageUrls]) => {
            if (!mergedMapping[charId]) {
              mergedMapping[charId] = imageUrls as string[];
            } else {
              const existingUrls = new Set(mergedMapping[charId]);
              (imageUrls as string[]).forEach(url => {
                if (!existingUrls.has(url)) {
                  mergedMapping[charId].push(url);
                }
              });
            }
          });
        });
        setCharacters(mergedCharacters);
        setMapping(mergedMapping);
        setLoadingCharacters(false);
      } catch (error: any) {
        setLoadingCharacters(false);
        if (error.message && error.message.includes('人机验证')) {
          setCaptchaError(error.message);
          setCaptchaToken(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('moeranker_captcha_token');
          }
          setActiveStep(0);
          setCaptchaOpen(true);
        } else {
          console.error('加载角色数据失败:', error);
        }
      }
    };
    loadCharacterData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, selectedSubsets]);

  // 保存评分和评分历史到 localStorage
  useEffect(() => {
    if (Object.keys(ratings).length > 0) {
      localStorage.setItem('moeranker_ratings', JSON.stringify(ratings));
    }
    
    if (ratingHistory.length > 0) {
      localStorage.setItem('moeranker_history', JSON.stringify(ratingHistory));
    }
  }, [ratings, ratingHistory]);

  // 处理子集选择
  const handleSubsetsChange = (newSelectedSubsets: string[]) => {
    setSelectedSubsets(newSelectedSubsets);
    setCurrentCharacter(null);
  };

  // 处理评分
  const handleRate = (characterId: string, score: number) => {
    // 特殊情况：清除所有评分
    if (characterId === '__CLEAR_ALL__' && score === -1) {
      setRatings({});
      setRatingHistory([]);
      localStorage.removeItem('moeranker_ratings');
      localStorage.removeItem('moeranker_history');
      return;
    }
    
    // 添加到评分和评分历史
    const timestamp = Date.now();
    
    setRatings(prev => ({
      ...prev,
      [characterId]: { score, timestamp }
    }));
    
    setRatingHistory(prev => [
      ...prev,
      { characterId, score, timestamp }
    ]);
  };
  
  // 处理跳过
  const handleSkip = (characterId: string) => {
    // 记录跳过到评分历史
    const timestamp = Date.now();
    
    // 添加到评分数据，使用特殊的分数值(-1)来标记跳过的角色
    setRatings(prev => ({
      ...prev,
      [characterId]: { score: -1, timestamp }
    }));
    
    setRatingHistory(prev => [
      ...prev,
      { characterId, score: null, timestamp }
    ]);
  };
  
  // 处理撤回
  const handleRevert = () => {
    // 如果没有评分历史，直接返回
    if (ratingHistory.length === 0) return;
    
    // 获取最后一次评分记录
    const lastRating = ratingHistory[ratingHistory.length - 1];
    
    // 从评分历史中移除最后一条记录
    setRatingHistory(prev => prev.slice(0, prev.length - 1));
    
    // 如果最后一次是评分而不是跳过，还需要从评分中移除
    if (lastRating.score !== null) {
      setRatings(prev => {
        const newRatings = { ...prev };
        delete newRatings[lastRating.characterId];
        return newRatings;
      });
    }
    
    // 设置当前角色为撤回的角色
    setCurrentCharacter(lastRating.characterId);
    };

  // 清除所有评分数据
  const handleClearRatings = () => {
    setRatings({});
    setRatingHistory([]);
    localStorage.removeItem('moeranker_ratings');
    localStorage.removeItem('moeranker_history');
    setCurrentCharacter(null);
    setResults([]);
  };

  // 计算正态分布加权平均值和标准差
  const calculateWeightedNormalDist = (scores: Map<number, number>) => {
    let sum = 0;
    let count = 0;
    
    // 计算加权平均值
    Array.from(scores.entries()).forEach(([score, weight]) => {
      sum += score * weight;
      count += weight;
    });
    const avg = sum / count;
    
    // 计算加权标准差
    let variance = 0;
    Array.from(scores.entries()).forEach(([score, weight]) => {
      const diff = score - avg;
      variance += diff * diff * weight;
    });
    const std = Math.sqrt(variance / count);
    
    return [avg, std];
  };

  // 计算结果，使用原始index.html中的计算逻辑
  const calculateResults = () => {
    console.log("[calculateResults] 开始计算评分结果");
    
    // 自动切换到结果步骤
    setActiveStep(2);
    
    // 过滤出有效评分（排除跳过的角色，即分数为-1的评分）
    const validRatings = Object.entries(ratings)
      .filter(([_, rating]) => rating.score !== -1)
      .reduce((acc, [id, rating]) => {
        acc[id] = rating;
        return acc;
      }, {} as Record<string, Rating>);
    
    console.log(`[calculateResults] 已评分角色数量: ${Object.keys(validRatings).length}`);
    
    // 如果没有评分数据，直接返回
    if (Object.keys(validRatings).length === 0) {
      console.log("[calculateResults] 没有评分数据，无法计算结果");
      setResults([]);
      return;
    }
    
    const startTime = Date.now();
    
    // 统计评分分布
    const scoreDistribution = new Map<number, number>();
    // 统计萌属性出现次数
    const traitCounts = new Map<string, number>();
    
    // 遍历所有评分，统计每个评分值的出现次数和萌属性的出现次数
    Object.entries(validRatings).forEach(([characterId, rating]) => {
      const character = characters[characterId];
      if (!character) return;
      
      // 记录评分分布
      const scoreValue = rating.score;
      scoreDistribution.set(scoreValue, (scoreDistribution.get(scoreValue) || 0) + 1);
      
      // 记录萌属性出现次数
      if (character.traits && Object.keys(character.traits).length > 0) {
        Object.keys(character.traits).forEach(trait => {
          traitCounts.set(trait, (traitCounts.get(trait) || 0) + 1);
        });
      }
    });
    
    // 筛选出现次数大于等于3次的萌属性
    const filteredTraits = Array.from(traitCounts.entries())
      .filter(([_, count]) => count >= 3)
      .map(([trait]) => trait);
    
    console.log(`[calculateResults] 筛选后的萌属性数量: ${filteredTraits.length}`);
    
    // 如果没有满足条件的萌属性，无法计算
    if (filteredTraits.length === 0) {
      console.log("[calculateResults] 没有萌属性满足条件，无法计算");
      setResults([
        { 
          trait: "评分结果", 
          score: 0 
        },
        { 
          trait: "没有足够出现次数的萌属性", 
          score: 0 
        },
        { 
          trait: "需要评分更多角色", 
          score: 0 
        }
      ]);
      return;
    }
    
    // 计算评分的正态分布参数
    const [avg, std] = calculateWeightedNormalDist(scoreDistribution);
    console.log(`[calculateResults] 评分平均值: ${avg.toFixed(2)}, 标准差: ${std.toFixed(2)}`);
    
    // 检查标准差是否为0（所有评分相同）
    if (std === 0) {
      console.log("[calculateResults] 标准差为0，无法计算正态分布。可能所有角色评分相同。");
      setResults([
        { 
          trait: "评分结果", 
          score: 0 
        },
        { 
          trait: "所有角色评分相同", 
          score: 0 
        },
        { 
          trait: `平均分: ${avg.toFixed(1)}`, 
          score: 0 
        }
      ]);
      return;
    }
    
    // 标准化评分函数
    const normalizeScore = (score: number) => (score - avg) / std;
    
    // 为每个萌属性计算统计数据
    const traitStats: Record<string, {
      testCount: number;      // 拥有该萌属性的角色数
      controlCount: number;   // 不拥有该萌属性的角色数
      testSum: number;        // 拥有该萌属性的角色标准化评分之和
      controlSum: number;     // 不拥有该萌属性的角色标准化评分之和
    }> = {};
    
    // 初始化每个萌属性的统计数据
    filteredTraits.forEach(trait => {
      traitStats[trait] = {
        testCount: 0,
        controlCount: 0,
        testSum: 0,
        controlSum: 0
      };
    });
    
    // 为每个角色的评分计算标准化分数，并更新萌属性统计数据
    Object.entries(validRatings).forEach(([characterId, rating]) => {
      const character = characters[characterId];
      if (!character) return;
      
      const normalizedScore = normalizeScore(rating.score);
      
      // 更新每个萌属性的统计数据
      filteredTraits.forEach(trait => {
        const hasTrait = character.traits && character.traits[trait];
        if (hasTrait) {
          traitStats[trait].testCount += 1;
          traitStats[trait].testSum += normalizedScore;
        } else {
          traitStats[trait].controlCount += 1;
          traitStats[trait].controlSum += normalizedScore;
        }
      });
    });
    
    // 计算每个萌属性的最终得分
    const calculatedResults = filteredTraits
      .map(trait => {
        const stats = traitStats[trait];
        
        // 如果任一组为空，无法计算
        if (stats.testCount === 0 || stats.controlCount === 0) {
          console.log(`[calculateResults] 特征 "${trait}" 被跳过: testCount=${stats.testCount}, controlCount=${stats.controlCount}`);
          return null;
        }
        
        // 计算平均分
        const testAvg = stats.testSum / stats.testCount;
        const controlAvg = stats.controlSum / stats.controlCount;
        
        // 计算差异
        const delta = testAvg - controlAvg;
        
        // 计算样本数因子（原始公式的countFactor）
        const n = stats.testCount;
        const m = stats.controlCount;
        const countFactor = Math.min(1.8, Math.max(0, Math.log((n * m) / (n + m) / 2 + 1) - 0.7));
        
        // 最终得分
        const finalScore = delta * countFactor * 10;
        
        console.log(`[calculateResults] 特征 "${trait}": testCount=${stats.testCount}, controlCount=${stats.controlCount}, testAvg=${testAvg.toFixed(2)}, controlAvg=${controlAvg.toFixed(2)}, delta=${delta.toFixed(2)}, countFactor=${countFactor.toFixed(2)}, finalScore=${finalScore.toFixed(2)}`);
        
        return {
          trait,
          score: finalScore,
          testAvg,
          testCount: stats.testCount,
          controlAvg,
          controlCount: stats.controlCount,
          delta,
          countFactor
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
    
    // 过滤掉分数接近0的结果 - 降低阈值，使结果更容易出现
    const significantResults = calculatedResults
      .filter(result => Math.abs(result.score) >= 0.01) // 降低阈值从0.05到0.01
      .map(({ trait, score }) => ({ trait, score }))
      .sort((a, b) => b.score - a.score); // 按照实际值而非绝对值排序
    
    console.log(`[calculateResults] 有效结果数量: ${calculatedResults.length}, 筛选后结果数量: ${significantResults.length}`);
    
    // 如果没有显著结果但有计算结果，添加一些通用信息
    if (significantResults.length === 0 && calculatedResults.length > 0) {
      console.log("[calculateResults] 没有显著结果，但有计算结果，添加通用结果信息");
      setResults([
        { 
          trait: "评分结果", 
          score: 0 
        },
        { 
          trait: "所有萌属性得分差异较小", 
          score: 0 
        },
        { 
          trait: `评分数据可能不足或者评分过于统一`, 
          score: 0 
        },
        { 
          trait: `尝试评分更多角色或使用更多不同分数`, 
          score: 0 
        }
      ]);
      return;
    }
    
    setResults(significantResults);
    
    console.log(`[calculateResults] 计算完成，共${significantResults.length}个有效结果，耗时${Date.now() - startTime}ms`);
  };

  // 处理步骤导航
  const handleNext = () => {
    if (activeStep === 0) {
      if (selectedSubsets.length === 0) {
        alert('请至少选择一个分组');
        return;
      }
      // 检查localStorage有无token，无则弹窗，有则直接进入评分
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('moeranker_captcha_token');
        if (!token) {
          setCaptchaOpen(true);
          return;
        }
        setCaptchaToken(token);
      }
      setActiveStep(1);
      return;
    }
    if (activeStep === 1) {
      calculateResults();
    } else {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  // hCaptcha 验证通过
  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setCaptchaOpen(false);
    setCaptchaError(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('moeranker_captcha_token', token);
    }
    setActiveStep(1);
  };

  // hCaptcha 失败/过期
  const handleCaptchaError = (err: any) => {
    setCaptchaError('人机验证失败，请重试');
    setCaptchaToken(null);
    setCaptchaOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('moeranker_captcha_token');
    }
  };

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <SubsetSelector
            subsets={subsets}
            selectedSubsets={selectedSubsets}
            onSubsetsChange={handleSubsetsChange}
            imageOnly={imageOnly}
            setImageOnly={setImageOnly}
            selectedGenders={selectedGenders}
            setSelectedGenders={setSelectedGenders}
            characters={characters}
            mapping={mapping}
          />
        );
      case 1:
        return (
          <CharacterRater
            characters={characters}
            mapping={mapping}
            selectedSubsets={selectedSubsets}
            subsets={subsets}
            onRate={handleRate}
            onSkip={handleSkip}
            onRevert={handleRevert}
            ratings={ratings}
            ratingHistory={ratingHistory}
            currentCharacter={currentCharacter}
            setCurrentCharacter={setCurrentCharacter}
            imageOnly={imageOnly}
            selectedGenders={selectedGenders}
            loading={loadingCharacters}
          />
        );
      case 2:
        return (
          <ResultPanel
            results={results}
            onCalculate={calculateResults}
            ratings={ratings}
          />
        );
      default:
        return <div>未知步骤</div>;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100%', 
      pt: 4, 
      pb: 8,
      bgcolor: 'background.default' 
    }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}
        >
          MoeRanker
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          
          {renderStepContent()}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0}
            >
              上一步
            </Button>
            
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                下一步
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => setActiveStep(0)}
              >
                重新开始
              </Button>
            )}
          </Box>
        </Paper>
        {/* hCaptcha 弹窗 */}
        {captchaOpen && (
          <Box sx={{ position: 'fixed', zIndex: 2000, left: 0, top: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ bgcolor: '#fff', p: 4, borderRadius: 2, boxShadow: 3, minWidth: 320 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>请完成人机验证</Typography>
              {captchaError && <Typography color="error" sx={{ mb: 2 }}>{captchaError}</Typography>}
              <HCaptcha
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001'}
                onVerify={handleCaptchaVerify}
                onError={() => handleCaptchaError('error')}
                onExpire={() => handleCaptchaError('expired')}
              />
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
} 