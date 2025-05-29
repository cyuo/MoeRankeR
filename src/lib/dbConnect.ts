import mongoose from 'mongoose';
import Redis from 'ioredis';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongooseConnect; // Changed variable name to avoid conflict with mongoose global

if (!cached) {
  cached = (global as any).mongooseConnect = { conn: null, promise: null, modelsLoaded: false };
}

// 预加载所有模型，确保它们在使用前已注册
async function loadAllModels() {
  if (cached.modelsLoaded) return;

  // 确保在这里导入所有模型
  // 这样他们会被正确注册到mongoose中
  try {
    // 预加载所有模型
    await import('@/models/Character');
    await import('@/models/Trait');
    await import('@/models/Subset');
    // 如果有其他模型，也在这里添加导入
    
    cached.modelsLoaded = true;
    console.log('所有模型预加载完成');
  } catch (error) {
    console.error('预加载模型失败:', error);
  }
}

async function dbConnect() {
  if (cached.conn) {
    // console.log('Using cached DB connection');
    await loadAllModels(); // 确保模型已加载
    return cached.conn;
  }

  if (!cached.promise) {
    // console.log('Creating new DB connection promise');
    const opts = {
      bufferCommands: false,
      // useNewUrlParser: true, // Deprecated in new Mongoose versions
      // useUnifiedTopology: true, // Deprecated
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then(async (mongooseInstance) => {
      // console.log('DB connected via promise');
      await loadAllModels(); // 连接成功后加载模型
      return mongooseInstance;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on error
    cached.modelsLoaded = false; // 重置模型加载状态
    // console.error('DB connection error:', e);
    throw e;
  }
  // console.log('DB connection established');
  return cached.conn;
}

let redis: Redis | null = null;

export function getRedisClient() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL as string);
  }
  return redis;
}

export default dbConnect; 