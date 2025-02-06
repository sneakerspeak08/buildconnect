import type { NextRequest } from "next/server"
import dbConnect from "@/lib/mongodb"
import Project from "@/models/Project"

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId")

  if (!userId) {
    return new Response("User ID is required", { status: 400 })
  }

  await dbConnect()

  const responseStream = new TransformStream()
  const writer = responseStream.writable.getWriter()
  const encoder = new TextEncoder()

  const sendEvent = async () => {
    const projects = await Project.find({ userId: userId })

    await writer.write(encoder.encode(`data: ${JSON.stringify(projects)}\n\n`))
  }

  // Send initial data
  await sendEvent()

  // Set up interval to send updates every 5 seconds
  const interval = setInterval(sendEvent, 5000)

  req.signal.addEventListener("abort", () => {
    clearInterval(interval)
    writer.close()
  })

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

