import { NextRequest, NextResponse } from 'next/server';
import { verifyCaptcha } from '@/lib/captcha';
import { getRedisClient } from '@/lib/dbConnect';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { captchaToken } = await req.json();
    if (!captchaToken) {
      return NextResponse.json({ success: false, message: '缺少 hCaptcha token' }, { status: 400 });
    }

    // 校验 hCaptcha
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;
    const captchaValidation = await verifyCaptcha(captchaToken, clientIp);
    if (!captchaValidation.success) {
      return NextResponse.json({ success: false, message: captchaValidation.message || 'hCaptcha 验证失败' }, { status: 400 });
    }

    // 生成临时 token
    const sessionToken = randomUUID();
    const redis = getRedisClient();
    // 存储到 Redis，10分钟有效
    await redis.setex(`captcha_session:${sessionToken}`, 600, '1');

    return NextResponse.json({ success: true, sessionToken });
  } catch (error) {
    console.error('[API_CAPTCHA_SESSION] 错误:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
} 