import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.route";
import { TransactionRoutes } from "../modules/transaction/transaction.route";
import { WalletRoutes } from "../modules/wallet/wallet.route";


export const router = Router()

const moduleRoutes = [
    {
        path: "/auth",
        route: AuthRoutes
    },
    {
        path: "/user",
        route: UserRoutes
    },
    {
        path: "/transaction",
        route: TransactionRoutes
    },
    {
        path: "/wallet",
        route: WalletRoutes
    },
  
]


moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})