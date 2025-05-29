import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 验证会话是否有效
  const { user, session } = await validateRequest();
  
  // 如果会话无效，重定向到登录页面
  if (!session) {
    // 重定向到登录页面
    redirect('/u/login');
  }
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
} 