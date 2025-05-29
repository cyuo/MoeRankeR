'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

interface FormData {
  slug: string;
  display_name: string;
}

export default function CreateSubsetClientForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    slug: '',
    display_name: '',
  });
  
  const [errors, setErrors] = useState({
    slug: '',
    display_name: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除字段错误
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // 自动生成slug
  const handleDisplayNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const displayName = e.target.value;
    setFormData(prev => ({
      ...prev,
      display_name: displayName
    }));
    
    // 如果用户还没有手动修改过slug，则自动生成slug
    if (!formData.slug || formData.slug === convertToSlug(formData.display_name)) {
      const newSlug = convertToSlug(displayName);
      setFormData(prev => ({
        ...prev,
        slug: newSlug
      }));
    }
    
    // 清除display_name错误
    if (errors.display_name) {
      setErrors(prev => ({
        ...prev,
        display_name: ''
      }));
    }
  };
  
  // 转换为slug格式 (小写，空格替换为短横线，移除特殊字符)
  const convertToSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 替换空格为短横线
      .replace(/-+/g, '-') // 替换多个短横线为单个短横线
      .trim(); // 移除首尾空格
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    let formErrors = {
      slug: '',
      display_name: '',
    };
    
    if (!formData.slug.trim()) {
      formErrors.slug = 'Slug不能为空';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      formErrors.slug = 'Slug只能包含小写字母、数字和短横线';
    }
    
    if (!formData.display_name.trim()) {
      formErrors.display_name = '显示名称不能为空';
    }
    
    // 如果有错误，更新错误状态并返回
    if (formErrors.slug || formErrors.display_name) {
      setErrors(formErrors);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/a/subsets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '创建分组失败');
      }
      
      setSuccess('分组创建成功！正在跳转...');
      
      // 创建成功后重定向到分组列表页
      setTimeout(() => {
        router.push('/a/subsets');
      }, 1500);
    } catch (err: any) {
      setError(err.message || '创建分组时发生错误');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Typography variant="h6" gutterBottom>
        分组信息
      </Typography>
      
      <TextField
        fullWidth
        margin="normal"
        label="显示名称"
        name="display_name"
        value={formData.display_name}
        onChange={handleDisplayNameChange}
        error={!!errors.display_name}
        helperText={errors.display_name || '分组的显示名称，如"京阿尼"、"2023年冬季动画"'}
        required
      />
      
      <TextField
        fullWidth
        margin="normal"
        label="Slug"
        name="slug"
        value={formData.slug}
        onChange={handleChange}
        error={!!errors.slug}
        helperText={errors.slug || 'URL友好的标识符，如"kyoani"、"2023-winter-anime"'}
        required
        InputProps={{
          startAdornment: <InputAdornment position="start">/</InputAdornment>,
        }}
      />
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={loading}
        >
          {loading ? '保存中...' : '保存分组'}
        </Button>
      </Box>
    </Paper>
  );
} 