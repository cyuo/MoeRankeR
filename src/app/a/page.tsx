import { redirect } from 'next/navigation';
import { validateRequest } from '@/lib/auth';
import Link from 'next/link';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import TagIcon from '@mui/icons-material/Tag';
import CategoryIcon from '@mui/icons-material/Category';

export default async function AdminIndexPage() {
  const { user, session } = await validateRequest();
  
  if (!session) {
    redirect('/u/login?redirectTo=/a');
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          管理控制台
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          欢迎回来，{user?.username}
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                  角色管理
                </Typography>
              </Box>
              <Typography variant="body1">
                管理所有角色的信息，包括添加、编辑和删除角色。
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={Link} href="/a/char" variant="contained" fullWidth>
                管理角色
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TagIcon fontSize="large" color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                  萌属性管理
                </Typography>
              </Box>
              <Typography variant="body1">
                管理所有萌属性，包括添加、编辑和删除萌属性标签。
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={Link} href="/a/traits" variant="contained" color="secondary" fullWidth>
                管理萌属性
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CategoryIcon fontSize="large" color="info" sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                  分组管理
                </Typography>
              </Box>
              <Typography variant="body1">
                管理角色分组，用于对角色进行分类和筛选。
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={Link} href="/a/subsets" variant="contained" color="info" fullWidth>
                管理分组
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
} 