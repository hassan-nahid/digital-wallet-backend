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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_interface_1 = require("./user.interface");
const user_model_1 = require("./user.model");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../../config/env");
// Create User (already done)
const createUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload, rest = __rest(payload, ["email", "password"]);
    const isUserExist = yield user_model_1.User.findOne({ email });
    if (isUserExist) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User Already Exist");
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, Number(env_1.envVars.BCRYPT_SALT_ROUND));
    const user = yield user_model_1.User.create(Object.assign({ email, password: hashedPassword }, rest));
    // Return user without password using select
    const userWithoutPassword = yield user_model_1.User.findById(user._id).select('-password');
    return userWithoutPassword;
});
// Get All Users (admin only) with sorting, filtering, and searching
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, role, isActive, isAgentApproved, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = query;
    // Build filter object
    const filter = {};
    // Search functionality (name, email, phone)
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }
    // Filter by role
    if (role) {
        filter.role = role;
    }
    // Filter by isActive status
    if (isActive) {
        filter.isActive = isActive;
    }
    // Filter by agent approval status
    if (isAgentApproved !== undefined) {
        filter.isAgentApproved = isAgentApproved === 'true';
    }
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    // Execute query with filters, sorting, and pagination
    const users = yield user_model_1.User.find(filter)
        .select("-password")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));
    // Get total count for pagination
    const totalUsers = yield user_model_1.User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));
    return {
        users,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalUsers,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
        }
    };
});
// Get Single User by ID
const getSingleUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(id).select("-password");
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    return user;
});
// Get Current User Profile (me)
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).select("-password");
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    return user;
});
// Update User
const updateUser = (userId, payload, decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User Not Found");
    }
    // User or Agent can only update their own profile
    if (decodedToken.role === user_interface_1.Role.USER || decodedToken.role === user_interface_1.Role.AGENT) {
        if (userId !== decodedToken.userId) {
            throw new AppError_1.default(401, "You are not authorized to update others' profile");
        }
        if (payload.role || payload.isActive) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You can't update role or isActive");
        }
    }
    const updatedUser = yield user_model_1.User.findByIdAndUpdate(userId, payload, { new: true }).select('-password');
    if (!updatedUser) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found after update");
    }
    return updatedUser;
});
const makeUserAgent = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (user.isActive === user_interface_1.IsActive.BLOCKED || user.isActive === user_interface_1.IsActive.INACTIVE) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, `User is ${user.isActive.toLowerCase()}`);
    }
    if (!user.phone) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User must have a phone number to become an agent");
    }
    if (!user.nid) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User must have a national ID to become an agent");
    }
    if (!user.address) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User must have an address to become an agent");
    }
    if (user.role === user_interface_1.Role.ADMIN) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is already an admin");
    }
    if (user.role === user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is already an agent");
    }
    user.role = user_interface_1.Role.AGENT;
    user.isAgentApproved = true;
    yield user.save();
    const _a = user.toObject(), { password: _ } = _a, userWithoutPassword = __rest(_a, ["password"]);
    return userWithoutPassword;
});
const suspendAgent = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    }
    if (user.role !== user_interface_1.Role.AGENT) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User is not an agent");
    }
    user.isAgentApproved = false;
    yield user.save();
    const _a = user.toObject(), { password: _ } = _a, userWithoutPassword = __rest(_a, ["password"]);
    return userWithoutPassword;
});
exports.UserServices = {
    createUser,
    getAllUsers,
    getSingleUser,
    getMe,
    updateUser,
    makeUserAgent,
    suspendAgent,
};
