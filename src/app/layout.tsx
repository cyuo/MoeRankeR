import React from 'react';
// import './globals.css'; // 您可以按需保留或移除全局CSS
import Navbar from '../components/Navbar'; // 路径已修正
import ThemeRegistry from '../components/ThemeRegistry'; // 修正路径
import { Box } from '@mui/material';
import { validateRequest } from '@/lib/auth'; // 导入 validateRequest

export const metadata = {
  title: 'MoeRanker - 萌属性排序器',
  description: '一个用于排序动漫角色萌属性的工具',
};

export default async function RootLayout({ // RootLayout is now async
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest(); // 获取用户信息

  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
        <ThemeRegistry>
          <Navbar user={user} /> {/* 将 user 传递给 Navbar */}
          <Box 
            component="main" 
            sx={{ 
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default'
            }}
          >
            {children}
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
