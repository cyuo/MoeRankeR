import mongoose, { Schema, Document } from 'mongoose';

// Subset 接口定义，对应 Subsets 表
export interface ISubset extends Document {
  slug: string;
  display_name: string;
  // description?: string; // 移除此字段
  // created_by?: string; // 移除此字段
  // Mongoose 会自动添加 createdAt 和 updatedAt
  characters: mongoose.Types.ObjectId[]; // 关联的角色
}

export const SubsetSchemaDefinition = {
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  display_name: { type: String, required: true, trim: true },
  // description: { type: String, trim: true }, // 移除此字段
  // created_by: { type: String }, // 移除此字段
  characters: [{ type: Schema.Types.ObjectId, ref: 'Character' }] // 关联到 Character 模型
};

export const SubsetSchemaInstance: Schema = new Schema(SubsetSchemaDefinition, { timestamps: true });

const Subset = mongoose.models.Subset || mongoose.model<ISubset>('Subset', SubsetSchemaInstance);

export default Subset; 