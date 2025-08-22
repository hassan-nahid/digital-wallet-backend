import { Router } from "express";
import { validateRequest } from "../../middleware/validationRequest";
import { validateQuery } from "../../middleware/validateQuery";
import { checkAuth } from "../../middleware/checkAuth";
import { addMoneyZodSchema, createTransactionZodSchema, getTransactionsQuerySchema } from "./transaction.validation";
import { Role } from "../user/user.interface";
import { TransactionControllers } from "./transaction.controller";

const router = Router();

router.get("/analytics", checkAuth(Role.ADMIN), TransactionControllers.getTransactionAnalytics);
router.post("/add-money", checkAuth(Role.USER),validateRequest(addMoneyZodSchema), TransactionControllers.addMoney)
router.post("/send-money", checkAuth(Role.USER),validateRequest(createTransactionZodSchema), TransactionControllers.sendMoney)
router.post("/cash-in", checkAuth(Role.AGENT,Role.ADMIN),validateRequest(createTransactionZodSchema), TransactionControllers.cashIn)
router.post("/cash-out", checkAuth(Role.USER,Role.AGENT),validateRequest(createTransactionZodSchema), TransactionControllers.cashOut)
router.post("/admin-withdraw", checkAuth(Role.ADMIN), TransactionControllers.adminWithdraw)
router.get("/my-transactions", checkAuth(...Object.values(Role)), TransactionControllers.getMyTransactions);
router.get("/all-transactions", 
    checkAuth(Role.ADMIN),
    validateQuery(getTransactionsQuerySchema), 
    TransactionControllers.getAllTransactions
);

export const TransactionRoutes = router;