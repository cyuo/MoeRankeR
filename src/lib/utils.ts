/**
 * 转义用于构建正则表达式的字符串中的特殊字符
 * 在使用用户输入构建正则表达式时，为了避免正则表达式注入攻击，需要转义特殊字符
 * @param string 需要转义的字符串
 * @returns 转义后的字符串
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& 表示整个匹配的字符串
}

/**
 * 格式化日期为易读的字符串
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 格式化日期时间为易读的字符串
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 截断文本到指定长度，并添加省略号
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 去除HTML标签
 * @param html 含HTML标签的字符串
 * @returns 纯文本内容
 */
export function stripHtml(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, '');
}

/**
 * 随机生成颜色代码
 * @returns 随机生成的16进制颜色代码
 */
export function randomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * 检查值是否为空（null, undefined, 空字符串, 空数组, 空对象）
 * @param value 要检查的值
 * @returns 是否为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
} 