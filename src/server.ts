/* eslint-disable no-console */
import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import { envVars } from './app/config/env';


let server: Server;


const startServer = async () => {
    try {

        await mongoose.connect(envVars.DB_URL)
        console.log("✅ Connected to DB")

        server = app.listen(envVars.PORT, () => {
            console.log(`Server is listening to port ${envVars.PORT}`)
        })
    } catch (error) {
        console.log(error)
    }
}

(async () => {
    await startServer()

})()
process.on("SIGTERM", () => {
    console.log("Sigterm Signal Recived... server shutting down..")
    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }
    process.exit(1)
})
process.on("SIGINT", () => {
    console.log("Sigint Signal Recived... server shutting down..")
    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }
    process.exit(1)
})
process.on("unhandledRejection", (error) => {
    console.log("Unhandled Rejection Detected... server shutting down..", error)
    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }
    process.exit(1)
})

process.on("uncaughtException", (error) => {
    console.log("Uncaught Exception Detected... server shutting down..", error)
    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }
    process.exit(1)
})



