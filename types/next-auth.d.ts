import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      userType: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    userType: string
  }
}

