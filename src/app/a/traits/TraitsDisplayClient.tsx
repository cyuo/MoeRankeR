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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { ITrait } from '@/models/Trait';

// 定义API返回的数据结构
interface TraitData extends ITrait {
  _id: string;
}

// 处理萌娘百科链接
function getMoegirlLink(path?: string): { url: string, displayText: string } {
  if (!path) {
    return { url: '', displayText: '' };
  }
  
  // 尝试解码URL，以便显示中文
  let displayText;
  try {
    displayText = decodeURIComponent(path);
  } catch (e) {
    // 如果解码失败，使用原始路径
    displayText = path;
  }
  
  // 构建完整URL
  const url = `https://zh.moegirl.org.cn/${path}`;
  
  return { url, displayText };
}

export default function TraitsDisplayClient() {
  // 仅客户端渲染 - 初始挂载显示加载中状态
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  const searchFieldId = useId();

  // API数据状态
  const [traits, setTraits] = useState<TraitData[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalTraits, setTotalTraits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 搜索和分页状态
  const [searchTermInput, setSearchTermInput] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // 删除对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [traitToDelete, setTraitToDelete] = useState<string | null>(null);
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
      const res = await fetch(`/api/a/traits?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(currentSearch)}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: '获取数据失败' }));
        throw new Error(errorData.message || `API错误 ${res.status}`);
      }
      const data = await res.json();
      setTraits(data.data || []);
      setTotalPages(data.totalPages || 0);
      setPage(data.currentPage || 1);
      setTotalTraits(data.totalTraits || 0);
    } catch (e: any) {
      setError(e.message || '获取数据时发生错误');
      setTraits([]);
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
    router.push(`/a/traits?page=1&search=${encodeURIComponent(searchTermInput)}`);
  };

  const handleChangePage = (event: unknown, newPageValue: number) => {
    router.push(`/a/traits?page=${newPageValue}&search=${encodeURIComponent(activeSearchTerm)}`);
  };

  const handleDelete = async () => { 
    if (!traitToDelete) return;
    const idToDelete = traitToDelete;
    setTraitToDelete(null); 
    setShowDeleteConfirm(false); 
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/a/traits/${idToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // 删除后重新获取当前页数据
        fetchData(page, activeSearchTerm);
      } else {
        const errorData = await res.json();
        setDeleteError(errorData.message || '删除萌属性失败');
      }
    } catch (e: any) {
      setDeleteError(e.message || '发生意外错误');
      console.error("删除错误:", e);
    }
    setDeleteLoading(false);
  };

  const openDeleteConfirm = (id: string) => {
    setTraitToDelete(id);
    setShowDeleteConfirm(true);
    setDeleteError(null); 
  };

  const closeDeleteConfirm = () => {
    setTraitToDelete(null);
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <Paper sx={{ width: '100%', mb: 2, p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>加载萌属性数据...</Typography>
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
    <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
      <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          id={searchFieldId}
          label="搜索萌属性"
          variant="outlined"
          value={searchTermInput}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, mr: 1 }}
          size="small"
        />
        <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
          搜索
        </Button>
      </Box>

      {deleteLoading && <CircularProgress sx={{my: 2}}/>}
      {deleteError && <Alert severity="error" sx={{my: 2}}>{deleteError}</Alert>}
      {totalTraits > 0 && <Typography variant="subtitle1" sx={{mb:1}}>总萌属性数: {totalTraits}</Typography>}

      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="萌属性表格">
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>重要性</TableCell>
              <TableCell>萌娘百科链接</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {traits.map((trait) => (
              <TableRow
                key={trait._id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {trait.name}
                </TableCell>
                <TableCell>{trait.importance}</TableCell>
                <TableCell>
                  {trait.moegirl_link && (() => {
                    const { url, displayText } = getMoegirlLink(trait.moegirl_link);
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title={`访问萌娘百科: ${displayText}`}>
                          <Button 
                            component="a"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            endIcon={<OpenInNewIcon fontSize="small" />}
                            sx={{ textTransform: 'none' }}
                          >
                            {displayText}
                          </Button>
                        </Tooltip>
                      </Box>
                    );
                  })()}
                </TableCell>
                <TableCell align="right">
                  <Button 
                    component={Link} 
                    href={`/a/traits/edit/id?id=${trait._id}`}
                    startIcon={<EditIcon />} 
                    sx={{mr: 1}}
                    variant="outlined"
                    size="small"
                  >
                    编辑
                  </Button>
                  <Button 
                    color="error" 
                    onClick={() => openDeleteConfirm(trait._id)} 
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
            {traits.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>没有找到萌属性</Typography>
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

      <Dialog
        open={showDeleteConfirm}
        onClose={closeDeleteConfirm}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除此萌属性吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} disabled={deleteLoading}>取消</Button>
          <Button onClick={handleDelete} color="error" autoFocus disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={24} /> : '删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
} 