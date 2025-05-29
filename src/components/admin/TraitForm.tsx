'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { ITrait } from '@/models/Trait';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useEffect } from 'react';

export interface TraitFormData {
  name: string;
  importance?: number | string; // string initially from input, then parsed
  moegirl_link?: string;
}

// 简化的特征接口，用于客户端数据传递
export interface SimpleTrait {
  _id: string;
  name: string;
  importance?: number;
  moegirl_link?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 默认标签文本
const DEFAULT_LABELS = {
  name: "Trait Name",
  importance: "Importance (e.g., 0.5, 1.0)",
  moegirlLink: "Moegirl Link",
  moegirlLinkHelp: "Path part only (e.g. 'Tsundere' or '傲娇')",
  submitCreate: "Create Trait",
  submitEdit: "Save Changes",
  nameRequired: "Name is required",
  invalidImportance: "Importance must be a number",
  invalidUrl: "Invalid format. Please enter only the path part"
};

interface TraitFormLabels {
  name?: string;
  importance?: string;
  moegirlLink?: string;
  moegirlLinkHelp?: string;
  submitCreate?: string;
  submitEdit?: string;
  submit?: string; // 直接设置的提交按钮文本，优先级高于mode特定文本
  nameRequired?: string;
  invalidImportance?: string;
  invalidUrl?: string;
}

interface TraitFormProps {
  onSubmit: SubmitHandler<TraitFormData>;
  initialData?: SimpleTrait | (ITrait & { _id: string }); // 支持两种类型的初始数据
  isSubmitting?: boolean;
  submitError?: string | null;
  mode?: 'create' | 'edit';
  labels?: TraitFormLabels;
}

// 萌娘百科链接格式化 - 仅保留路径部分
const formatMoegirlLink = (value: string): string => {
  // 移除URL前缀
  let formattedValue = value.trim();
  if (formattedValue.startsWith('http://') || formattedValue.startsWith('https://')) {
    const url = new URL(formattedValue);
    // 提取路径部分，移除域名
    formattedValue = url.pathname.replace(/^\//, '');
  }
  
  // 如果输入了完整的萌娘百科URL，提取路径部分
  const moegirlPrefixes = [
    'zh.moegirl.org.cn/',
    'moegirl.org.cn/',
    'www.moegirl.org.cn/',
    'mzh.moegirl.org.cn/'
  ];
  
  for (const prefix of moegirlPrefixes) {
    if (formattedValue.includes(prefix)) {
      formattedValue = formattedValue.split(prefix)[1] || '';
      break;
    }
  }
  
  return formattedValue;
};

export default function TraitForm({
  onSubmit,
  initialData,
  isSubmitting = false,
  submitError = null,
  mode = 'create',
  labels = {}
}: TraitFormProps) {
  // 合并默认标签和自定义标签
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  
  const defaultValues = {
    name: initialData?.name || '',
    importance: initialData?.importance !== undefined ? String(initialData.importance) : '',
    moegirl_link: initialData?.moegirl_link || '',
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TraitFormData>({
    defaultValues,
  });
  
  // 确保表单正确重置，特别是在初始数据更改时
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        importance: initialData.importance !== undefined ? String(initialData.importance) : '',
        moegirl_link: initialData.moegirl_link || '',
      });
    }
  }, [initialData, reset]);
  
  const onFormSubmit: SubmitHandler<TraitFormData> = (data) => {
    const processedData: TraitFormData = {
      ...data,
      importance: data.importance ? parseFloat(String(data.importance)) : undefined,
      // 确保只保存路径部分
      moegirl_link: data.moegirl_link ? formatMoegirlLink(data.moegirl_link) : undefined
    };
    onSubmit(processedData);
  };

  // 确定提交按钮文本
  const getSubmitButtonText = () => {
    // 如果直接设置了submit属性，优先使用
    if (mergedLabels.submit) return mergedLabels.submit;
    
    // 否则根据mode选择相应的文本
    return mode === 'create' 
      ? mergedLabels.submitCreate 
      : mergedLabels.submitEdit;
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} noValidate sx={{ mt: 1 }}>
      <Controller
        name="name"
        control={control}
        rules={{ required: mergedLabels.nameRequired }}
        render={({ field }) => (
          <TextField
            {...field}
            margin="normal"
            required
            fullWidth
            id="name"
            label={mergedLabels.name}
            autoFocus
            error={!!errors.name}
            helperText={errors.name?.message}
            disabled={isSubmitting}
          />
        )}
      />
      <Controller
        name="importance"
        control={control}
        rules={{
            validate: value => 
                value === '' || value === undefined || (!isNaN(parseFloat(String(value))) && isFinite(Number(value))) || mergedLabels.invalidImportance
        }}
        render={({ field }) => (
          <TextField
            {...field}
            margin="normal"
            fullWidth
            id="importance"
            label={mergedLabels.importance}
            type="number"
            InputLabelProps={{
                shrink: true, // Keep label floated for number type
            }}
            inputProps={{ step: "0.1" }} // Allow decimal steps
            error={!!errors.importance}
            helperText={errors.importance?.message}
            disabled={isSubmitting}
          />
        )}
      />
      <Controller
        name="moegirl_link"
        control={control}
        rules={{
          // 不再检查URL格式，仅检查基本格式是否合理
          validate: (value) => {
            if (!value) return true; // 允许为空
            // 如果包含完整URL但格式错误，则拒绝
            if ((value.startsWith('http://') || value.startsWith('https://')) && 
                !value.match(/^https?:\/\/[^\s/$.?#].[^\s]*$/i)) {
              return mergedLabels.invalidUrl;
            }
            return true;
          }
        }}
        render={({ field }) => (
          <TextField
            {...field}
            margin="normal"
            fullWidth
            id="moegirl_link"
            label={mergedLabels.moegirlLink}
            error={!!errors.moegirl_link}
            helperText={errors.moegirl_link?.message || mergedLabels.moegirlLinkHelp}
            disabled={isSubmitting}
          />
        )}
      />

      {submitError && (
        <Alert severity="error" sx={{ mt: 2, mb: 1 }}>
          {submitError}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isSubmitting}
      >
        {isSubmitting ? <CircularProgress size={24} /> : getSubmitButtonText()}
      </Button>
    </Box>
  );
} 