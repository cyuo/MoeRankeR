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
  Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';

interface SubsetData {
  _id: string;
  slug: string;
  display_name: string;
  characters?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  slug: string;
  display_name: string;
}

interface EditSubsetClientFormProps {
  subset: SubsetData;
}

export default function EditSubsetClientForm({ subset }: EditSubsetClientFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    slug: subset.slug,
    display_name: subset.display_name,
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
      const response = await fetch(`/api/a/subsets/${subset._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '更新分组失败');
      }
      
      setSuccess('分组更新成功！');
      // 不需要重定向，用户可能想继续编辑
    } catch (err: any) {
      setError(err.message || '更新分组时发生错误');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          基本信息
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">创建时间:</Typography>
          <Typography variant="body2">
            {new Date(subset.createdAt || '').toLocaleString()}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">角色数量:</Typography>
          <Chip 
            icon={<PersonIcon />} 
            label={subset.characters?.length || 0} 
            variant="outlined" 
            size="small" 
            color="primary"
          />
        </Box>
      </Box>
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="显示名称"
          name="display_name"
          value={formData.display_name}
          onChange={handleChange}
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
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => router.push(`/a/subsets/chars/${subset._id}`)}
          >
            管理分组角色
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={loading}
          >
            {loading ? '保存中...' : '保存更改'}
          </Button>
        </Box>
      </form>
    </>
  );
} 