// hCaptcha验证工具

import { ApiEnv } from '../types';
import { getEnvVar } from './env';

/**
 * hCaptcha验证结果接口
 */
export interface CaptchaVerifyResult {
  success: boolean;
  errorMessage?: string;
}

/**
 * hCaptcha API响应接口
 */
interface HcaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * 验证hCaptcha令牌
 * @param env API环境变量
 * @param token hCaptcha令牌
 * @param request 原始请求对象
 * @returns 验证是否成功
 */
export async function validateCaptcha(
  env: ApiEnv,
  token: string,
  request: Request
): Promise<boolean> {
  try {
    // 获取hCaptcha密钥
    const secret = getEnvVar(env, 'HCAPTCHA_SECRET', '');
    
    // 如果没有配置密钥，在开发环境中允许跳过验证
    if (!secret && getEnvVar(env, 'ENVIRONMENT', '') === 'development') {
      console.log('开发环境中未配置hCaptcha密钥，跳过验证');
      return true;
    }
    
    if (!secret) {
      console.error('未配置hCaptcha密钥');
      return false;
    }

    // 获取客户端IP
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For') || 
                    '127.0.0.1';

    // 发送验证请求到hCaptcha API
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: clientIP,
      }).toString(),
    });

    // 解析响应
    const data = await response.json() as HcaptchaResponse;
    
    // 验证结果
    if (data.success) {
      return true;
    } else {
      console.error('hCaptcha验证失败:', data['error-codes']);
      return false;
    }
  } catch (error) {
    console.error('hCaptcha验证过程中发生错误:', error);
    return false;
  }
}

// 删除重复的函数定义 