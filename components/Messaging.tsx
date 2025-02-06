import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import io, { type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  sender: string
  content: string
  timestamp: number
}

interface MessagingProps {
  roomId: string
}

export function Messaging({ roomId }: MessagingProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const { data: session } = useSession()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    socketRef.current = io()

    socketRef.current.emit("join_room", roomId)

    socketRef.current.on("receive_message", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message])
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave_room", roomId)
        socketRef.current.disconnect()
      }
    }
  }, [roomId])

  const sendMessage = () => {
    if (inputMessage.trim() && socketRef.current) {
      const messageData = {
        roomId,
        content: inputMessage,
        sender: session?.user?.id,
        timestamp: Date.now(),
      }
      socketRef.current.emit("send_message", messageData)
      setInputMessage("")
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg ${message.sender === session?.user?.id ? "bg-blue-100 ml-auto" : "bg-gray-100"}`}
          >
            <p>{message.content}</p>
            <small>{new Date(message.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </div>
  )
}

