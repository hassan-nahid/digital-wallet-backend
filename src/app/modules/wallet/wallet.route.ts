import { Router } from "express";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middleware/checkAuth";
import { WalletControllers } from "./wallet.controller";
import { validateQuery } from "../../middleware/validateQuery";
import { getWalletsQuerySchema } from "./wallet.validation";

const router = Router();

router.get("/me", checkAuth(...Object.values(Role)), WalletControllers.getMyWallet);
router.get("/", 
    checkAuth(Role.ADMIN),
    validateQuery(getWalletsQuerySchema), 
    WalletControllers.getAllWallets
); 
router.patch("/block-wallet/:id", checkAuth(Role.ADMIN), WalletControllers.blockWallet);
router.patch("/unblock-wallet/:id", checkAuth(Role.ADMIN), WalletControllers.unblockWallet);



export const WalletRoutes = router;