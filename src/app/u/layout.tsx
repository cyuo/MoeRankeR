'use client';

import React from 'react';
// ThemeRegistry 应该由根布局提供，此处通常不需要重复
// import ThemeRegistry from '../../ThemeRegistry'; // 注意路径，如果需要的话

export default function UserAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 这些页面通常有自己的 Container 和 Paper 来构建UI
  // 此处layout的主要作用是提供一个干净的父级或特定于/u路由的上下文
  return <>{children}</>; 
  // 如果需要一个统一的背景色或最小高度，可以这样：
  // return (
  //   <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.100' }}>
  //     {children}
  //   </Box>
  // );
} 