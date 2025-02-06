"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const [userType, setUserType] = useState("buyer") // This would typically come from your auth state

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">My Projects</h3>
              <div className="mt-3">
                <Link href="/projects" passHref>
                  <Button>View Projects</Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Find Plots</h3>
              <div className="mt-3">
                <Link href="/plots" passHref>
                  <Button>Search Plots</Button>
                </Link>
              </div>
            </div>
          </div>
          {userType === "buyer" && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Find Contractors</h3>
                <div className="mt-3">
                  <Link href="/contractors" passHref>
                    <Button>Search Contractors</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
          {(userType === "builder" || userType === "contractor") && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">My Bids</h3>
                <div className="mt-3">
                  <Link href="/bids" passHref>
                    <Button>View Bids</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

