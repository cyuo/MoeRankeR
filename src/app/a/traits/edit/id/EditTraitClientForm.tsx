'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TraitForm, { TraitFormData, SimpleTrait } from '@/components/admin/TraitForm';

interface EditTraitClientFormProps {
  trait: SimpleTrait;
}

export default function EditTraitClientForm({ trait }: EditTraitClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (data: TraitFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 使用新的API路径
      const apiUrl = `/api/a/traits/${trait._id}`;
      console.log(`[调试] 提交PUT请求到: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 确保发送cookies以进行身份验证
        body: JSON.stringify(data),
      });

      console.log(`[调试] PUT响应状态: ${response.status}`);

      if (response.ok) {
        console.log('[调试] 更新成功, 跳转回列表页');
        router.push('/a/traits'); // 重定向到萌属性列表
        router.refresh(); // 刷新服务器组件
      } else {
        const errorData = await response.json();
        console.error('[调试] 更新失败:', errorData);
        setSubmitError(errorData.error || '更新萌属性失败，请重试。');
      }
    } catch (error) {
      console.error('[调试] 提交表单时出错:', error);
      setSubmitError('发生意外错误，请重试。');
    }
    setIsSubmitting(false);
  };

  return (
    <TraitForm 
      onSubmit={handleSubmit} 
      initialData={trait} 
      isSubmitting={isSubmitting} 
      submitError={submitError}
      mode="edit"
      labels={{
        name: "萌属性名称",
        importance: "重要性 (例如: 0.5, 1.0)",
        moegirlLink: "萌娘百科链接",
        moegirlLinkHelp: "只需输入路径部分（如 'Tsundere' 或 '傲娇'）",
        submitEdit: "保存更改",
        nameRequired: "名称为必填项",
        invalidImportance: "重要性必须是数字",
        invalidUrl: "格式无效，请只输入路径部分（如 'Tsundere' 或 '傲娇'）"
      }}
    />
  );
} 