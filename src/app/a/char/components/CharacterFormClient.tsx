'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  FormHelperText,
  Card,
  CardMedia,
  SelectChangeEvent,
  Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ICharacter } from '@/models/Character';
import { ITrait } from '@/models/Trait';

// 定义表单数据接口
interface CharacterFormData {
  _id?: string;
  name: string;
  gender?: number;
  bangumi_id?: number;
  image_url?: string;
  traits?: string[]; // 存储trait IDs
}

interface CharacterFormProps {
  characterId?: string;
}

export default function CharacterFormClient({ characterId }: CharacterFormProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [traits, setTraits] = useState<{ _id: string, name: string }[]>([]);

  // 表单状态
  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    gender: 0,
    bangumi_id: undefined,
    image_url: '',
    traits: []
  });
  
  // 表单验证错误
  const [errors, setErrors] = useState({
    name: '',
    image_url: '',
    bangumi_id: ''
  });

  // 加载和提交状态
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 萌属性输入状态
  const [traitInput, setTraitInput] = useState('');
  const [traitError, setTraitError] = useState('');
  const [traitLoading, setTraitLoading] = useState(false);
  
  // 萌属性名称缓存
  const [traitNamesCache, setTraitNamesCache] = useState<{[key: string]: string}>({});

  // 确保组件挂载完成
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取萌属性列表
  useEffect(() => {
    if (mounted) {
      fetchTraits();
    }
  }, [mounted]);

  // 如果是编辑模式，获取角色数据
  useEffect(() => {
    if (mounted && characterId) {
      fetchCharacter(characterId);
    }
  }, [mounted, characterId]);

  // 加载缺失的萌属性名称
  const loadMissingTraitNames = async (traitIds: string[]) => {
    if (!traitIds || traitIds.length === 0) return;
    
    // 过滤出未知的萌属性ID
    const missingIds = traitIds.filter(id => {
      // 如果不在traits数组中且未在缓存中
      return !traits.some(t => t._id === id) && !traitNamesCache[id];
    });
    
    if (missingIds.length === 0) return;
    
    console.log('需要获取的萌属性名称:', missingIds);
    const newCache = { ...traitNamesCache };
    
    // 先尝试使用搜索API批量获取
    try {
      // 对于每个缺失的ID，单独获取
      for (const id of missingIds) {
        if (!id || typeof id !== 'string') continue;
        
        try {
          console.log(`正在获取萌属性: ${id}`);
          const res = await fetch(`/api/a/traits/${id}`, {
            credentials: 'include',
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data && data.data && data.data.name) {
              console.log(`获取成功: ${id} => ${data.data.name}`);
              newCache[id] = data.data.name;
            } else {
              console.log(`获取成功但无名称: ${id}`, data);
            }
          } else {
            console.error(`获取失败: ${id}, 状态码: ${res.status}`);
            // 失败时尝试使用ID作为名称的最后部分
            if (id.includes('/')) {
              newCache[id] = id.split('/').pop() || id;
            } else {
              newCache[id] = `属性${id.substring(0, 6)}`;
            }
          }
        } catch (err) {
          console.error(`获取萌属性[${id}]时出错:`, err);
          newCache[id] = `属性${id.substring(0, 6)}`;
        }
      }
      
      setTraitNamesCache(newCache);
    } catch (error) {
      console.error('批量获取萌属性名称失败:', error);
    }
  };

  // 获取萌属性列表
  const fetchTraits = async () => {
    try {
      const res = await fetch('/api/a/traits?limit=100', {
        credentials: 'include', // 确保发送cookies以进行身份验证
      });
      if (!res.ok) {
        throw new Error('获取萌属性失败');
      }
      const data = await res.json();
      setTraits(data.data || []);
    } catch (error) {
      console.error('获取萌属性错误:', error);
    }
  };



  // 获取角色数据
  const fetchCharacter = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/a/char/${id}`, {
        credentials: 'include', // 确保发送cookies以进行身份验证
      });
      if (!res.ok) {
        throw new Error('获取角色数据失败');
      }
      const data = await res.json();
              if (data && data.data) {
          // 提取特性ID
          const traitIds = data.data.traits?.map((t: any) => {
            return typeof t === 'string' ? t : t._id;
          }) || [];
          
          // 设置表单数据
          setFormData({
            ...data.data,
            traits: traitIds
          });
          
          console.log('角色特性IDs:', traitIds);
          
          // 立即加载萌属性名称
          if (traitIds.length > 0) {
            setTimeout(() => {
              loadMissingTraitNames(traitIds);
            }, 0);
          }
        }
    } catch (error: any) {
      setError(error.message || '加载角色数据时出错');
    } finally {
      setLoading(false);
    }
  };

  // 表单字段变更处理
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // 清除对应字段的错误
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // 处理select变更
  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    setFormData({
      ...formData,
      gender: Number(e.target.value)
    });
  };

  // 处理多选变更
  const handleMultiSelectChange = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value;
    const newValue = typeof value === 'string' ? value.split(',') : value;
    
    setFormData({
      ...formData,
      traits: newValue
    });
    
    // 加载缺失的萌属性名称
    loadMissingTraitNames(newValue);
  };

  // 添加萌属性
  const handleAddTrait = async () => {
    if (!traitInput.trim()) return;
    
    setTraitLoading(true);
    setTraitError('');
    
    try {
      // 在服务器上验证萌属性是否存在
      const searchQuery = traitInput.trim();
      const res = await fetch(`/api/a/traits/search?query=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('验证萌属性时出错');
      }
      
      const data = await res.json();
      
      if (data.data && data.data.length > 0) {
        // 查找精确匹配的萌属性
        const exactMatch = data.data.find((t: any) => t.name === searchQuery);
        
        // 如果找到精确匹配则使用，否则使用第一个结果
        const trait = exactMatch || data.data[0];
        
        // 提示用户所选萌属性的名称，避免意外选择
        if (!exactMatch && trait.name !== searchQuery) {
          const confirmAdd = window.confirm(
            `未找到精确匹配的"${searchQuery}"，是否添加"${trait.name}"？`
          );
          
          if (!confirmAdd) {
            setTraitError(`取消添加"${trait.name}"`);
            setTraitLoading(false);
            return;
          }
        }
        
        // 检查是否已经添加了这个萌属性
        if (formData.traits?.includes(trait._id)) {
          setTraitError('此萌属性已添加');
        } else {
          // 添加新的萌属性
          const newTraits = [...(formData.traits || []), trait._id];
          setFormData({
            ...formData,
            traits: newTraits
          });
          
          // 更新缓存
          setTraitNamesCache({
            ...traitNamesCache,
            [trait._id]: trait.name
          });
          
          setTraitInput(''); // 清空输入
        }
      } else {
        setTraitError('未找到此萌属性');
      }
    } catch (error: any) {
      setTraitError(error.message || '添加萌属性时出错');
    } finally {
      setTraitLoading(false);
    }
  };
  
  // 移除萌属性
  const handleRemoveTrait = (traitId: string) => {
    setFormData({
      ...formData,
      traits: formData.traits?.filter(id => id !== traitId) || []
    });
  };

  // 表单提交
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    let formErrors = {
      name: '',
      image_url: '',
      bangumi_id: ''
    };
    
    if (!formData.name.trim()) {
      formErrors.name = '名称不能为空';
    }
    
    if (formData.bangumi_id !== undefined && isNaN(Number(formData.bangumi_id))) {
      formErrors.bangumi_id = 'Bangumi ID必须为数字';
    }
    
    if (Object.values(formErrors).some(error => error)) {
      setErrors(formErrors);
      return;
    }
    
    setSubmitLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const url = characterId 
        ? `/api/a/char/${characterId}` 
        : '/api/a/char';
      
      const method = characterId ? 'PUT' : 'POST';
      
      // 准备发送的数据（不包含已删除的subsets字段）
      const dataToSend = {
        name: formData.name,
        gender: formData.gender,
        bangumi_id: formData.bangumi_id,
        image_url: formData.image_url,
        traits: formData.traits
      };
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '保存角色失败');
      }
      
      const data = await res.json();
      setSuccess(characterId ? '角色更新成功!' : '角色创建成功!');
      
      // 编辑后更新表单数据
      if (characterId) {
        fetchCharacter(characterId);
      } else {
        // 新建后跳转到列表页
        setTimeout(() => {
          router.push('/a/char');
        }, 1500);
      }
    } catch (error: any) {
      setError(error.message || '保存数据时出错');
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // 未挂载时不渲染
  if (!mounted) {
    return (
      <Paper sx={{ width: '100%', mb: 2, p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>加载组件...</Typography>
      </Paper>
    );
  }
  
  // 正在加载数据
  if (loading) {
    return (
      <Paper sx={{ width: '100%', mb: 2, p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>加载角色数据...</Typography>
      </Paper>
    );
  }

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TextField
            required
            fullWidth
            id="name"
            name="name"
            label="角色名称"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="gender-label">性别</InputLabel>
            <Select
              labelId="gender-label"
              id="gender"
              value={formData.gender}
              label="性别"
              onChange={handleSelectChange}
            >
              <MenuItem value={0}>男性</MenuItem>
              <MenuItem value={1}>女性</MenuItem>
              <MenuItem value={2}>未知</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            id="bangumi_id"
            name="bangumi_id"
            label="Bangumi ID"
            type="number"
            value={formData.bangumi_id === undefined ? '' : formData.bangumi_id}
            onChange={handleChange}
            error={!!errors.bangumi_id}
            helperText={errors.bangumi_id || "角色在Bangumi.tv上的ID"}
            margin="normal"
          />
          
          <TextField
            fullWidth
            id="image_url"
            name="image_url"
            label="图片URL"
            value={formData.image_url || ''}
            onChange={handleChange}
            error={!!errors.image_url}
            helperText={errors.image_url}
            margin="normal"
          />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>萌属性</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                              {formData.traits?.map(traitId => {
                if (!traitId) return null;
                
                // 在traits数组中查找当前trait ID对应的trait对象
                const trait = traits.find(t => t._id === traitId);
                
                // 从已加载的特性名称缓存中获取
                const cachedName = traitNamesCache[traitId];
                
                // 显示名称的优先级: 1. traits数组中的名称 2. 缓存的名称 3. ID简短形式
                let displayName = trait?.name || cachedName;
                
                // 如果没有找到名称，显示加载中或ID的简短形式
                if (!displayName) {
                  if (typeof traitId === 'string') {
                    displayName = `属性${traitId.substring(0, 6)}...`;
                  } else {
                    displayName = '未知属性';
                  }
                }
                
                return (
                  <Chip 
                    key={traitId}
                    label={displayName}
                    onDelete={() => handleRemoveTrait(traitId)}
                    color="primary"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                );
              })}
              {formData.traits?.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  尚未添加萌属性
                </Typography>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                id="trait-input"
                label="输入萌属性"
                variant="outlined"
                size="small"
                fullWidth
                value={traitInput}
                onChange={(e) => setTraitInput(e.target.value)}
                error={!!traitError}
                helperText={traitError}
              />
              <Button
                variant="contained"
                onClick={handleAddTrait}
                disabled={!traitInput.trim() || traitLoading}
              >
                {traitLoading ? <CircularProgress size={24} /> : '添加'}
              </Button>
            </Box>
            <FormHelperText>
              输入萌属性名称并点击添加，服务器将验证该属性是否存在
            </FormHelperText>
          </Box>
          
          {/* 分组功能已移除，分组内的角色在分组页面进行管理 */}
        </Grid>
        
        <Grid item xs={12} md={4}>
          {formData.image_url && (
            <Card sx={{ mb: 2 }}>
              <CardMedia
                component="img"
                image={formData.image_url}
                alt={formData.name}
                sx={{ height: 300, objectFit: 'contain' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.png';
                }}
              />
            </Card>
          )}
          
          {formData.bangumi_id && (
            <Button 
              variant="outlined" 
              color="primary"
              fullWidth
              href={`https://bgm.tv/character/${formData.bangumi_id}`}
              target="_blank"
              sx={{ mb: 2 }}
            >
              在Bangumi上查看
            </Button>
          )}
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          component={Link}
          href="/a/char"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
        >
          返回列表
        </Button>
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          disabled={submitLoading}
        >
          {submitLoading ? <CircularProgress size={24} /> : '保存角色'}
        </Button>
      </Box>
    </Paper>
  );
} 