'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Button,
  Divider,
  Switch,
  Paper,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  TableSortLabel,
  IconButton,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { SubsetSelectorProps } from '@/types';

type Order = 'asc' | 'desc';
interface SubsetData {
  id: string;
  displayName: string;
  femaleCount: number;
  withImageCount: number;
  totalCount: number;
}

export default function SubsetSelector({
  subsets,
  selectedSubsets,
  onSubsetsChange,
  imageOnly,
  setImageOnly,
  selectedGenders,
  setSelectedGenders,
  characters,
  mapping,
}: SubsetSelectorProps) {
  const [genderTypes, setGenderTypes] = useState<Record<string, string>>({
    '0': '男性',
    '1': '女性',
    '2': '无性别/未知'
  });

  // 添加搜索和排序状态
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<keyof SubsetData>('displayName');
  const [order, setOrder] = useState<Order>('asc');

  // 加载性别类型数据
  useEffect(() => {
    const loadGenderTypes = async () => {
      try {
        const response = await fetch('/api/gender-types');
        if (response.ok) {
          const data = await response.json();
          setGenderTypes(data);
        }
      } catch (error) {
        console.error('加载性别类型数据失败:', error);
      }
    };
    
    loadGenderTypes();
  }, []);

  // 计算统计信息
  const getSubsetStats = (subsetId: string) => {
    const subset = subsets[subsetId];
    if (!subset) return { femaleCount: 0, withImageCount: 0, totalCount: 0 };

    // 使用分组对象中存储的计数信息
    return { 
      femaleCount: subset.femaleCount || 0, 
      withImageCount: subset.withImageCount || 0, 
      totalCount: subset.characters.length || 0 
    };
  };

  // 处理排序
  const handleRequestSort = (property: keyof SubsetData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // 排序函数
  const sortData = (data: SubsetData[]) => {
    return data.sort((a, b) => {
      const isAsc = order === 'asc';
      switch (orderBy) {
        case 'displayName':
          return isAsc
            ? a.displayName.localeCompare(b.displayName)
            : b.displayName.localeCompare(a.displayName);
        case 'femaleCount':
        case 'withImageCount':
        case 'totalCount':
          return isAsc
            ? a[orderBy] - b[orderBy]
            : b[orderBy] - a[orderBy];
        default:
          return 0;
      }
    });
  };

  // 准备表格数据
  const prepareTableData = (): SubsetData[] => {
    return Object.entries(subsets)
      .map(([id, subset]) => {
        const stats = getSubsetStats(id);
        return {
          id,
          displayName: subset.displayName || id,
          ...stats,
        };
      })
      .filter(row => 
        row.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  const handleSubsetToggle = (subsetId: string) => {
    if (selectedSubsets.includes(subsetId)) {
      onSubsetsChange(selectedSubsets.filter(id => id !== subsetId));
    } else {
      onSubsetsChange([...selectedSubsets, subsetId]);
    }
  };

  const handleSelectAll = () => {
    onSubsetsChange(Object.keys(subsets));
  };

  const handleClearAll = () => {
    onSubsetsChange([]);
  };
  
  const handleImageOnlyToggle = () => {
    setImageOnly(!imageOnly);
  };
  
  const handleGenderToggle = (gender: number) => {
    if (selectedGenders.includes(gender)) {
      setSelectedGenders(selectedGenders.filter(g => g !== gender));
    } else {
      setSelectedGenders([...selectedGenders, gender]);
    }
  };
  
  const getGenderColor = (gender: number) => {
    switch(gender) {
      case 0: return 'primary'; // 男性 - 蓝色
      case 1: return 'secondary'; // 女性 - 粉色
      case 2: return 'warning'; // 未知 - 黄色
      default: return 'default';
    }
  };

  return (
    <Box sx={{ 
      bgcolor: 'background.paper',
      borderRadius: 1,
      p: 2,
      boxShadow: 1
    }}>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          fontSize: '1.1rem', 
          mb: 3,
          fontWeight: 500,
          color: 'primary.main'
        }}
      >
        选择分组
      </Typography>
      
      <Box sx={{ pl: 1 }}>
        {/* 搜索框 */}
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="搜索分组..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ 
            mb: 3,
            '& .MuiInputBase-input': {
              fontSize: '0.875rem',
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
              </InputAdornment>
            ),
          }}
        />
        
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontSize: '0.9rem',
            mb: 2,
            fontWeight: 500,
            color: 'text.secondary'
          }}
        >
          筛选选项
        </Typography>
        
        <Box sx={{ 
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={imageOnly}
                onChange={handleImageOnlyToggle}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography sx={{ 
                fontSize: '0.875rem',
                color: 'text.primary'
              }}>
                仅评分有图片的角色
              </Typography>
            }
          />
        
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ 
              flexWrap: 'wrap',
              gap: 0.5
            }}
          >
            {Object.entries(genderTypes).map(([gender, label]) => {
              const genderNum = parseInt(gender);
              return (
                <Chip
                  key={gender}
                  label={
                    <Typography sx={{ fontSize: '0.875rem' }}>
                      {`${label} ${selectedGenders.includes(genderNum) ? '✓' : ''}`}
                    </Typography>
                  }
                  color={getGenderColor(genderNum)}
                  variant={selectedGenders.includes(genderNum) ? "filled" : "outlined"}
                  onClick={() => handleGenderToggle(genderNum)}
                  sx={{ 
                    borderRadius: '6px',
                    '&:hover': {
                      opacity: 0.9,
                    },
                  }}
                  size="small"
                />
              );
            })}
          </Stack>
        </Box>
        
        {selectedGenders.length === 0 && (
          <Typography 
            variant="caption" 
            color="error" 
            sx={{ 
              display: 'block', 
              mb: 2, 
              fontSize: '0.75rem',
              fontStyle: 'italic'
            }}
          >
            请至少选择一种性别，否则将无法评分任何角色
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />

        <TableContainer 
          component={Paper} 
          sx={{ 
            maxHeight: 440,
            borderRadius: '8px',
            boxShadow: 2,
            '& .MuiTableCell-root': {
              fontSize: '0.875rem',
              py: 1,
            },
            '& .MuiTableCell-head': {
              bgcolor: 'background.default',
              fontWeight: 500,
            },
            '& .MuiTableRow-root:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell 
                  padding="checkbox"
                  sx={{
                    width: '48px',
                    '&.MuiTableCell-head': {
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                    },
                  }}
                >
                  <Checkbox
                    indeterminate={selectedSubsets.length > 0 && selectedSubsets.length < Object.keys(subsets).length}
                    checked={selectedSubsets.length === Object.keys(subsets).length}
                    onChange={(e) => e.target.checked ? handleSelectAll() : handleClearAll()}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ minWidth: '200px' }}>
                  <TableSortLabel
                    active={orderBy === 'displayName'}
                    direction={orderBy === 'displayName' ? order : 'asc'}
                    onClick={() => handleRequestSort('displayName')}
                  >
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      名称
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ width: '100px' }}>
                  <TableSortLabel
                    active={orderBy === 'femaleCount'}
                    direction={orderBy === 'femaleCount' ? order : 'asc'}
                    onClick={() => handleRequestSort('femaleCount')}
                  >
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      女性角色
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ width: '100px' }}>
                  <TableSortLabel
                    active={orderBy === 'withImageCount'}
                    direction={orderBy === 'withImageCount' ? order : 'asc'}
                    onClick={() => handleRequestSort('withImageCount')}
                  >
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      有图片
                    </Typography>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ width: '100px' }}>
                  <TableSortLabel
                    active={orderBy === 'totalCount'}
                    direction={orderBy === 'totalCount' ? order : 'asc'}
                    onClick={() => handleRequestSort('totalCount')}
                  >
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      总数
                    </Typography>
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortData(prepareTableData()).map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  selected={selectedSubsets.includes(row.id)}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedSubsets.includes(row.id)}
                      onChange={() => handleSubsetToggle(row.id)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.875rem' }}>
                      {row.displayName}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontSize: '0.875rem' }}>
                      {row.femaleCount}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontSize: '0.875rem' }}>
                      {row.withImageCount}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontSize: '0.875rem' }}>
                      {row.totalCount}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
} 