import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middleware/validationRequest";
import { validateQuery } from "../../middleware/validateQuery";
import { createUserSchema, updateUserSchema, getUsersQuerySchema } from "./user.validation";
import { Role } from "./user.interface";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.post("/register", validateRequest(createUserSchema), UserController.createUser)
router.get("/all-users", checkAuth(Role.ADMIN), validateQuery(getUsersQuerySchema), UserController.getAllUsers)
router.get("/me", checkAuth(...Object.values(Role)), UserController.getMe)
router.get("/:id", checkAuth(Role.ADMIN), UserController.getSingleUser)
router.patch("/:id", validateRequest(updateUserSchema), checkAuth(...Object.values(Role)), UserController.updateUser)
router.patch(
  "/make-agent/:userId", checkAuth(Role.ADMIN), UserController.makeUserAgent);
router.patch("/agent-suspense/:userId", checkAuth(Role.ADMIN), UserController.suspendAgent);

export const UserRoutes = router;