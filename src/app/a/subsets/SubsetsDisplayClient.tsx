'use client';

import { useState, useEffect, useId, ChangeEvent, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import Link from 'next/link';
import {
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';

import { ISubset } from '@/models/Subset';

// 定义API返回的数据结构
interface SubsetData extends ISubset {
  _id: string;
}

export default function SubsetsDisplayClient() {
  // 仅客户端渲染 - 初始挂载显示加载中状态
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  const searchFieldId = useId();

  // API数据状态
  const [subsets, setSubsets] = useState<SubsetData[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalSubsets, setTotalSubsets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 搜索和分页状态
  const [searchTermInput, setSearchTermInput] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // 删除对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subsetToDelete, setSubsetToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 确保组件挂载完成
  useEffect(() => {
    setMounted(true);
  }, []);

  // 从API获取数据
  const fetchData = async (currentPage: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const limit = 10; // 每页条数
      const res = await fetch(`/api/a/subsets?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(currentSearch)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: '获取数据失败' }));
        throw new Error(errorData.message || `API错误 ${res.status}`);
      }
      const data = await res.json();
      setSubsets(data.data || []);
      setTotalPages(data.totalPages || 0);
      setPage(data.currentPage || 1);
      setTotalSubsets(data.totalSubsets || 0);
    } catch (e: any) {
      setError(e.message || '获取数据时发生错误');
      setSubsets([]);
      setTotalPages(0);
    }
    setLoading(false);
  };

  // 仅在客户端初始加载后获取数据
  useEffect(() => {
    if (mounted && searchParamsObj) {
      const newPage = Number(searchParamsObj.get('page')) || 1;
      const newSearch = searchParamsObj.get('search') || '';
      setPage(newPage);
      setActiveSearchTerm(newSearch);
      setSearchTermInput(newSearch);
      fetchData(newPage, newSearch);
    }
  }, [mounted, searchParamsObj]);

  // 如果组件尚未挂载，不要渲染任何内容
  if (!mounted) {
    return (
      <Paper sx={{ width: '100%', mb: 2, p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>初始化组件...</Typography>
      </Paper>
    );
  }

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTermInput(event.target.value);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/a/subsets?page=1&search=${encodeURIComponent(searchTermInput)}`);
  };

  const handleChangePage = (event: unknown, newPageValue: number) => {
    router.push(`/a/subsets?page=${newPageValue}&search=${encodeURIComponent(activeSearchTerm)}`);
  };

  const handleDelete = async () => { 
    if (!subsetToDelete) return;
    const idToDelete = subsetToDelete;
    setSubsetToDelete(null); 
    setShowDeleteConfirm(false); 
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/a/subsets/${idToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // 删除后重新获取当前页数据
        fetchData(page, activeSearchTerm);
      } else {
        const errorData = await res.json();
        setDeleteError(errorData.message || '删除分组失败');
      }
    } catch (e: any) {
      setDeleteError(e.message || '发生意外错误');
      console.error("删除错误:", e);
    }
    setDeleteLoading(false);
  };

  const openDeleteConfirm = (id: string) => {
    setSubsetToDelete(id);
    setShowDeleteConfirm(true);
    setDeleteError(null); 
  };

  const closeDeleteConfirm = () => {
    setSubsetToDelete(null);
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <Paper sx={{ width: '100%', mb: 2, p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>加载分组数据...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <>
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
      
      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <form onSubmit={handleSearchSubmit}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                id={searchFieldId}
                label="搜索分组"
                variant="outlined"
                size="small"
                fullWidth
                value={searchTermInput}
                onChange={handleSearchChange}
                placeholder="输入分组名称或Slug..."
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                size="medium"
              >
                搜索
              </Button>
            </Box>
          </form>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            共 {totalSubsets} 个分组
            {activeSearchTerm && ` (搜索: "${activeSearchTerm}")`}
          </Typography>
        </Box>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }} size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Slug</TableCell>
                <TableCell>显示名称</TableCell>
                <TableCell>角色数量</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subsets.map((subset) => (
                <TableRow key={subset._id}>
                  <TableCell>
                    <Typography variant="body2">
                      {subset.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {subset.display_name}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={<PersonIcon />} 
                      label={subset.characters?.length || 0} 
                      variant="outlined" 
                      size="small" 
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      component={Link} 
                      href={`/a/subsets/chars/${subset._id}`}
                      sx={{ mr: 1 }}
                      variant="outlined"
                      size="small"
                      color="info"
                    >
                      管理角色
                    </Button>
                    <Button 
                      component={Link} 
                      href={`/a/subsets/edit/${subset._id}`}
                      startIcon={<EditIcon />} 
                      sx={{ mr: 1 }}
                      variant="outlined"
                      size="small"
                    >
                      编辑
                    </Button>
                    <Button 
                      color="error" 
                      onClick={() => openDeleteConfirm(subset._id)} 
                      startIcon={<DeleteIcon />} 
                      variant="outlined"
                      size="small"
                      disabled={deleteLoading}
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {subsets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>没有找到分组</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {totalPages > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handleChangePage} 
              color="primary" 
            />
          </Box>
        )}
      </Paper>

      {/* 删除确认对话框 */}
      <Dialog
        open={showDeleteConfirm}
        onClose={closeDeleteConfirm}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除这个分组吗？此操作将解除所有角色与此分组的关联，但不会删除角色本身。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} color="primary">
            取消
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={24} /> : '删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 