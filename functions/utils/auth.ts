// 用户认证工具函数

import { ApiEnv } from '../types';
import { getEnvVar } from './env';
import { validateCaptcha } from './captcha';

/**
 * 用户数据接口
 */
export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: number;
  updated_at: number;
}

/**
 * 会话数据接口
 */
export interface Session {
  id: string;
  user_id: number;
  expires_at: number;
  created_at: number;
}

/**
 * 生成随机会话ID
 */
export function generateSessionId(): string {
  // 生成一个随机的会话ID
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 哈希密码
 * 注意：在实际生产环境中，应该使用更安全的哈希算法和加盐
 */
export async function hashPassword(password: string): Promise<string> {
  // 使用 SHA-256 哈希算法
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * 验证注册码
 */
export function verifyRegisterCode(env: ApiEnv, code: string): boolean {
  const validCode = getEnvVar(env, 'REGISTER_CODE', '');
  return code === validCode;
}

/**
 * 创建用户
 */
export async function createUser(
  env: ApiEnv,
  username: string,
  password: string,
  registerCode: string,
  captchaToken: string,
  request: Request
): Promise<{ success: boolean; message: string; userId?: number }> {
  try {
    // 验证hCaptcha
    const captchaValid = await validateCaptcha(env, captchaToken, request);
    if (!captchaValid) {
      return { success: false, message: '验证码验证失败' };
    }

    // 调试日志：打印接收到的注册码和环境变量中的注册码
    console.log("[AuthUtil-createUser] Received register code from client:", registerCode);
    const envRegisterCode = getEnvVar(env, 'REGISTER_CODE', '');
    console.log("[AuthUtil-createUser] Expected register code from env:", envRegisterCode);

    // 验证注册码
    if (!verifyRegisterCode(env, registerCode)) {
      console.error("[AuthUtil-createUser] Register code mismatch or invalid!"); // 明确打印不匹配信息
      return { success: false, message: '注册码无效' };
    }

    // 检查用户名是否已存在
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first();

    if (existingUser) {
      return { success: false, message: '用户名已存在' };
    }

    // 哈希密码
    const passwordHash = await hashPassword(password);
    const timestamp = Math.floor(Date.now() / 1000);

    // 创建用户
    const result = await env.DB.prepare(
      'INSERT INTO users (username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).bind(username, passwordHash, timestamp, timestamp).run();

    if (!result.success) {
      return { success: false, message: '创建用户失败' };
    }

    return {
      success: true,
      message: '用户创建成功',
      userId: result.meta.last_row_id
    };
  } catch (error) {
    console.error('创建用户失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '创建用户时发生未知错误'
    };
  }
}

/**
 * 用户登录
 */
export async function loginUser(
  env: ApiEnv,
  username: string,
  password: string,
  captchaToken: string,
  request: Request
): Promise<{ success: boolean; message: string; sessionId?: string; user?: Omit<User, 'password_hash'> }> {
  try {
    // 验证hCaptcha
    const captchaValid = await validateCaptcha(env, captchaToken, request);
    if (!captchaValid) {
      return { success: false, message: '验证码验证失败' };
    }

    // 查找用户
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first() as User | null;

    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }

    // 验证密码
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return { success: false, message: '用户名或密码错误' };
    }

    // 创建会话
    const sessionId = generateSessionId();
    const timestamp = Math.floor(Date.now() / 1000);
    const sessionDuration = parseInt(getEnvVar(env, 'SESSION_DURATION', '2592000')); // 默认30天
    const expiresAt = timestamp + sessionDuration;

    // 清理该用户的旧会话
    await env.DB.prepare(
      'DELETE FROM user_sessions WHERE user_id = ?'
    ).bind(user.id).run();

    // 创建新会话
    const result = await env.DB.prepare(
      'INSERT INTO user_sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
    ).bind(sessionId, user.id, expiresAt, timestamp).run();

    if (!result.success) {
      return { success: false, message: '创建会话失败' };
    }

    // 返回成功结果，不包含密码哈希
    const { password_hash, ...userWithoutPassword } = user;
    return {
      success: true,
      message: '登录成功',
      sessionId,
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('登录失败:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '登录时发生未知错误'
    };
  }
}

/**
 * 验证会话
 */
export async function validateSession(
  env: ApiEnv,
  sessionId: string
): Promise<{ valid: boolean; user?: Omit<User, 'password_hash'> }> {
  try {
    // 查找会话
    const timestamp = Math.floor(Date.now() / 1000);
    const session = await env.DB.prepare(
      'SELECT * FROM user_sessions WHERE id = ? AND expires_at > ?'
    ).bind(sessionId, timestamp).first() as Session | null;

    if (!session) {
      return { valid: false };
    }

    // 查找用户
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(session.user_id).first() as User | null;

    if (!user) {
      return { valid: false };
    }

    // 返回用户信息，不包含密码哈希
    const { password_hash, ...userWithoutPassword } = user;
    return {
      valid: true,
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('验证会话失败:', error);
    return { valid: false };
  }
}

/**
 * 注销会话
 */
export async function logoutSession(
  env: ApiEnv,
  sessionId: string
): Promise<boolean> {
  try {
    const result = await env.DB.prepare(
      'DELETE FROM user_sessions WHERE id = ?'
    ).bind(sessionId).run();

    return result.success;
  } catch (error) {
    console.error('注销会话失败:', error);
    return false;
  }
}

/**
 * 从请求中获取会话ID
 */
export function getSessionIdFromRequest(request: Request): string | null {
  // 从Cookie中获取会话ID
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  
  for (const cookie of cookies) {
    if (cookie.startsWith('sessionId=')) {
      return cookie.substring('sessionId='.length);
    }
  }
  
  return null;
}

/**
 * 创建带会话Cookie的响应
 */
export function createSessionResponse(
  data: any,
  sessionId: string,
  expiresInSeconds: number = 2592000 // 默认30天
): Response {
  const expires = new Date(Date.now() + expiresInSeconds * 1000);
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Expires=${expires.toUTCString()}`
    }
  });
}

/**
 * 创建清除会话的响应
 */
export function createLogoutResponse(data: any): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'sessionId=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  });
} 