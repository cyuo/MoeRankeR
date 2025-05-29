'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  InputAdornment,
  Paper,
  Chip,
  Grid,
  Avatar,
  Card,
  CardContent,
  CardMedia,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FemaleIcon from '@mui/icons-material/Female';
import MaleIcon from '@mui/icons-material/Male';
import HelpIcon from '@mui/icons-material/Help';

interface SubsetData {
  _id: string;
  slug: string;
  display_name: string;
  characters?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface CharacterData {
  _id: string;
  name: string;
  gender?: number;
  image_url?: string;
}

interface SubsetCharsClientFormProps {
  subset: SubsetData;
}

export default function SubsetCharsClientForm({ subset }: SubsetCharsClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 当前分组的角色数据
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  
  // 搜索角色相关状态
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CharacterData[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // 分页状态
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 加载当前分组的角色
  useEffect(() => {
    loadCharacters();
  }, [subset._id]);
  
  const loadCharacters = async () => {
    setLoadingCharacters(true);
    setError(null);
    
    try {
      // 此处为简化实现，实际需要与后端API对接
      // 假设我们有一个API端点可以获取分组内的角色
      const res = await fetch(`/api/a/subsets/${subset._id}/characters?page=${page}`);
      
      if (!res.ok) {
        throw new Error('加载角色失败');
      }
      
      const data = await res.json();
      setCharacters(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || '加载角色时出错');
      setCharacters([]);
    } finally {
      setLoadingCharacters(false);
    }
  };
  
  // 搜索角色
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setSearchLoading(true);
    setError(null);
    
    try {
      // 假设我们有一个API端点可以搜索角色
      const res = await fetch(`/api/a/char?search=${encodeURIComponent(searchTerm)}&limit=1000`);
      
      if (!res.ok) {
        throw new Error('搜索角色失败');
      }
      
      const data = await res.json();
      
      // 过滤掉已经在分组中的角色
      const filteredResults = (data.data || []).filter((char: CharacterData) => 
        !subset.characters?.includes(char._id)
      );
      
      setSearchResults(filteredResults);
    } catch (err: any) {
      setError(err.message || '搜索角色时出错');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // 添加角色到分组
  const handleAddCharacter = async (characterId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 假设我们有一个API端点可以添加角色到分组
      const res = await fetch(`/api/a/subsets/${subset._id}/characters/${characterId}`, {
        method: 'PUT',
      });
      
      if (!res.ok) {
        throw new Error('添加角色失败');
      }
      
      // 更新成功消息
      setSuccess('角色添加成功');
      
      // 重新加载角色列表
      await loadCharacters();
      
      // 从搜索结果中移除已添加的角色
      setSearchResults(searchResults.filter(char => char._id !== characterId));
    } catch (err: any) {
      setError(err.message || '添加角色时出错');
    } finally {
      setLoading(false);
    }
  };
  
  // 从分组中移除角色
  const handleRemoveCharacter = async (characterId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 假设我们有一个API端点可以从分组中移除角色
      const res = await fetch(`/api/a/subsets/${subset._id}/characters/${characterId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('移除角色失败');
      }
      
      // 更新成功消息
      setSuccess('角色移除成功');
      
      // 重新加载角色列表
      await loadCharacters();
    } catch (err: any) {
      setError(err.message || '移除角色时出错');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理页码变更
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // 渲染性别图标
  const renderGenderIcon = (gender?: number) => {
    switch (gender) {
      case 0: return <MaleIcon color="primary" />;
      case 1: return <FemaleIcon color="secondary" />;
      default: return <HelpIcon color="action" />;
    }
  };
  
  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Typography variant="h6" gutterBottom>
        添加角色到分组
      </Typography>
      
      <Box sx={{ display: 'flex', mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="搜索角色..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mr: 1 }}
        />
        <Button 
          variant="contained" 
          onClick={handleSearch} 
          disabled={searchLoading || !searchTerm.trim()}
        >
          {searchLoading ? <CircularProgress size={24} /> : '搜索'}
        </Button>
      </Box>
      
      {searchResults.length > 0 && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            搜索结果
          </Typography>
          <List>
            {searchResults.map(char => (
              <ListItem key={char._id} divider>
                <Avatar 
                  src={char.image_url} 
                  alt={char.name}
                  sx={{ mr: 2 }}
                >
                  {renderGenderIcon(char.gender)}
                </Avatar>
                <ListItemText 
                  primary={char.name} 
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddCharacter(char._id)}
                    disabled={loading}
                  >
                    添加
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        当前分组角色
      </Typography>
      
      {loadingCharacters ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : characters.length > 0 ? (
        <>
          <Grid container spacing={2}>
            {characters.map(char => (
              <Grid item xs={12} sm={6} md={4} key={char._id}>
                <Card sx={{ display: 'flex', height: '100%' }}>
                  <CardMedia
                    component="img"
                    sx={{ width: 100, objectFit: 'cover' }}
                    image={char.image_url || '/placeholder.png'}
                    alt={char.name}
                  />
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {renderGenderIcon(char.gender)}
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        {char.name}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 'auto' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleRemoveCharacter(char._id)}
                        disabled={loading}
                      >
                        移除
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      ) : (
        <Alert severity="info">
          此分组暂无角色
        </Alert>
      )}
    </Box>
  );
} 