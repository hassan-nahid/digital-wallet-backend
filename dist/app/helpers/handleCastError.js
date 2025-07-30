"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCastError = void 0;
const handleCastError = (err) => {
    return {
        statusCode: 400,
        message: "Invalid Mongodb ObjectID. Please provide a valid Id"
    };
};
exports.handleCastError = handleCastError;
