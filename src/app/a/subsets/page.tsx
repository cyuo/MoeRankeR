import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import SubsetsDisplayClient from './SubsetsDisplayClient';

// 在客户端组件包装器中，确保正确地传递客户端搜索参数
function ClientWrapper() {
  return <SubsetsDisplayClient />;
}

export default async function AdminSubsetsServerPage({ 
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
    redirect('/u/login?redirectTo=/a/subsets');
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          管理分组
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          component={Link} 
          href="/a/subsets/new"
        >
          新建分组
        </Button>
      </Box>
      
      <ClientWrapper />
    </Container>
  );
} 