'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, CircularProgress, Alert } from '@mui/material';

export default function LogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          router.push('/'); // 重定向到首页
          router.refresh(); // 确保刷新页面状态
        } else {
          throw new Error(data.message || '登出失败');
        }
      } else {
         const data = await response.json();
        throw new Error(data.message || '登出请求失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '退出登录时发生错误');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
      <Button 
        variant="contained" 
        color="primary"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? <CircularProgress size={24} color="inherit" /> : '退出登录'}
      </Button>
    </>
  );
} 