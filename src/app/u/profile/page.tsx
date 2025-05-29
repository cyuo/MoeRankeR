import { validateRequest } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link'; // Import Link for navigation
import {
  Container,
  Paper,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Avatar,
  Button
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// import UpdateIcon from '@mui/icons-material/Update';
import LogoutButton from './LogoutButton'; // 新的客户端组件处理登出

export default async function ProfilePage() {
  const { user, session } = await validateRequest();

  if (!user || !session) {
    redirect('/u/login?reason=unauthenticated');
  }

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar 
            sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem', mr: 3 }}
          >
            {user.username?.charAt(0).toUpperCase() || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography component="h1" variant="h4" gutterBottom>
              用户资料
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              你好, {user.username || '用户'}!
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <List disablePadding>
              <ListItem sx={{ py: 1.5 }}>
                <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                <ListItemText 
                  primary="用户名" 
                  secondary={user.username || 'N/A'}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'h6', color: 'text.primary' }}
                />
              </ListItem>
              <ListItem sx={{ py: 1.5 }}>
                <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                <ListItemText 
                  primary="用户ID"
                  secondary={user.id} 
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            component={Link}
            href="/"
            variant="outlined"
          >
            返回首页
          </Button>
          <LogoutButton />
        </Box>
      </Paper>
    </Container>
  );
}