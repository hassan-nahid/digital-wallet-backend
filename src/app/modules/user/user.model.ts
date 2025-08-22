import { model, Schema } from "mongoose";
import { IsActive, IUser, Role } from "./user.interface";
import { Wallet } from "../wallet/wallet.model"; 

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    photo: { type: String, default: "" },
    password: { type: String, required: true },
    address: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), default: Role.USER },
    isAgentApproved: { type: Boolean, default: false },
    nid: { type: Number, required: true, unique: true },
    isActive: { type: String, enum: Object.values(IsActive), default: IsActive.ACTIVE }
}, {
    timestamps: true,
    versionKey: false
});


userSchema.pre("save", function (next) {
    if (this.role === Role.AGENT) {
        this.isAgentApproved = true;
    }
    next();
});

userSchema.post("save", async function (doc, next) {
    try {
        const existingWallet = await Wallet.findOne({ userId: doc._id });
        if (!existingWallet) {
            await Wallet.create({
                userId: doc._id,
            });
        }
        next();
    } catch (err: any) {
        next(err);
    }
});

export const User = model<IUser>("User", userSchema);
