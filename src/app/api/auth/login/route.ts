import { NextRequest, NextResponse } from 'next/server';
import { lucia, UserModel, verifyPassword, UserDocument } from '@/lib/auth';
import { verifyCaptcha } from '@/lib/captcha'; // 取消注释

export async function POST(req: NextRequest) {
    try {
        const { username, password, captchaToken } = await req.json(); // 取消注释 captchaToken

        if (!username || !password) { // captchaToken 检查将单独进行
            return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 });
        }
        if (!captchaToken) {
            return NextResponse.json({ success: false, message: 'CAPTCHA token is required' }, { status: 400 });
        }
        
        if (typeof username !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ success: false, message: 'Invalid username or password format' }, { status: 400 });
        }

        // hCaptcha 验证
        const forwardedFor = req.headers.get('x-forwarded-for');
        const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined;
        const captchaValidation = await verifyCaptcha(captchaToken, clientIp);
        if (!captchaValidation.success) {
            return NextResponse.json({ success: false, message: captchaValidation.message || 'CAPTCHA verification failed' }, { status: 400 });
        }

        const existingUser = await UserModel.findOne({ username: username.toLowerCase() }).lean<UserDocument>();
        if (!existingUser) {
            return NextResponse.json({ success: false, message: 'Incorrect username or password' }, { status: 401 });
        }

        if (!existingUser.hashedPassword) {
            // 用户可能通过 OAuth 注册，没有设置密码
            return NextResponse.json({ success: false, message: 'Password not set for this user. Try OAuth?' }, { status: 401 });
        }

        const isValidPassword = await verifyPassword(existingUser.hashedPassword, password);
        if (!isValidPassword) {
            return NextResponse.json({ success: false, message: 'Incorrect username or password' }, { status: 401 });
        }

        const session = await lucia.createSession(existingUser._id, {}); // 使用用户的实际 _id
        const sessionCookie = lucia.createSessionCookie(session.id);

        const response = NextResponse.json(
            { success: true, message: 'Logged in successfully', userId: existingUser._id },
            { status: 200 }
        );
        response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        return response;

    } catch (error: any) {
        console.error('Login API error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 });
    }
} 