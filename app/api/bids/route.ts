import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import dbConnect from "@/lib/mongodb"
import Bid from "@/models/Bid"
import Project from "@/models/Project" // Import the Project model

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.userType !== "contractor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await dbConnect()

  try {
    const body = await req.json()
    const bid = new Bid({
      ...body,
      contractorId: session.user.id,
    })
    await bid.save()
    return NextResponse.json(bid, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create bid" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await dbConnect()

  try {
    let bids
    if (session.user.userType === "contractor") {
      bids = await Bid.find({ contractorId: session.user.id }).populate("projectId")
    } else {
      const projectIds = await Project.find({ userId: session.user.id }).distinct("_id")
      bids = await Bid.find({ projectId: { $in: projectIds } }).populate("contractorId")
    }
    return NextResponse.json(bids)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 })
  }
}

