"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraitSchemaInstance = exports.TraitSchemaDefinition = void 0;
var mongoose_1 = require("mongoose");
// Define the schema structure separately for clarity and potential re-use
exports.TraitSchemaDefinition = {
    name: { type: String, required: true, unique: true, trim: true },
    importance: { type: Number },
    moegirl_link: { type: String, trim: true },
};
exports.TraitSchemaInstance = new mongoose_1.Schema(exports.TraitSchemaDefinition, { timestamps: true });
// Standard way to get the model, ensuring it's not recompiled during HMR (relevant for app, not script)
var Trait = mongoose_1.default.models.Trait || mongoose_1.default.model('Trait', exports.TraitSchemaInstance);
exports.default = Trait;
