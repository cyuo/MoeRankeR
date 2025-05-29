'use client';

import Link from 'next/link';
import UserStatus from './UserStatus';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useThemeMode } from './ThemeRegistry';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import type { User } from 'lucia';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const { mode, toggleTheme } = useThemeMode();
  const muiTheme = useMuiTheme();

  return (
    <AppBar 
      position="static" 
      color="default"
      elevation={1}
      sx={{ 
        backgroundColor: 'background.paper', 
        color: 'text.primary'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            textDecoration: 'none',
            color: 'text.primary',
            fontWeight: 'bold',
            '&:hover': {
              textDecoration: 'none',
            },
          }}
        >
          MoeRanker
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user && (
            <Button
              component={Link}
              href="/a"
              color="primary"
              startIcon={<AdminPanelSettingsIcon />}
              sx={{ mr: 1 }}
            >
              管理
            </Button>
          )}
          <IconButton onClick={toggleTheme} color="inherit" aria-label="toggle theme">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <UserStatus user={user} />
        </Box>
      </Toolbar>
    </AppBar>
  );
} 