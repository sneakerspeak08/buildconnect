import mongoose, { type Document, type Model } from "mongoose"

export interface IUser extends Document {
  name?: string
  email: string
  password: string
  userType: "buyer" | "builder" | "contractor"
  image?: string
}

const UserSchema = new mongoose.Schema<IUser>({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    enum: ["buyer", "builder", "contractor"],
    required: true,
  },
  image: String,
})

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User

