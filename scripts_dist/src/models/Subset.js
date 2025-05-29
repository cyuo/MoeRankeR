"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubsetSchemaInstance = exports.SubsetSchemaDefinition = void 0;
var mongoose_1 = require("mongoose");
exports.SubsetSchemaDefinition = {
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    display_name: { type: String, required: true, trim: true },
    // description: { type: String, trim: true }, // 移除此字段
    // created_by: { type: String }, // 移除此字段
    characters: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Character' }] // 关联到 Character 模型
};
exports.SubsetSchemaInstance = new mongoose_1.Schema(exports.SubsetSchemaDefinition, { timestamps: true });
var Subset = mongoose_1.default.models.Subset || mongoose_1.default.model('Subset', exports.SubsetSchemaInstance);
exports.default = Subset;
