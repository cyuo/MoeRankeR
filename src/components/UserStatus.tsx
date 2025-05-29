'use client';

import { useState, MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import type { User } from 'lucia';

interface UserStatusProps {
  user: User | null;
}

export default function UserStatus({ user }: UserStatusProps) {
  const router = useRouter();
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleLogout = async () => {
    handleClose();
    setLoadingLogout(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          router.push('/');
          router.refresh();
        } else {
          console.error('注销API请求失败 (data.success false):', data.message);
          alert(data.message || '注销失败，请稍后再试。');
        }
      } else {
        const data = await response.json().catch(() => ({ message: '注销请求失败，无法解析响应' }));
        console.error('注销API请求失败 (response not ok):', response.statusText, data);
        alert(data.message || '注销失败，请稍后再试。');
      }
    } catch (error) {
      console.error('注销失败:', error);
      alert(error instanceof Error ? error.message : '注销时发生错误，请稍后再试。');
    } finally {
      setLoadingLogout(false);
    }
  };

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    router.push('/u/profile');
  };

  if (!user) {
    return (
      <Button component={Link} href="/u/login" color="inherit" sx={{ textTransform: 'none' }}>
        管理员登录
      </Button>
    );
  }

  return (
    <div>
      <Button
        color="inherit"
        onClick={handleClick}
        aria-controls={menuOpen ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={menuOpen ? 'true' : undefined}
        startIcon={<AccountCircle />}
        endIcon={<ArrowDropDownIcon />}
        sx={{ textTransform: 'none' }}
        disabled={loadingLogout}
      >
        {user.username || '用户'}
      </Button>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'user-button',
        }}
      >
        <MenuItem onClick={handleProfile} disabled={loadingLogout}>
          <AccountCircle sx={{ mr: 1 }} />
          个人资料
        </MenuItem>
        <MenuItem onClick={handleLogout} disabled={loadingLogout}>
          {loadingLogout ? <CircularProgress size={20} sx={{mr:1}}/> : <ExitToAppIcon sx={{ mr: 1 }} />}
          {loadingLogout ? '注销中...' : '注销'}
        </MenuItem>
      </Menu>
    </div>
  );
} 