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
  Avatar,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import HelpIcon from '@mui/icons-material/Help';

import { ICharacter } from '@/models/Character';

// 为API返回的数据定义接口
interface CharacterData extends ICharacter {
  _id: string;
}

export default function CharactersDisplayClient() {
  // 仅客户端渲染 - 初始挂载显示加载中状态
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  const searchFieldId = useId();

  // API数据状态
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 搜索和分页状态
  const [searchTermInput, setSearchTermInput] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // 删除对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 确保组件挂载完成
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取性别图标
  const getGenderIcon = (gender?: number) => {
    switch(gender) {
      case 0: return <MaleIcon color="primary" />;
      case 1: return <FemaleIcon color="secondary" />;
      default: return <HelpIcon color="action" />;
    }
  };

  // 获取性别文本
  const getGenderText = (gender?: number) => {
    switch(gender) {
      case 0: return '男性';
      case 1: return '女性';
      default: return '未知';
    }
  };

  // 从API获取数据
  const fetchData = async (currentPage: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const limit = 10; // 每页条数
      const res = await fetch(`/api/a/char?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(currentSearch)}`, {
        credentials: 'include', // 确保发送cookies以进行身份验证
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: '获取数据失败' }));
        throw new Error(errorData.message || `API错误 ${res.status}`);
      }
      const data = await res.json();
      setCharacters(data.data || []);
      setTotalPages(data.totalPages || 0);
      setPage(data.currentPage || 1);
      setTotalCharacters(data.totalCharacters || 0);
    } catch (e: any) {
      setError(e.message || '获取数据时发生错误');
      setCharacters([]);
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
    router.push(`/a/char?page=1&search=${encodeURIComponent(searchTermInput)}`);
  };

  const handleChangePage = (event: unknown, newPageValue: number) => {
    router.push(`/a/char?page=${newPageValue}&search=${encodeURIComponent(activeSearchTerm)}`);
  };

  const handleDelete = async () => { 
    if (!characterToDelete) return;
    const idToDelete = characterToDelete;
    setCharacterToDelete(null); 
    setShowDeleteConfirm(false); 
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/a/char/${idToDelete}`, {
        method: 'DELETE',
        credentials: 'include', // 确保发送cookies以进行身份验证
      });
      if (res.ok) {
        // 删除后重新获取当前页数据
        fetchData(page, activeSearchTerm);
      } else {
        const errorData = await res.json();
        setDeleteError(errorData.message || '删除角色失败');
      }
    } catch (e: any) {
      setDeleteError(e.message || '发生意外错误');
      console.error("删除错误:", e);
    }
    setDeleteLoading(false);
  };

  const openDeleteConfirm = (id: string) => {
    setCharacterToDelete(id);
    setShowDeleteConfirm(true);
    setDeleteError(null); 
  };

  const closeDeleteConfirm = () => {
    setCharacterToDelete(null);
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <Paper sx={{ width: '100%', mb: 2, p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>加载角色数据...</Typography>
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
          label="搜索角色"
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
      {totalCharacters > 0 && <Typography variant="subtitle1" sx={{mb:1}}>总角色数: {totalCharacters}</Typography>}

      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="角色表格">
          <TableHead>
            <TableRow>
              <TableCell>图片</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>性别</TableCell>
              <TableCell>萌属性数量</TableCell>
              <TableCell>Bangumi ID</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {characters.map((character) => (
              <TableRow
                key={character._id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell>
                  <Avatar 
                    src={character.image_url} 
                    alt={character.name}
                    sx={{ width: 50, height: 50 }}
                    variant="rounded"
                  >
                    {character.name.charAt(0)}
                  </Avatar>
                </TableCell>
                <TableCell component="th" scope="row">
                  {character.name}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getGenderIcon(character.gender)}
                    <Typography variant="body2">{getGenderText(character.gender)}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {character.traits?.length || 0}
                </TableCell>
                <TableCell>
                  {character.bangumi_id ? (
                    <Link href={`https://bgm.tv/character/${character.bangumi_id}`} target="_blank" rel="noopener noreferrer">
                      {character.bangumi_id}
                    </Link>
                  ) : '无'}
                </TableCell>
                <TableCell align="right">
                  <Button 
                    component={Link} 
                    href={`/a/char/edit/${character._id}`}
                    startIcon={<EditIcon />} 
                    sx={{mr: 1}}
                    variant="outlined"
                    size="small"
                  >
                    编辑
                  </Button>
                  <Button 
                    color="error" 
                    onClick={() => openDeleteConfirm(character._id)} 
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
            {characters.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>没有找到角色</Typography>
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
            您确定要删除此角色吗？此操作无法撤销。
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