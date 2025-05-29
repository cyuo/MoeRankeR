import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Link from 'next/link';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import CreateSubsetClientForm from './CreateSubsetClientForm';

export default async function NewSubsetPage() {
  // 验证用户是否已登录
  const { user, session } = await validateRequest();
  if (!session) {
    redirect('/u/login?redirectTo=/a/subsets/new');
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} component={Link} href="/a/subsets" sx={{ mr: 2 }}>
          返回分组列表
        </Button>
        <Typography variant="h4" component="h1">
          创建新分组
        </Typography>
      </Box>
      <CreateSubsetClientForm />
    </Container>
  );
} 