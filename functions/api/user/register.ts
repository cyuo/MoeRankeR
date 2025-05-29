import { ApiEnv } from '../../types';
import { createUser } from '../../utils/auth';
import { corsHeaders } from '../../utils/cors';

interface RegisterRequest {
  username: string;
  password: string;
  registerCode: string;
  captchaToken: string;
}

export async function onRequestPost(context: { request: Request; env: ApiEnv }) {
  const { request, env } = context;

  try {
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // 解析请求体
    let data: RegisterRequest;
    try {
      data = await request.json() as RegisterRequest;
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '无效的请求格式'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 验证请求参数
    const { username, password, registerCode, captchaToken } = data;
    if (!username || !password || !registerCode || !captchaToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '缺少必要参数'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 执行注册
    const result = await createUser(env, username, password, registerCode, captchaToken, request);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: result.message
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 注册成功
    return new Response(
      JSON.stringify({
        success: true,
        message: '注册成功',
        userId: result.userId
      }),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('注册处理失败:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : '注册处理失败'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 