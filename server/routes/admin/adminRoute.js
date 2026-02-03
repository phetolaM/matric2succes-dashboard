import express from "express";
import {
    adminLogin,
    sendResetCode,
    verifyResetCode,
} from "../../controllers/adminLogin/adminLoginController.js";

const adminRouter = express.Router();

adminRouter.post("/", adminLogin);
adminRouter.post("/send-reset-code", sendResetCode);
adminRouter.post("/verify-reset-code", verifyResetCode);

export default adminRouter;
