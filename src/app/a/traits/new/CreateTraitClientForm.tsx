'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TraitForm, { TraitFormData } from '@/components/admin/TraitForm';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

export default function CreateTraitClientForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (data: TraitFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 使用新的API路径
      const apiUrl = '/api/a/traits';
      console.log(`[调试] 提交POST请求到: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 确保发送cookies以进行身份验证
        body: JSON.stringify(data),
      });

      console.log(`[调试] POST响应状态: ${response.status}`);

      if (response.ok) {
        console.log('[调试] 创建成功, 跳转回列表页');
        router.push('/a/traits'); // 重定向到萌属性列表
        router.refresh(); // 刷新服务器组件
      } else {
        const errorData = await response.json();
        console.error('[调试] 创建失败:', errorData);
        setSubmitError(errorData.error || '创建萌属性失败，请重试。');
      }
    } catch (error) {
      console.error('[调试] 提交表单时出错:', error);
      setSubmitError('发生意外错误，请重试。');
    }
    setIsSubmitting(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <TraitForm 
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting} 
        submitError={submitError} 
        mode="create"
        labels={{
          name: "萌属性名称",
          importance: "重要性 (例如: 0.5, 1.0)",
          moegirlLink: "萌娘百科链接",
          moegirlLinkHelp: "只需输入路径部分（如 'Tsundere' 或 '傲娇'）",
          submitCreate: "创建萌属性",
          nameRequired: "名称为必填项",
          invalidImportance: "重要性必须是数字",
          invalidUrl: "格式无效，请只输入路径部分（如 'Tsundere' 或 '傲娇'）"
        }}
      />
    </Paper>
  );
} 