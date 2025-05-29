import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import { ITrait } from "@/models/Trait";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Link from "next/link";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
// @ts-ignore - 忽略TypeScript导入错误
import EditTraitClientForm from "./EditTraitClientForm";
import Trait from "@/models/Trait";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

// 定义一个简化的特征接口，用于客户端数据传递
interface SimpleTrait {
  _id: string;
  name: string;
  importance?: number;
  moegirl_link?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PageProps {
  searchParams?: { id?: string };
}

async function getTrait(
  id: string,
): Promise<SimpleTrait | null> {
  console.log(`[调试] 正在从数据库获取萌属性: ${id}`);
  
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error(`[调试] 无效的ID格式: ${id}`);
      return null;
    }
    
    const trait = await Trait.findById(id).lean();
    
    if (!trait) {
      console.log('[调试] 数据库中未找到萌属性');
      return null;
    }
    
    const mongoTrait = trait as any;
    
    const serializedTrait: SimpleTrait = {
      _id: mongoTrait._id.toString(),
      name: mongoTrait.name,
      importance: mongoTrait.importance,
      moegirl_link: mongoTrait.moegirl_link,
      createdAt: mongoTrait.createdAt ? new Date(mongoTrait.createdAt).toISOString() : undefined,
      updatedAt: mongoTrait.updatedAt ? new Date(mongoTrait.updatedAt).toISOString() : undefined
    };
    
    console.log('[调试] 成功从数据库获取萌属性, 已序列化数据');
    return serializedTrait;
  } catch (error) {
    console.error('[调试] 数据库查询异常:', error);
    throw new Error('获取萌属性数据失败');
  }
}

export default async function EditTraitPage({ searchParams: initialSearchParams }: PageProps) {
  // 确保 searchParams 已"解析" （对于页面 props 通常是即时可用的）
  // 将其赋值给一个新常量，以便在整个函数中一致地使用它
  const searchParams = initialSearchParams;

  const { user, session } = await validateRequest();
  
  // 从 searchParams 中获取 id，并存储在一个变量中
  const currentId = searchParams?.id;

  if (!session) {
    // 在重定向URL中使用 currentId (如果存在)
    redirect(`/u/login?redirectTo=/a/traits/edit/id?id=${currentId || ''}`);
  }

  // 使用 currentId 进行后续检查和操作
  if (!currentId) {
    console.log('[调试] 缺少ID参数');
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          编辑萌属性
        </Typography>
        <Alert severity="error">缺少萌属性ID参数</Alert>
        <Button component={Link} href="/a/traits" sx={{ mt: 2 }}>
          返回萌属性列表
        </Button>
      </Container>
    );
  }
  
  console.log(`[调试] 处理ID: ${currentId}`);

  const trait = await getTrait(currentId);

  if (!trait) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          编辑萌属性
        </Typography>
        <Alert severity="error">未找到该萌属性 (ID: ${currentId})</Alert>
        <Button component={Link} href="/a/traits" sx={{ mt: 2 }}>
          返回萌属性列表
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          href="/a/traits"
          sx={{ mr: 2 }}
        >
          返回萌属性列表
        </Button>
        <Typography variant="h4" component="h1">
          编辑萌属性: {trait.name}
        </Typography>
      </Box>
      <Paper sx={{ p: 3 }}>
        <EditTraitClientForm trait={trait} />
      </Paper>
    </Container>
  );
} 