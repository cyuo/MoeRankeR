import { Lucia } from 'lucia';
import { MongodbAdapter } from '@lucia-auth/adapter-mongodb';
import mongoose from 'mongoose';
import { TimeSpan, createDate } from 'oslo'; // oslo/password for hashing
import { Argon2id } from 'oslo/password';
import { cookies as nextCookies } from 'next/headers';
import { cache } from 'react'; // cache from react
import type { Session, User } from 'lucia';

// 确保 MONGODB_URI 环境变量已设置
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Mongoose 连接 (可以考虑从 mongo-utils.ts 导入或重用逻辑)
// 为简单起见，我们先在这里建立连接，后续可以优化为共享连接
mongoose.connect(MONGODB_URI).then(() => {
    console.log('Connected to MongoDB for Lucia Auth');
}).catch(err => {
    console.error('MongoDB connection error for Lucia Auth:', err);
});

// 定义 User Schema 和 Model
export interface UserDocument extends mongoose.Document {
    // Lucia 要求 _id 为 string 类型
    // Mongoose 默认的 _id 是 ObjectId，但 adapter-mongodb 似乎可以处理转换
    // 或者我们直接定义 _id 为 string 类型并自己生成
    _id: string; // 或者 mongoose.Schema.Types.ObjectId
    username: string;
    hashedPassword?: string; // 存储哈希后的密码
    // 你可以在这里添加更多用户属性，比如 email, avatar_url 等
    // 确保在 DatabaseUserAttributes 中也声明它们
}

const UserSchema = new mongoose.Schema<UserDocument>(
    {
        _id: { type: String, required: true }, // Lucia 通常希望 _id 是 string
        username: { type: String, required: true, unique: true },
        hashedPassword: { type: String, required: false }, // 某些 OAuth 流程可能不需要密码
    },
    { _id: false } // 告诉 Mongoose 不要创建默认的 _id，因为我们自己定义了
);

export const UserModel = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);

// 定义 Session Schema 和 Model
interface SessionDocument extends mongoose.Document {
    _id: string;
    userId: string;
    expiresAt: Date;
}

const SessionSchema = new mongoose.Schema<SessionDocument>(
    {
        _id: { type: String, required: true },
        userId: { type: String, required: true, ref: 'User' }, // 确保与 User 模型的 _id 类型匹配
        expiresAt: { type: Date, required: true },
    },
    { _id: false }
);

export const SessionModel = mongoose.models.Session || mongoose.model<SessionDocument>('Session', SessionSchema);


// 初始化 Lucia Adapter
// 注意：这里 mongoose.connection.collection('sessions') 和 mongoose.connection.collection('users')
// 的参数是 MongoDB 集合的名称，而不是 Mongoose 模型的名称。
// Mongoose 默认会将模型名称小写并复数化作为集合名称 (例如 User -> users, Session -> sessions)
// 如果你的集合名称不同，请相应修改。
export const adapter = new MongodbAdapter(
    mongoose.connection.collection('sessions'), // 使用 SessionModel.collection 也可以，但直接用名称更安全
    mongoose.connection.collection('users')   // 使用 UserModel.collection 也可以
);

// 初始化 Lucia
export const lucia = new Lucia(adapter, {
    sessionCookie: {
        // this sets cookies with super long expiration
        // since Next.js doesn't allow Lucia to extend cookie expiration when rendering pages
        expires: false, // 或者设置为具体的过期时间，例如：new TimeSpan(30, 'd')
        attributes: {
            // set to `true` when using HTTPS
            secure: process.env.NODE_ENV === 'production',
        },
    },
    sessionExpiresIn: new TimeSpan(30, 'd'), // 会话有效期，例如30天
    getUserAttributes: (attributes) => {
        return {
            // attributes has the type of DatabaseUserAttributes
            username: attributes.username,
            // email: attributes.email, // 如果你在 User schema 中添加了 email
        };
    },
});

// IMPORTANT!
declare module 'lucia' {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
        // DatabaseSessionAttributes: DatabaseSessionAttributes; // 如果需要自定义会话属性
    }
    // interface DatabaseSessionAttributes {} // 如果需要自定义会话属性
    interface DatabaseUserAttributes {
        username: string;
        // email?: string; // 如果你在 User schema 中添加了 email
    }
}

// 密码哈希和验证辅助函数 (使用 oslo/password)
export const hashPassword = async (password: string): Promise<string> => {
    return await new Argon2id().hash(password);
};

export const verifyPassword = async (hashedPassword: string, plainTextPassword: string): Promise<boolean> => {
    return await new Argon2id().verify(hashedPassword, plainTextPassword);
};

// 用于生成用户 ID 的函数，Lucia 通常需要 string 类型的 ID
// oslo 提供了 generateId
import { generateId } from 'lucia';

export const generateUserId = (): string => {
    return generateId(15); // 生成一个15个字符长度的 ID
}

export const validateRequest = cache(
    async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
        const cookieStore = await nextCookies();
        const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
        if (!sessionId) {
            return {
                user: null,
                session: null
            };
        }

        const result = await lucia.validateSession(sessionId);
        try {
            if (result.session && result.session.fresh) {
                const sessionCookie = lucia.createSessionCookie(result.session.id);
                cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
            }
            if (!result.session) {
                const sessionCookie = lucia.createBlankSessionCookie();
                cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
            }
        } catch (e) {
            console.error("Failed to set session cookie in validateRequest:", e);
        }
        return result;
    }
); 