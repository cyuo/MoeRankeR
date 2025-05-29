import mongoose, { Schema, Document } from 'mongoose';
// import { ITrait } from './Trait'; // 如果 Trait 模型在同一个目录

// Character 接口定义，对应 Characters 表
export interface ICharacter extends Document {
  name: string;
  gender?: number; // 0: 未知, 1: 男, 2: 女, (根据你的实际定义)
  bangumi_id?: number;
  image_url?: string; // 对应 schema 中的 image_url
  // Mongoose 会自动添加 createdAt 和 updatedAt
  
  traits: mongoose.Types.ObjectId[]; // 关联到 Trait 模型
  subsets: mongoose.Types.ObjectId[]; // 关联到 Subset 模型
}

export const CharacterSchemaDefinition = {
  name: { type: String, required: true, unique: true, trim: true, index: true },
  gender: { type: Number },
  bangumi_id: { type: Number, index: true, sparse: true },
  image_url: { type: String, trim: true },
  traits: [{ type: Schema.Types.ObjectId, ref: 'Trait' }],
  subsets: [{ type: Schema.Types.ObjectId, ref: 'Subset' }]
};

export const CharacterSchemaInstance: Schema = new Schema(CharacterSchemaDefinition, { timestamps: true });

// CharacterSchema.index({ name: 1, bangumi_id: 1 }); // 复合索引示例

const Character = mongoose.models.Character || mongoose.model<ICharacter>('Character', CharacterSchemaInstance);

export default Character; 