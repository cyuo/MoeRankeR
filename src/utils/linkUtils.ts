export const getTraitMoegirlLink = (
  traitName: string,
  dbLink?: string, // 从数据库 Trait.moegirl_link 获取的值
  traitLinksJson?: Record<string, string> // 从 trait_links.json 加载的数据
): string | null => {
  const baseUrl = 'https://zh.moegirl.org.cn/';

  // 优先1: 使用数据库中提供的 dbLink (如果有效)
  if (dbLink !== undefined) {
    if (dbLink === '') {
      return null; // 明确无链接
    }
    if (dbLink.startsWith('http')) {
      return dbLink; // 完整 URL
    }
    // 判断 dbLink 是否已编码：如果包含 %，则认为已编码，直接使用；否则进行编码。
    if (dbLink.includes('%')) {
      return `${baseUrl}${dbLink}`; // 假定已编码
    } else {
      return `${baseUrl}${encodeURIComponent(dbLink)}`; // 未编码，进行编码
    }
  }

  // 优先2: 从 trait_links.json 查找 (如果 dbLink 未提供或无效，并且 traitLinksJson 提供了)
  if (traitLinksJson && typeof traitLinksJson[traitName] === 'string') {
    const pathOrFullUrlFromJson = traitLinksJson[traitName];
    if (pathOrFullUrlFromJson === '') {
      return null;
    }
    if (pathOrFullUrlFromJson.startsWith('http')) {
      return pathOrFullUrlFromJson;
    }
    // trait_links.json 中的值是预编码的
    return `${baseUrl}${pathOrFullUrlFromJson}`;
  }

  // 优先3: 使用 traitName 本身 (如果 traitName 有效)
  if (!traitName || traitName.trim() === '') {
    return null;
  }
  return `${baseUrl}${encodeURIComponent(traitName)}`;
}; 