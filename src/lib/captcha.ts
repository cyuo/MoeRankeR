/**
 * hCaptcha验证工具
 */

/**
 * hCaptcha API响应接口
 */
interface HcaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  message?: string;
}

interface VerificationResult {
  success: boolean;
  message?: string;
}

/**
 * 验证hCaptcha令牌
 * @param token hCaptcha令牌
 * @param clientIP 客户端IP地址
 * @returns Promise<VerificationResult> 验证结果
 */
export async function verifyCaptcha(token: string | null | undefined, clientIP?: string): Promise<VerificationResult> {
  try {
    const secret = process.env.HCAPTCHA_SECRET;
    const environment = process.env.NODE_ENV || 'development';

    if (!token) {
        return { success: false, message: 'CAPTCHA token is missing.' };
    }

    if (!secret && environment === 'development') {
      console.log('开发环境中未配置hCaptcha密钥，跳过验证 (HCAPTCHA_SECRET missing)');
      return { success: true, message: 'CAPTCHA skipped in development.' };
    }

    if (!secret) {
      console.error('未配置hCaptcha密钥 (HCAPTCHA_SECRET missing)');
      return { success: false, message: 'HCAPTCHA_SECRET is not configured.' };
    }

    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    if (clientIP) {
        params.append('remoteip', clientIP);
    }
    // sitekey 也可以发送，但通常不是必需的进行服务器端验证
    // params.append('sitekey', process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || '');


    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json() as HcaptchaResponse;

    if (data.success) {
      return { success: true };
    } else {
      console.error('hCaptcha验证失败:', data['error-codes']);
      const errorMessages = data['error-codes']?.join(', ') || 'Unknown hCaptcha error';
      return { success: false, message: `hCaptcha verification failed: ${errorMessages}` };
    }
  } catch (error) {
    console.error('hCaptcha验证过程中发生错误:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during CAPTCHA verification.';
    return { success: false, message };
  }
} 