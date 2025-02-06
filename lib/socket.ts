import type { Server as HTTPServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import type { NextApiRequest } from "next"
import { getSession } from "next-auth/react"

export const initSocket = (server: HTTPServer) => {
  const io = new SocketIOServer(server)

  io.use(async (socket, next) => {
    const session = await getSession({ req: socket.request as NextApiRequest })
    if (session) {
      socket.data.user = session.user
      next()
    } else {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.data.user.id)

    socket.on("join_room", (roomId) => {
      socket.join(roomId)
    })

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId)
    })

    socket.on("send_message", (data) => {
      io.to(data.roomId).emit("receive_message", {
        ...data,
        sender: socket.data.user.id,
      })
    })

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.data.user.id)
    })
  })

  return io
}

