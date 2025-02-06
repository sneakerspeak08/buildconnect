import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await dbConnect()

  try {
    const contractors = await User.find({
      userType: { $in: ["contractor", "builder"] },
    }).select("-password")

    return NextResponse.json(contractors)
  } catch (error) {
    console.error("Failed to fetch contractors:", error)
    return NextResponse.json({ error: "Failed to fetch contractors" }, { status: 500 })
  }
}

