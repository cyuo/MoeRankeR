"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterSchemaInstance = exports.CharacterSchemaDefinition = void 0;
var mongoose_1 = require("mongoose");
exports.CharacterSchemaDefinition = {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    gender: { type: Number },
    bangumi_id: { type: Number, index: true, sparse: true },
    image_url: { type: String, trim: true },
    traits: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Trait' }],
    subsets: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Subset' }]
};
exports.CharacterSchemaInstance = new mongoose_1.Schema(exports.CharacterSchemaDefinition, { timestamps: true });
// CharacterSchema.index({ name: 1, bangumi_id: 1 }); // 复合索引示例
var Character = mongoose_1.default.models.Character || mongoose_1.default.model('Character', exports.CharacterSchemaInstance);
exports.default = Character;
