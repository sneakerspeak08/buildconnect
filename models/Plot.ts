import mongoose from "mongoose"

const PlotSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    zoning: {
      type: String,
      required: true,
      enum: ["Residential", "Commercial", "Mixed-Use", "Industrial"],
    },
    utilities: [
      {
        type: String,
        enum: ["Water", "Electricity", "Sewer", "Gas"],
      },
    ],
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Plot || mongoose.model("Plot", PlotSchema)

