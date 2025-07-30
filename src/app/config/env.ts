import dotenv from "dotenv"
dotenv.config()


interface EnvConfig {
    PORT: string,
    DB_URL: string,
    NODE_ENV: "development" | "production"
    BCRYPT_SALT_ROUND: string,
    JWT_ACCESS_EXPIRES: string,
    JWT_ACCESS_SECRET: string,
   
    JWT_REFRESH_SECRET: string,
    JWT_REFRESH_EXPIRES: string,
    EXPRESS_SESSION_SECRET: string,
    FRONTEND_URL: string,
  
}

const loadEnvVaribales = (): EnvConfig => {
    const requiredEnvVariables: string[] = ["PORT", "DB_URL", "NODE_ENV", "BCRYPT_SALT_ROUND", "JWT_ACCESS_EXPIRES",
        "JWT_ACCESS_SECRET",  "JWT_REFRESH_SECRET",
        "JWT_REFRESH_EXPIRES", "FRONTEND_URL","EXPRESS_SESSION_SECRET" 
    ]

    requiredEnvVariables.forEach(key => {
        if (!process.env[key]) {
            throw new Error(`Missing require environment variable ${key}`)
        }
    })
    return {
        PORT: process.env.PORT as string,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        DB_URL: process.env.DB_URL!,
        NODE_ENV: process.env.NODE_ENV as "development" | "production",
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
        JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
        JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES as string,
        BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
        EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
        FRONTEND_URL: process.env.FRONTEND_URL as string,
        
       
    }
}

export const envVars = loadEnvVaribales()