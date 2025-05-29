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

// 强制使用动态渲染，确保路由参数可用
export const dynamicParams = 'force-dynamic' as const;

export default async function AdminTraitsServerPage({ 
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
    redirect('/u/login?redirectTo=/a/traits');
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          管理萌属性
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          component={Link} 
          href="/a/traits/new"
        >
          新建萌属性
        </Button>
      </Box>
      
      <ClientWrapper />
    </Container>
  );
} 