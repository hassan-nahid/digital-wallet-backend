"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const user_interface_1 = require("./user.interface");
const wallet_model_1 = require("../wallet/wallet.model");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    photo: { type: String, default: "" },
    password: { type: String, required: true },
    address: { type: String, required: true },
    role: { type: String, enum: Object.values(user_interface_1.Role), default: user_interface_1.Role.USER },
    isAgentApproved: { type: Boolean, default: false },
    nid: { type: Number, required: true, unique: true },
    isActive: { type: String, enum: Object.values(user_interface_1.IsActive), default: user_interface_1.IsActive.ACTIVE }
}, {
    timestamps: true,
    versionKey: false
});
// userSchema.pre("save", function (next) {
//     if (this.role === Role.AGENT) {
//         this.isAgentApproved = true;
//     }
//     next();
// });
userSchema.post("save", function (doc, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existingWallet = yield wallet_model_1.Wallet.findOne({ userId: doc._id });
            if (!existingWallet) {
                yield wallet_model_1.Wallet.create({
                    userId: doc._id,
                });
            }
            next();
        }
        catch (err) {
            next(err);
        }
    });
});
exports.User = (0, mongoose_1.model)("User", userSchema);
