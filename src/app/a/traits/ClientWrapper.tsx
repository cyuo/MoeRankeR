'use client';

import dynamic from 'next/dynamic';
import { Paper, CircularProgress, Typography } from '@mui/material';

// 使用动态导入以解决水合问题
const TraitsDisplayClient = dynamic(
  () => import('./TraitsDisplayClient'),
  { 
    ssr: false,  // 在客户端组件中使用ssr: false是允许的
    loading: () => (
      <Paper sx={{ width: '100%', mb: 2, p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>正在加载客户端组件...</Typography>
      </Paper>
    )
  }
);

export default function ClientWrapper() {
  return <TraitsDisplayClient />;
} 