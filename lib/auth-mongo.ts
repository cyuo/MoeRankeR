import crypto from 'crypto';
import { getDatabase, getCollection } from '../scripts/mongo-utils'; // Adjusted to import getCollection as well
import { validateCaptcha } from './captcha'; // 确保路径正确

/**
 * 生成随机会话ID (使用Node.js crypto)
 */
export function generateSessionId(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * 哈希密码 (使用Node.js crypto SHA-256)
 */
export async function hashPassword(password: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === storedHash;
}

/**
 * 验证注册码
 */
export function verifyRegisterCode(code: string): boolean {
  const validCode = process.env.REGISTER_CODE || ''; // 从环境变量获取
  if (!validCode) {
    console.warn('REGISTER_CODE environment variable is not set. Registration will likely fail.');
    // 在开发环境中，如果没有设置注册码，可以考虑默认允许，或者在日志中给出更强的警告
    if (process.env.NODE_ENV === 'development') {
        console.log("Development mode: REGISTER_CODE not set, allowing registration for testing purposes ONLY.");
        return true; // 或者根据您的安全策略决定是否在开发模式下跳过
    }
  }
  return code === validCode;
}

// User interface (可以考虑放到一个单独的 types.ts 文件中)
export interface UserDocument {
  _id?: any; // MongoDB 会自动生成 _id
  username: string;
  passwordHash: string; // 注意字段名变化
  createdAt: Date;    // 使用 Date 类型
  updatedAt: Date;    // 使用 Date 类型
}

export async function createUser(
  username: string,
  password: string,
  registerCode: string,
  captchaToken: string,
  clientIP: string // 从 NextApiRequest 中获取
): Promise<{ success: boolean; message: string; userId?: any }> { // userId 类型会是 MongoDB ObjectID
  try {
    // 1. 验证hCaptcha
    const captchaValid = await validateCaptcha(captchaToken, clientIP);
    if (!captchaValid) {
      return { success: false, message: '验证码验证失败' };
    }

    // 2. 验证注册码
    if (!verifyRegisterCode(registerCode)) {
      console.error("[AuthMongo-createUser] Register code mismatch or invalid!");
      return { success: false, message: '注册码无效' };
    }

    const usersCollection = await getCollection<UserDocument>('users'); // Use the new getCollection helper

    // 3. 检查用户名是否已存在
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return { success: false, message: '用户名已存在' };
    }

    // 4. 哈希密码
    const hashedPassword = await hashPassword(password); // 字段名 passwordHash
    const now = new Date();

    // 5. 创建用户
    const newUser: UserDocument = {
      username,
      passwordHash: hashedPassword,
      createdAt: now,
      updatedAt: now,
    };
    const result = await usersCollection.insertOne(newUser);

    if (!result.insertedId) {
      return { success: false, message: '创建用户失败 (MongoDB insertOne failed)' };
    }

    return {
      success: true,
      message: '用户创建成功',
      userId: result.insertedId,
    };
  } catch (error: any) {
    console.error('创建用户失败:', error);
    return {
      success: false,
      message: error.message || '创建用户时发生未知错误',
    };
  }
}

// createUser 和 loginUser 函数将在这里稍后添加... 