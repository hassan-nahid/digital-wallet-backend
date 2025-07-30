"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_route_1 = require("../modules/auth/auth.route");
const user_route_1 = require("../modules/user/user.route");
const transaction_route_1 = require("../modules/transaction/transaction.route");
const wallet_route_1 = require("../modules/wallet/wallet.route");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_route_1.AuthRoutes
    },
    {
        path: "/user",
        route: user_route_1.UserRoutes
    },
    {
        path: "/transaction",
        route: transaction_route_1.TransactionRoutes
    },
    {
        path: "/wallet",
        route: wallet_route_1.WalletRoutes
    },
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
