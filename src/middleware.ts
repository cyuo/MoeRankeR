import { NextResponse, NextRequest } from 'next/server';

// 不需要身份验证的路径
const PUBLIC_PATHS = ['/u/login', '/u/register', '/', '/favicon.ico'];

// 需要身份验证的路径前缀
const PROTECTED_PATH_PREFIXES = ['/u/profile', '/a/'];

// 这个中间件会在每个请求前运行
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  // 检查是否为受保护的路径
  const isProtectedPath = PROTECTED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
  
  if (!isProtectedPath && !pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // 检查会话cookie是否存在
  const authCookie = req.cookies.get('auth_session')?.value;

  // 如果没有session并且是受保护的路径，重定向到登录页面
  if (!authCookie && isProtectedPath) {
    const url = req.nextUrl.clone();
    url.pathname = '/u/login';
    // 添加重定向参数
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - api 路由
     * - 静态文件 (如 .js, .css, 图片等)
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
  ],
}; 