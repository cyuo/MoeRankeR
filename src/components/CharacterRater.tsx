'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Slider,
  Button,
  // Card,
  // CardContent,
  // CardMedia,
  // ButtonGroup,
  // Grid,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Stack,
  // Tooltip,
  Link,
  // IconButton,
} from '@mui/material';
import { CharacterRaterProps } from '@/types';
import { styled } from '@mui/material/styles';
import { getTraitMoegirlLink } from '@/utils/linkUtils';

// 评分等级颜色和文字
const RATING_LEVELS = {
  dislike: {
    range: [0, 2],
    color: '#ff6b6b',
    hoverColor: '#ff5252',
    text: '不喜欢'
  },
  neutral: {
    range: [3, 7],
    color: '#ffd93d',
    hoverColor: '#ffc107',
    text: '中立'
  },
  like: {
    range: [8, 10],
    color: '#6bcb77',
    hoverColor: '#4caf50',
    text: '喜欢'
  }
};

// 获取分数对应的评级
const getRatingLevel = (score: number) => {
  if (score >= RATING_LEVELS.like.range[0] && score <= RATING_LEVELS.like.range[1]) {
    return RATING_LEVELS.like;
  } else if (score >= RATING_LEVELS.neutral.range[0] && score <= RATING_LEVELS.neutral.range[1]) {
    return RATING_LEVELS.neutral;
  } else {
    return RATING_LEVELS.dislike;
  }
};

// 获取性别对应的颜色
const getGenderColor = (gender: number) => {
  switch(gender) {
    case 0: return 'primary'; // 男性 - 蓝色
    case 1: return 'secondary'; // 女性 - 粉色
    case 2: return 'warning'; // 未知 - 黄色
    default: return 'default';
  }
};

// 性别名称映射
const GENDER_NAMES: Record<number, string> = {
  0: '男性',
  1: '女性',
  2: '无性别/未知'
};

// 自定义滑块色带样式
const sliderColorStyle = {
  '& .MuiSlider-rail': {
    background: `linear-gradient(90deg, 
      ${RATING_LEVELS.dislike.color} 0%, 
      ${RATING_LEVELS.dislike.color} 20%, 
      ${RATING_LEVELS.neutral.color} 20%, 
      ${RATING_LEVELS.neutral.color} 70%, 
      ${RATING_LEVELS.like.color} 70%, 
      ${RATING_LEVELS.like.color} 100%)`,
    opacity: 0.7,
    height: 8,
  },
  '& .MuiSlider-thumb': {
    width: 24,
    height: 24,
    color: (theme: any) => {
      const score = theme.currentScore || 5; // 从 theme 获取 currentScore
      return getRatingLevel(score).color;
    },
  },
  '& .MuiSlider-track': {
    height: 8,
  },
};

// 自定义评分按钮样式
const RatingButton = styled(Button)<{ score: number }>(({ score }) => {
  const level = getRatingLevel(score);
  return {
    minWidth: '48px',
    height: '48px',
    margin: '4px',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    backgroundColor: level.color,
    color: score <= 2 || score >= 8 ? '#fff' : '#000', // 根据分数调整文字颜色以保证对比度
    border: 'none',
    transition: 'all 0.2s ease-in-out',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: level.hoverColor,
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    '&.Mui-selected': {
      backgroundColor: level.hoverColor,
      color: score <= 2 || score >= 8 ? '#fff' : '#000',
      transform: 'scale(1.1)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
  };
});

// 自定义图片容器样式
const ImageContainer = styled(Box)({
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '16px',
  '& img': {
    maxWidth: '300px',
    maxHeight: '400px',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
});

// 类型定义，用于 getTopTraits 返回的萌属性对象
interface DisplayTrait {
  name: string;
  dbMoegirlLink?: string; // 从数据库获取的 moegirl_link
}

interface CharacterRaterPropsWithLoading extends CharacterRaterProps {
  loading?: boolean;
}

export default function CharacterRater({
  characters,
  mapping,
  selectedSubsets,
  subsets,
  onRate,
  onSkip,
  onRevert,
  ratings,
  ratingHistory,
  currentCharacter,
  setCurrentCharacter,
  imageOnly,
  selectedGenders,
  loading = false,
}: CharacterRaterPropsWithLoading) {
  const [currentScore, setCurrentScore] = useState<number>(5);
  const [isButtonMode, setIsButtonMode] = useState<boolean>(true);
  const [allRated, setAllRated] = useState<boolean>(false);
  const [importanceData, setImportanceData] = useState<Record<string, number>>({});
  const [traitLinks, setTraitLinks] = useState<Record<string, string>>({});
  // const [genderTypes, setGenderTypes] = useState<Record<string, string>>(GENDER_NAMES); // GENDER_NAMES is now a const
  const [isResetting, setIsResetting] = useState<boolean>(false);
  
  const availableCharacters = useMemo(() => {
    const characterSet = new Set<string>();
    if (subsets && characters) {
      selectedSubsets.forEach(subsetId => {
        const subset = subsets[subsetId];
        if (subset && subset.characters) {
          subset.characters.forEach(charId => {
            if (characters[charId]) {
              if (imageOnly) {
                const hasImage = mapping[charId] && mapping[charId].length > 0 && mapping[charId][0] !== '';
                if (!hasImage) {
                  return; 
                }
              }
              
              const gender = characters[charId].gender;
              if (selectedGenders.length > 0 && !selectedGenders.includes(gender)) {
                return; 
              }
              
              characterSet.add(charId);
            } else {
              console.warn(`角色ID "${charId}" (来自子集 "${subsetId}") 在主要角色数据中未找到。`);
            }
          });
        }
      });
    }
    console.log('[CharacterRater] computed availableCharacters:', characterSet.size);
    return Array.from(characterSet);
  }, [selectedSubsets, subsets, characters, mapping, imageOnly, selectedGenders]);

  useEffect(() => {
    console.log('[CharacterRater] selectedSubsets changed:', selectedSubsets);
    setCurrentCharacter(null);
    setAllRated(false);
  }, [selectedSubsets, setCurrentCharacter]);
  
  useEffect(() => {
    if (isResetting && Object.keys(ratings).length === 0) {
      console.log('[CharacterRater] 评分数据已重置，准备开始新一轮评分');
      setIsResetting(false);
      
      if (availableCharacters.length > 0) {
        const nextCharacterId = getNextCharacter();
        console.log('[CharacterRater] 自动选择下一个角色:', nextCharacterId);
        setCurrentCharacter(nextCharacterId);
      }
    }
  }, [ratings, isResetting, availableCharacters, setCurrentCharacter]); // Added setCurrentCharacter to dependency array

  useEffect(() => {
    if (currentCharacter) {
      const stillAvailable = availableCharacters.includes(currentCharacter);
      if (!stillAvailable) {
        console.log('[CharacterRater] 当前角色不再符合筛选条件，选择下一个角色');
        const nextCharacterId = getNextCharacter();
        setCurrentCharacter(nextCharacterId);
      }
    }
  }, [imageOnly, selectedGenders, availableCharacters, currentCharacter, setCurrentCharacter]); // Added setCurrentCharacter

  const getNextCharacter = () => {
    console.log('[CharacterRater] getNextCharacter: availableCharacters', availableCharacters);
    console.log('[CharacterRater] getNextCharacter: ratings', ratings);
    
    const unratedCharacters = availableCharacters.filter(charId => {
      if (!ratings[charId]) {
        return true;
      }
      if (ratings[charId].score === -1) {
        return false;
      }
      return false;
    });
    
    console.log('[CharacterRater] getNextCharacter: unratedCharacters', unratedCharacters);
    
    if (unratedCharacters.length > 0) {
      const randomIndex = Math.floor(Math.random() * unratedCharacters.length);
      const nextCharId = unratedCharacters[randomIndex];
      console.log('[CharacterRater] getNextCharacter: nextCharId', nextCharId);
      return nextCharId;
    }
    
    console.log('[CharacterRater] getNextCharacter: No unrated characters found, returning null.');
    setAllRated(true);
    return null;
  };

  const handleStart = () => {
    console.log('[CharacterRater] handleStart: availableCharacters count', availableCharacters.length);
    if (availableCharacters.length === 0) {
      console.error('[CharacterRater] handleStart: No available characters.');
      return;
    }
    
    localStorage.removeItem('moeranker_ratings');
    onRate('__CLEAR_ALL__', -1); 
    setIsResetting(true);
    setCurrentScore(5);
    setAllRated(false);
    // It's better to select the first character after states are set,
    // so moved it to the useEffect hook for isResetting and ratings.
  };

  const handleRate = (score: number) => {
    if (currentCharacter) {
      onRate(currentCharacter, score);
      const nextCharacter = getNextCharacter();
      setCurrentCharacter(nextCharacter);
      setCurrentScore(5);
    }
  };
  
  const handleSkip = () => {
    if (currentCharacter) {
      onSkip(currentCharacter);
      const nextCharacter = getNextCharacter();
      setCurrentCharacter(nextCharacter);
      setCurrentScore(5);
    }
  };
  
  const handleRevert = () => {
    onRevert();
    setCurrentScore(5);
  };

  const handleSliderChange = (_: Event, value: number | number[]) => {
    setCurrentScore(value as number);
  };

  const handleModeToggle = () => {
    setIsButtonMode(!isButtonMode);
  };

  const getCharacterImage = (characterId: string) => {
    const imageUrls = mapping[characterId] || [];
    if (imageUrls.length > 0 && imageUrls[0] !== '') { // Check if not empty string
      return imageUrls[0];
    }
    return null;
  };
  
  const getCharacterBgmLink = (characterId: string) => {
    // Assuming bgm_id is directly in mapping or character object.
    // If mapping[characterId] is supposed to be BGM ID array:
    const bgmIds = mapping[characterId]; // Or however BGM ID is stored
    if (bgmIds && bgmIds.length > 0 && characters[characterId]?.bgm_id) { // Check if bgm_id exists
        // Construct link using the bgm_id from the character object
        return `https://bgm.tv/character/${characters[characterId].bgm_id}`;
    }
    return null;
  };
  
  // 获取角色的重要萌属性（最多5个）
  const getTopTraits = (characterId: string, maxCount: number = 5): DisplayTrait[] => {
    const character = characters[characterId];
    // character.traits 的结构现在是: { [traitName: string]: { score: number; moegirl_link?: string } }
    if (!character || !character.traits || Object.keys(character.traits).length === 0) {
      return [];
    }
    
    return Object.entries(character.traits)
      .map(([traitName, traitData]) => ({
        name: traitName,
        // @ts-ignore // traitData 的类型可能需要更精确的定义，暂时忽略
        dbMoegirlLink: traitData.moegirl_link, 
        // @ts-ignore
        importance: importanceData[traitName] || 0 
      }))
      // @ts-ignore
      .sort((a, b) => b.importance - a.importance)
      .slice(0, maxCount)
      .map(item => ({ name: item.name, dbMoegirlLink: item.dbMoegirlLink })); // 只返回名称和 dbMoegirlLink
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 6 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>正在加载角色数据…</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
          <span className="MuiCircularProgress-root MuiCircularProgress-colorPrimary" style={{ width: 48, height: 48 }}>
            <svg className="MuiCircularProgress-svg" viewBox="22 22 44 44">
              <circle className="MuiCircularProgress-circle" cx="44" cy="44" r="20.2" fill="none" strokeWidth="3.6" />
            </svg>
          </span>
        </Box>
      </Box>
    );
  }

  if (allRated && !currentCharacter) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          角色评分
        </Typography>
        <Alert severity="success" sx={{ mb: 2 }}>
          已完成所有角色评分！请点击"计算结果"查看结果，或重新开始评分。
        </Alert>
        <Button
          variant="contained"
          onClick={handleStart}
          sx={{ mb: 2, width: '100%' }}
          disabled={isResetting}
        >
          重新开始评分
        </Button>
      </Box>
    );
  }

  if (!currentCharacter) {
    return (
      <Box>
        <Typography 
          variant="body1" 
          gutterBottom
          sx={{ fontSize: '0.9rem' }}
        >
          {availableCharacters.length > 0 ? (
            selectedSubsets.length > 0 ? (
              `共有 ${availableCharacters.length} 个角色待评分`
            ) : (
              "请先选择要评分的分组"
            )
          ) : (
            imageOnly && selectedSubsets.length > 0 ? "没有找到符合条件的带图片角色" : 
            selectedGenders.length > 0 && selectedSubsets.length > 0 ? "没有找到符合条件的指定性别角色" :
            selectedSubsets.length === 0 ? "请先选择要评分的分组" :
            "没有找到符合条件的角色"
          )}
        </Typography>
        
        {availableCharacters.length > 0 && selectedSubsets.length > 0 && (
          <Button
            variant="contained"
            onClick={handleStart}
            fullWidth
            sx={{ 
              mt: 1,
              textTransform: 'none',
              fontSize: '0.9rem'
            }}
            disabled={isResetting}
          >
            开始评分
          </Button>
        )}
      </Box>
    );
  }

  const character = characters[currentCharacter];
  
  if (!character) {
    console.error(`在渲染前发现角色未定义: ${currentCharacter}`);
    // Attempt to recover by selecting the next character
    const nextCharacterId = getNextCharacter();
    if (nextCharacterId) {
      setCurrentCharacter(nextCharacterId);
    } else {
      // If no next character, might be an issue with data or logic
      setAllRated(true); // Mark as all rated to prevent infinite loops
      setCurrentCharacter(null); 
    }
    return (
      <Box>
        <Typography color="error">
          加载角色 "{currentCharacter}" 时出错。正在尝试下一个...
        </Typography>
      </Box>
    );
  }

  const imageUrl = getCharacterImage(currentCharacter);
  const bgmLink = getCharacterBgmLink(currentCharacter);
  // const topTraits = getTopTraits(currentCharacter); // This is called inside map

  return (
    <Box>
      {currentCharacter && ( // currentCharacter should be valid here due to the check above
        <Stack spacing={3}>
          {imageUrl && (
            <ImageContainer>
              <Link
                href={bgmLink || '#'} // Use bgmLink here
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  cursor: bgmLink ? 'pointer' : 'default',
                  display: 'block',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: bgmLink ? 'scale(1.02)' : 'none',
                  }
                }}
              >
                <img
                  src={imageUrl} // Use imageUrl variable
                  alt={character.name}
                  loading="lazy"
                />
              </Link>
            </ImageContainer>
          )}

          <Typography variant="h5" align="center" sx={{ 
            fontWeight: 'bold',
            color: 'text.primary',
          }}>
            {character.name}
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            justifyContent: 'center',
          }}>
            <Chip
              label={GENDER_NAMES[character.gender] || GENDER_NAMES[2]} // Fallback to unknown gender
              size="medium"
              color={getGenderColor(character.gender)}
              sx={{
                fontWeight: 'bold',
              }}
            />
            {getTopTraits(currentCharacter, 5).map((traitInfo, index) => {
              // traitInfo 现在是 { name: string, dbMoegirlLink?: string }
              const moegirlLink = getTraitMoegirlLink(traitInfo.name, traitInfo.dbMoegirlLink, traitLinks);
              if (moegirlLink) {
                return (
                  <Link
                    key={index}
                    href={moegirlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textDecoration: 'none' }}
                  >
                    <Chip
                      label={traitInfo.name} // 显示萌属性名称
                      size="medium"
                      sx={{
                        backgroundColor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                  </Link>
                );
              } else {
                return (
                  <Chip
                    key={index}
                    label={traitInfo.name} // 显示萌属性名称
                    size="medium"
                    sx={{
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  />
                );
              }
            })}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!isButtonMode}
                  onChange={handleModeToggle}
                  color="primary"
                />
              }
              label={isButtonMode ? "按钮模式" : "滑块模式"}
            />
          </Box>

          <Box>
            {isButtonMode ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                {Array.from({ length: 11 }, (_, i) => (
                  <RatingButton
                    key={i}
                    score={i}
                    onClick={() => handleRate(i)}
                    // Pass currentCharacter's rating to RatingButton if needed for 'Mui-selected'
                    className={ratings[currentCharacter]?.score === i ? 'Mui-selected' : ''}
                    disableRipple
                    disableElevation
                  >
                    {i}
                  </RatingButton>
                ))}
              </Box>
            ) : (
              <Slider
                value={currentScore}
                onChange={handleSliderChange}
                onChangeCommitted={(_, value) => handleRate(value as number)}
                min={0}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
                // Pass currentScore to sx for dynamic thumb color
                sx={{ ...sliderColorStyle, '& .MuiSlider-thumb': { ...sliderColorStyle['& .MuiSlider-thumb'], color: getRatingLevel(currentScore).color} }}
              />
            )}
          </Box>

          <Stack 
            direction="row" 
            spacing={2} 
            justifyContent="center"
          >
            <Button
              variant="outlined"
              onClick={handleSkip}
              sx={{ minWidth: 100 }}
            >
              跳过
            </Button>
            <Button
              variant="outlined"
              onClick={handleRevert}
              disabled={!ratingHistory || ratingHistory.length === 0}
              sx={{ minWidth: 100 }}
            >
              撤销
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}