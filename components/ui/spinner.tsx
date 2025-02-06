import { CircularProgress } from "@mui/material"

export const Spinner = ({ size = "lg" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  }

  return <CircularProgress size={sizeMap[size]} />
}

