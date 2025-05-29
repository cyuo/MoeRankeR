import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { validateRequest } from '@/lib/auth';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';

// 导入客户端包装组件
import ClientWrapper from './ClientWrapper';

// 配置动态参数行为
export const dynamicParams = true;
// 禁用路由缓存，确保始终获取最新数据
export const revalidate = 0;

export default async function AdminCharactersServerPage({ 
  searchParams
}: {
  searchParams?: { 
    page?: string; 
    limit?: string; 
    search?: string; 
  }
}) {
  const { user, session } = await validateRequest();
  if (!session) {
    redirect('/u/login?redirectTo=/a/char');
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          管理角色
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          component={Link} 
          href="/a/char/new"
        >
          新建角色
        </Button>
      </Box>
      
      <ClientWrapper />
    </Container>
  );
} 