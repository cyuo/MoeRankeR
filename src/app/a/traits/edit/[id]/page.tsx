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
import EditTraitClientForm from "./EditTraitClientForm";
import Trait from "@/models/Trait";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

interface PageProps {
  params: { id: string };
}

async function getTrait(
  id: string,
): Promise<(ITrait & { _id: string }) | null> {
  console.log(`[调试] 正在从数据库获取萌属性: ${id}`);
  
  try {
    // 直接从数据库获取数据
    await dbConnect();
    
    // 验证ID格式
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error(`[调试] 无效的ID格式: ${id}`);
      return null;
    }
    
    const trait = await Trait.findById(id).lean();
    
    if (!trait) {
      console.log('[调试] 数据库中未找到萌属性');
      return null;
    }
    
    console.log('[调试] 成功从数据库获取萌属性');
    return trait as (ITrait & { _id: string });
  } catch (error) {
    console.error('[调试] 数据库查询异常:', error);
    throw new Error('获取萌属性数据失败');
  }
}

export default async function EditTraitPage({ params }: PageProps) {
  const { user, session } = await validateRequest();
  if (!session) {
    redirect(`/u/login?redirectTo=/a/traits/edit/${params.id}`);
  }

  const trait = await getTrait(params.id);

  if (!trait) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          编辑萌属性
        </Typography>
        <Alert severity="error">未找到该萌属性</Alert>
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
