import { Role, Status } from "@prisma/client"
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      role: Role
      status: Status
    }
  }

  interface User {
    id: string
    email: string
    role: Role
    status: Status
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    role: Role
    status: Status
  }
}