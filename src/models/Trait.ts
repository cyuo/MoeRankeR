import mongoose, { Schema, Document } from 'mongoose';

export interface ITrait extends Document {
  name: string; // 特征名称，例如 "傲娇"
  importance?: number; // 重要性
  moegirl_link?: string; // 萌娘百科链接
}

// Define the schema structure separately for clarity and potential re-use
export const TraitSchemaDefinition = {
  name: { type: String, required: true, unique: true, trim: true },
  importance: { type: Number },
  moegirl_link: { type: String, trim: true },
};

export const TraitSchemaInstance: Schema = new Schema(TraitSchemaDefinition, { timestamps: true });

// Standard way to get the model, ensuring it's not recompiled during HMR (relevant for app, not script)
const Trait = mongoose.models.Trait || mongoose.model<ITrait>('Trait', TraitSchemaInstance);

export default Trait; 