import { Types } from "mongoose";

export enum Role {
    ADMIN = "ADMIN",
    USER = "USER",
    AGENT = "AGENT",
}

export enum IsActive{
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLOCKED = "BLOCKED"
}

export interface IUser {
    _id?: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    photo?: string;
    password: string;
    address: string;
    role: Role;
    isAgentApproved: boolean;
    nid: number;
    isActive: IsActive;
    
}