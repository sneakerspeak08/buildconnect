"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Contractor {
  _id: string
  name: string
  email: string
  userType: string
}

export default function ContractorSearch() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [filteredContractors, setFilteredContractors] = useState<Contractor[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    const fetchContractors = async () => {
      try {
        const response = await fetch("/api/contractors")
        if (response.status === 401) {
          router.push("/login")
          return
        }
        if (!response.ok) {
          throw new Error("Failed to fetch contractors")
        }
        const data = await response.json()
        setContractors(data)
        setFilteredContractors(data)
      } catch (err) {
        setError("An error occurred while fetching contractors.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchContractors()
    }
  }, [status, router])

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const filtered = contractors.filter(
      (contractor) =>
        contractor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractor.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredContractors(filtered)
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find Contractors</h1>
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit">Search</Button>
        </div>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContractors.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">No contractors found</p>
        ) : (
          filteredContractors.map((contractor) => (
            <div key={contractor._id} className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">{contractor.name}</h2>
              <p className="text-gray-600 mb-2">Type: {contractor.userType}</p>
              <p className="text-gray-600 mb-4">Email: {contractor.email}</p>
              <Button>Contact</Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

