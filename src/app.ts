import cors from "cors"
import express, { Request, Response } from 'express';
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/noFound";
import { router } from "./app/routes";
import cookieParser from "cookie-parser";
import expressSession from "express-session";
import { envVars } from "./app/config/env";


const app = express();


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: "https://digital-wallet-frontend-one.vercel.app",
  credentials: true,
}));
// app.use(cors({
//   origin: "http://localhost:5173",
//   credentials: true,
// }));
app.use(cookieParser())
app.use(expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))


app.use("/api/v1", router)

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Welcome to the Digital Wallet system"
    })
})

app.use(globalErrorHandler)
app.use(notFound)

export default app