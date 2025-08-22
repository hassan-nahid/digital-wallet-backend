import AppError from "../../errorHelpers/AppError";
import { IsActive, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import httpStatus from "http-status-codes";
import bcryptjs from "bcryptjs";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";

// Create User
const createUser = async (payload: Partial<IUser>) => {
    const { email, password, ...rest } = payload;
    const isUserExist = await User.findOne({ email });

    if (isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
    }

    const hashedPassword = await bcryptjs.hash(password as string, Number(envVars.BCRYPT_SALT_ROUND));

    const user = await User.create({
        email,
        password: hashedPassword,
        ...rest,
    });

    const userWithoutPassword = await User.findById(user._id).select('-password');
    return userWithoutPassword;
};

// Get All Users 
const getAllUsers = async (query: any) => {
    const {
        search,
        role,
        isActive,
        isAgentApproved,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
    } = query;

    // Build filter object
    const filter: any = {};

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
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with filters, sorting, and pagination
    const users = await User.find(filter)
        .select("-password")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
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
};

// Get Single User by ID
const getSingleUser = async (id: string) => {
    const user = await User.findById(id).select("-password");
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }
    return user;
};

// Get Current User Profile (me)
const getMe = async (userId: string) => {
    const user = await User.findById(userId).select("-password");
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }
    return user;
};

// Update User
const updateUser = async (userId: string, payload: Partial<IUser>, decodedToken: JwtPayload) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
    }

    // User or Agent can only update their own profile
    if (decodedToken.role === Role.USER || decodedToken.role === Role.AGENT) {
        if (userId !== decodedToken.userId) {
            throw new AppError(401, "You are not authorized to update others' profile");
        }

        if (payload.role || payload.isActive) {
            throw new AppError(httpStatus.FORBIDDEN, "You can't update role or isActive");
        }
    }



    const updatedUser = await User.findByIdAndUpdate(userId, payload, { new: true }).select('-password');

    if (!updatedUser) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found after update");
    }

    return updatedUser;
};

const makeUserAgent = async (userId: string) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.isActive === IsActive.BLOCKED || user.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.FORBIDDEN, `User is ${user.isActive.toLowerCase()}`);
    }
    if(!user.phone) {
        throw new AppError(httpStatus.BAD_REQUEST, "User must have a phone number to become an agent");
    }

    if (!user.nid) {
        throw new AppError(httpStatus.BAD_REQUEST, "User must have a national ID to become an agent");
    }

    if (!user.address) {
        throw new AppError(httpStatus.BAD_REQUEST, "User must have an address to become an agent");
    }
    if (user.role === Role.ADMIN) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is already an admin");
    }

    if (user.role === Role.AGENT) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is already an agent");
    }

    user.role = Role.AGENT;
    user.isAgentApproved = true; 

    await user.save();

    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
};

const suspendAgent = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== Role.AGENT) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not an agent");
  }

  user.isAgentApproved = false;
  await user.save();

  const { password: _, ...userWithoutPassword } = user.toObject();
  return userWithoutPassword;
};
const searchUserByEmail = async (email: any) => {
    if (!email || typeof email !== 'string') {
        return { user: null, error: "Email query parameter is required", statusCode: 400 };
    }
    const user = await User.findOne({ email, role: Role.USER }).select('-password -isAgentApproved -nid -isActive -createdAt -updatedAt');
    if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "User not found or not a regular user");
  }

  return user;
    
};
const searchAgentByEmail = async (email: any) => {
    if (!email || typeof email !== 'string') {
        return { user: null, error: "Email query parameter is required", statusCode: 400 };
    }
    const user = await User.findOne({ email, role: Role.AGENT }).select('-password -isAgentApproved -nid -isActive -createdAt -updatedAt');
    if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "User not found or not a regular user");
  }

  return user;
    
};


export const UserServices = {
    createUser,
    getAllUsers,
    getSingleUser,
    getMe,
    updateUser,
    makeUserAgent,
    suspendAgent,
    searchUserByEmail,
    searchAgentByEmail
};
