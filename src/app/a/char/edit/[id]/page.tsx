import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

// 导入客户端组件包装器
import EditCharacterClientWrapper from './EditCharacterClientWrapper';

// 配置动态参数行为
export const dynamicParams = true;
// 禁用路由缓存，确保始终获取最新数据
export const revalidate = 0;

export default async function EditCharacterPage({
  params
}: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const { user, session } = await validateRequest();
  
  if (!session) {
    redirect(`/u/login?redirectTo=/a/char/edit/${id}`);
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          编辑角色
        </Typography>
      </Box>
      
      <EditCharacterClientWrapper characterId={id} />
    </Container>
  );
} 