/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['bgm.tv', 'lain.bgm.tv', 'via.placeholder.com'], // 允许的图片域名
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
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