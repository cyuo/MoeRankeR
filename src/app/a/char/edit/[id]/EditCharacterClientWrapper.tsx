'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

// 使用动态导入以解决水合问题
const CharacterFormClient = dynamic(
  () => import('../../components/CharacterFormClient'),
  { 
    ssr: false,
    loading: () => (
      <Paper sx={{ width: '100%', mb: 2, p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>正在加载表单组件...</Typography>
      </Paper>
    )
  }
);

interface EditCharacterClientWrapperProps {
  characterId: string;
}

export default function EditCharacterClientWrapper({ characterId }: EditCharacterClientWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Paper sx={{ width: '100%', mb: 2, p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>初始化组件...</Typography>
      </Paper>
    );
  }

  return <CharacterFormClient characterId={characterId} />;
} 