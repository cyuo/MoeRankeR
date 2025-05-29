const fs = require('fs');
const path = require('path');

// 源文件路径
const DATA_DIR = path.join(__dirname, '../data');
const SUBSETS_DIR = path.join(DATA_DIR, 'subsets');
const DATA_MIN_FILE = path.join(DATA_DIR, 'data_min.json');
const MAPPING_FILE = path.join(DATA_DIR, 'moegirl2bgm.json');
const IMPORTANCE_FILE = path.join(DATA_DIR, 'importance.json');

// 目标文件路径
const PUBLIC_DATA_DIR = path.join(__dirname, '../public/data');

// 确保目标目录存在
if (!fs.existsSync(PUBLIC_DATA_DIR)) {
  fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
}

// 分组名称映射表
const SUBSET_DISPLAY_NAMES = {
  'questionaire1': 'XP统一检测全国甲卷',
  'questionaire2': 'XP统一检测全国乙卷',
  'bgm200': 'Bangumi top 200',
  'bgm2000': 'Bangumi top 2000',
  'bgm20000': 'Bangumi top 20000',
  'kyoani': '京阿尼合集',
  'touhou_new': '东方project新作',
  'touhou_old': '东方project旧作',
  'toaru': '魔禁(超炮)系列',
  'arknights': '明日方舟',
  'genshin': '原神',
  'honkai3': '崩坏3',
  'honkai_starrail': '崩坏：星穹铁道',
  'zzz': '绝区零',
  'wuthering_waves': '鸣潮',
  'snowbreak': '尘白禁区',
  'onmyoji': '阴阳师',
  'fate': 'Fate系列',
  'jojo': 'JOJO系列',
  'naruto': '火影忍者',
  'bleach': '死神(BLEACH)',
  'madoka': '魔法少女小圆',
  'AOT': '进击的巨人',
  'jujutsu': '咒术回战',
  'lovelive': 'LoveLive!系列',
  'bangdream': 'BanG Dream!系列',
  'derby': '赛马娘',
  'kancolle': '舰队Collection',
  'kanR': '战舰少女',
  'azur_lane': '碧蓝航线',
  'blue_archive': '蔚蓝档案',
  'idolmaster': '偶像大师系列',
  'ES': '偶像梦幻祭',
  'PCR': '公主连结Re:Dive',
  'housamo': '炼金工房系列',
  'danganronpa': '弹丸论破',
  'persona': '女神异闻录系列',
  'atelier': '炼金工房系列',
  'conan': '名侦探柯南',
  'girls_frontline': '少女前线',
  'gundam': '高达系列',
  'GUP': '少女与战车',
  'kamen_rider': '假面骑士系列',
  'key3': 'Key社三部曲',
  'lol': '英雄联盟',
  'pokemon_char': '宝可梦系列角色',
  'pokemon': '宝可梦',
  'pony': '彩虹小马',
  'vocaloid': 'VOCALOID',
  'RWBY': 'RWBY',
  'revue': '少女☆歌剧',
  'touhou': '东方Project',
  'fate_grand_order': 'Fate/Grand Order',
  'kantai_collection': '舰队Collection',
  'idolmaster': '偶像大师',
  'love_live': 'Love Live!',
  'bang_dream': 'BanG Dream!',
  'uma_musume': '赛马娘',
  'hololive': 'Hololive',
  'nijisanji': 'Nijisanji',
  'virtual_youtuber': '虚拟YouTuber',
  'anime': '动画',
  'game': '游戏',
  'manga': '漫画',
  'novel': '小说',
  'vtuber': '虚拟主播',
  'doujin': '同人',
  'other': '其他'
};

// 性别映射
const GENDER_TYPES = {
  0: '男性',
  1: '女性',
  2: '无性别/未知'
};

// 获取子集的显示名称
function getSubsetDisplayName(id) {
  // 首先检查映射表中是否有对应的中文名称
  if (SUBSET_DISPLAY_NAMES[id]) {
    return SUBSET_DISPLAY_NAMES[id];
  }
  
  // 处理一些特殊情况和格式化
  // 如果是类似 'abc_def' 的格式，转换为 'Abc Def'
  if (id.includes('_')) {
    return id.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // 如果只有一个单词，首字母大写
  return id.charAt(0).toUpperCase() + id.slice(1);
}

// 读取并处理数据
try {
  const rawData = fs.readFileSync(DATA_MIN_FILE, 'utf8');
  console.log(`已读取 data_min.json, 大小: ${(rawData.length / 1024 / 1024).toFixed(2)}MB`);
  
  const raw = JSON.parse(rawData);
  const char_index = raw.char_index || [];
  const attr_index = raw.attr_index || [];
  const char2attr = raw.char2attr || [];
  const attr2article = raw.attr2article || [];
  const gender_info = raw.gender_info || [];
  
  if (!Array.isArray(char_index) || !Array.isArray(attr_index) || !Array.isArray(char2attr)) {
    throw new Error('data_min.json 中未找到必要的数据结构');
  }
  
  console.log(`解析 data_min.json 数据: char_index=${char_index.length}, attr_index=${attr_index.length}, char2attr=${char2attr.length}, gender_info=${gender_info.length}`);
  
  // 加载重要性数据
  const importanceData = JSON.parse(fs.readFileSync(IMPORTANCE_FILE, 'utf8'));
  console.log('已加载萌属性重要性数据，共', Object.keys(importanceData).length, '个属性');

  // 为萌属性生成萌娘百科链接
  const traitLinks = {};
  
  // 函数：获取萌属性的萌娘百科链接
  function getTraitLink(attrId, attrName) {
    // 如果有attr2article数据，优先使用
    if (Array.isArray(attr2article) && attr2article[attrId]) {
      const articlePath = attr2article[attrId];
      if (articlePath === "") {
        // 如果路径为空，使用属性名称作为路径
        return encodeURIComponent(attrName);
      }
      return encodeURIComponent(articlePath);
    }
    // 默认使用属性名称作为链接
    return encodeURIComponent(attrName);
  }

  function sanitizeName(name) {
    if (!name) return name;
    // 去掉首尾双引号和首尾空白，并进行 NFC 规范化
    let n = name;
    if (n.startsWith('"') && n.endsWith('"')) {
      n = n.slice(1, -1);
    }
    return n.trim().normalize('NFC');
  }

  // 从原始数据中提取角色萌属性
  const extractTraits = (charId) => {
    if (!charId || charId < 0 || charId >= char2attr.length) return {};
    
    const traits = {};
    const attrIds = char2attr[charId];
    
    if (Array.isArray(attrIds)) {
      attrIds.forEach(attrId => {
        if (attrId >= 0 && attrId < attr_index.length) {
          const attrName = attr_index[attrId];
          if (importanceData[attrName] !== undefined) {
            // 使用固定值 1.0 作为属性值，可以根据需要调整
            traits[attrName] = 1.0;
            
            // 添加萌属性链接到traitLinks
            if (!traitLinks[attrName]) {
              traitLinks[attrName] = getTraitLink(attrId, attrName);
            }
          }
        }
      });
    }
    
    return traits;
  };

  // 获取角色性别
  const getCharacterGender = (charId) => {
    if (!Array.isArray(gender_info) || charId < 0 || charId >= gender_info.length) {
      return 2; // 默认为未知性别
    }
    
    const gender = gender_info[charId];
    // 标准化性别值: 0=男性, 1=女性, 2=未知
    return (gender === 0 || gender === 1) ? gender : 2;
  };

  // 统计各性别角色数量
  const genderCounts = {0: 0, 1: 0, 2: 0};

  const charactersData = {};
  char_index.forEach((name, index) => {
    name = sanitizeName(name);
    const traits = extractTraits(index);
    const gender = getCharacterGender(index);
    
    // 统计性别数量
    genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    
    charactersData[name] = { 
      id: name, 
      name,
      traits: traits,
      gender: gender
    };
  });

  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'characters.json'), JSON.stringify(charactersData));
  console.log('已写入 characters.json, count =', Object.keys(charactersData).length);
  
  // 获取有萌属性的角色数量
  const charsWithTraits = Object.values(charactersData).filter(char => 
    char.traits && Object.keys(char.traits).length > 0
  );
  console.log('其中有萌属性的角色数量:', charsWithTraits.length);
  
  // 输出性别统计
  console.log('角色性别统计:');
  Object.entries(genderCounts).forEach(([gender, count]) => {
    console.log(`  ${GENDER_TYPES[gender]}: ${count}个角色`);
  });

  const mappingRaw = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  const mapping = {};
  Object.entries(mappingRaw).forEach(([k, v]) => {
    mapping[sanitizeName(k)] = v;
  });
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'mapping.json'), JSON.stringify(mapping));

  // 写入萌属性链接数据
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'trait_links.json'), JSON.stringify(traitLinks));
  console.log('已写入 trait_links.json, 萌属性链接数量 =', Object.keys(traitLinks).length);

  // 写入性别类型数据
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'gender_types.json'), JSON.stringify(GENDER_TYPES));
  console.log('已写入 gender_types.json');

  const subsets = {};
  fs.readdirSync(SUBSETS_DIR).forEach(file => {
    if (!file.endsWith('_subset.json')) return;
    const id = path.basename(file, '_subset.json');
    const listRaw = JSON.parse(fs.readFileSync(path.join(SUBSETS_DIR, file), 'utf8'));
    const list = Array.isArray(listRaw) ? listRaw.map(sanitizeName) : [];
    // 使用增强的分组名称处理函数
    subsets[id] = { 
      id: id,
      displayName: SUBSET_DISPLAY_NAMES[id] || id,
      characters: list,
      // 添加额外字段以便调试
      originalId: id,
      charactersCount: list.length 
    };
  });
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'subsets.json'), JSON.stringify(subsets));
  console.log('已写入 subsets.json, 分组数量 =', Object.keys(subsets).length);
  // 显示分组名称映射，用于调试
  console.log('分组名称映射:');
  Object.entries(subsets).forEach(([id, subset]) => {
    console.log(`  ${id} => ${subset.displayName} (${subset.characters.length}个角色)`);
  });

  // 同时写入萌属性重要性数据以供前端使用
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'importance.json'), JSON.stringify(importanceData));
  console.log('已写入 importance.json, 萌属性数量 =', Object.keys(importanceData).length);

  console.log('数据准备完成');
} catch (e) {
  console.error('prepare-data 失败:', e);
  process.exit(1);
} 