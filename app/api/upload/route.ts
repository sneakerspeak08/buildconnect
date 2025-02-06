import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { IncomingForm } from "formidable"
import fs from "fs/promises"
import path from "path"

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const form = new IncomingForm()

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(NextResponse.json({ error: "Failed to parse form" }, { status: 500 }))
        return
      }

      const file = files.file[0]
      const fileName = `${Date.now()}-${file.originalFilename}`
      const uploadDir = path.join(process.cwd(), "public", "uploads")

      try {
        await fs.mkdir(uploadDir, { recursive: true })
        await fs.copyFile(file.filepath, path.join(uploadDir, fileName))
        resolve(NextResponse.json({ fileName }, { status: 200 }))
      } catch (error) {
        reject(NextResponse.json({ error: "Failed to save file" }, { status: 500 }))
      }
    })
  })
}

