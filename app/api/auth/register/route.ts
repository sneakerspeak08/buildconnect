import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(req: NextRequest) {
  try {
    console.log("Attempting to connect to MongoDB...")
    await dbConnect()
    console.log("Successfully connected to MongoDB")

    const body = await req.json()
    const { email, password, name, userType } = body

    console.log("Checking if user already exists...")
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log("User already exists")
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    console.log("Hashing password...")
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log("Creating new user...")
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      userType,
    })

    console.log("User created successfully")
    const { password: _, ...userWithoutPassword } = user.toObject()

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Error creating user", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

