/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export',  // 移除静态导出，因为 Lucia Auth 需要服务器运行时
  images: {
    domains: ['bgm.tv', 'lain.bgm.tv', 'via.placeholder.com'], // 允许的图片域名
    unoptimized: true, // Cloudflare Pages 需要禁用图片优化
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
    // serverComponentsExternalPackages: ['oslo'], // 旧配置，将被移除或注释
  },
  serverExternalPackages: ['oslo', '@node-rs/argon2'], // 新配置
  webpack: (config, { isServer }) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.jsx', '.tsx']
    }

    if (isServer) {
      config.externals = [...config.externals, /@node-rs\/argon2/];
    }

    return config
  }
}

module.exports = nextConfig 