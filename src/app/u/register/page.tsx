'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerCode, setRegisterCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !password || !confirmPassword || !registerCode) {
      setError('请填写所有必填字段');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (!captchaToken) {
      setError('请完成人机验证');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, captchaToken, registerCode }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || '注册失败');
      }
      router.push('/u/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault();

  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);
  const handleMouseDownConfirmPassword = (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault();

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" gutterBottom>
          注册管理员账号
        </Typography>
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="用户名"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="密码"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="确认密码"
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={handleClickShowConfirmPassword}
                    onMouseDown={handleMouseDownConfirmPassword}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="registerCode"
            label="注册验证码"
            name="registerCode"
            value={registerCode}
            onChange={(e) => setRegisterCode(e.target.value)}
            disabled={loading}
          />
          <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
            <HCaptcha
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001'}
              onVerify={(token: string) => {
                setCaptchaToken(token);
                setError(null); // Clear error on successful captcha
              }}
              onError={(err) => setError(`人机验证失败: ${err}`)}
              onExpire={() => {
                setCaptchaToken(null);
                setError('人机验证已过期，请重试');
              }}
            />
          </Box>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || !captchaToken}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : '注册'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Button 
              component={Link} 
              href="/u/login" 
              variant="text" 
              sx={{ textTransform: 'none' }}
            >
              已有账号？返回登录
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
} 