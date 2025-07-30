import {  Router } from "express";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middleware/checkAuth";
import { AuthControllers } from "./auth.controller";

const router = Router()

router.post("/login", AuthControllers.credentialsLogin)
router.post("/refresh-token", AuthControllers.getNewAccessToken)
router.post("/logout", AuthControllers.logout)
router.post("/change-password", checkAuth(...Object.values(Role)), AuthControllers.changePassword)


export const AuthRoutes = router;