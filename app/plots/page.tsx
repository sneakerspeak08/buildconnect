"use client"

import { useState, useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapIcon, LayoutGrid } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import type { Feature, Point } from "geojson"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

if (!MAPBOX_TOKEN) {
  throw new Error("Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN environment variable")
}

mapboxgl.accessToken = MAPBOX_TOKEN

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12"

interface PlotProperties {
  id: string
  title: string
  price: string
  size: string
  address: string
  description: string
  city: string
  state: string
  zipCode: string
}

type PlotFeature = Feature<Point, PlotProperties>

export default function PlotSearch() {
  const [view, setView] = useState<"map" | "cards">("map")
  const [searchTerm, setSearchTerm] = useState("")
  const [properties, setProperties] = useState<PlotProperties[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    try {
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: [-98.5795, 39.8283],
        zoom: 3,
        minZoom: 2,
        maxZoom: 18,
      })

      map.current = newMap

      newMap.on("load", () => {
        if (!map.current) return

        map.current.addSource("plots", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        })

        map.current.addLayer({
          id: "plots-layer",
          type: "circle",
          source: "plots",
          paint: {
            "circle-radius": 8,
            "circle-color": "#4338ca",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        })

        setMapLoaded(true)
        loadAllProperties()
      })

      newMap.addControl(new mapboxgl.NavigationControl(), "top-right")
      newMap.addControl(new mapboxgl.FullscreenControl())

      // Setup popup handling
      newMap.on("click", "plots-layer", (e) => {
        if (!map.current || !e.features?.length) return

        const feature = e.features[0] as unknown as PlotFeature
        const coordinates = feature.geometry.coordinates.slice() as [number, number]
        const props = feature.properties

        if (!props) return

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="p-4">
              <h3 class="text-lg font-semibold mb-2">${props.title}</h3>
              <div class="space-y-1 text-sm">
                <p><span class="font-medium">Size:</span> ${props.size}</p>
                <p><span class="font-medium">Address:</span> ${props.address}</p>
                <p class="text-gray-600 mt-2">${props.description}</p>
                <p class="text-lg font-bold text-indigo-600 mt-2">${props.price}</p>
              </div>
            </div>
          `)
          .addTo(map.current)
      })

      newMap.on("mouseenter", "plots-layer", () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer"
      })

      newMap.on("mouseleave", "plots-layer", () => {
        if (map.current) map.current.getCanvas().style.cursor = ""
      })
    } catch (error) {
      console.error("Error initializing map:", error)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        setMapLoaded(false)
      }
    }
  }, [])

  const loadAllProperties = async () => {
    if (!map.current || !mapLoaded) return

    try {
      setIsLoading(true)
      const response = await fetch("/api/plots")
      const data = await response.json()

      if (!data.features) {
        throw new Error("Invalid GeoJSON data")
      }

      if (map.current.getSource("plots")) {
        ;(map.current.getSource("plots") as mapboxgl.GeoJSONSource).setData(data)
      }

      const plotProperties = data.features
        .filter((feature: PlotFeature) => feature.properties)
        .map((feature: PlotFeature) => feature.properties)

      setProperties(plotProperties)
    } catch (error) {
      console.error("Error loading properties:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    setIsLoading(true)

    try {
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase()
        const filteredProperties = properties.filter(
          (property) =>
            property.city.toLowerCase().includes(searchLower) || property.state.toLowerCase().includes(searchLower),
        )
        setProperties(filteredProperties)

        if (map.current) {
          map.current.setFilter("plots-layer", [
            "any",
            ["to-boolean", ["string-match", ["get", "city"], `(?i).*${debouncedSearch}.*`]],
            ["to-boolean", ["string-match", ["get", "state"], `(?i).*${debouncedSearch}.*`]],
          ])

          // Fit map to filtered results
          const filteredFeatures = map.current.queryRenderedFeatures({
            layers: ["plots-layer"],
          })

          if (filteredFeatures.length > 0) {
            const bounds = new mapboxgl.LngLatBounds()
            filteredFeatures.forEach((feature) => {
              if (feature.geometry.type === "Point") {
                bounds.extend(feature.geometry.coordinates as [number, number])
              }
            })
            map.current.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 1000 })
          }
        }
      } else {
        loadAllProperties()
      }
    } catch (error) {
      console.error("Error filtering properties:", error)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, mapLoaded, loadAllProperties]) // Added loadAllProperties to dependencies

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-2xl">
              <Input
                type="text"
                placeholder="Search by city or state (e.g., 'New York' or 'California')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10"
              />
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
              <Button
                type="button"
                variant={view === "map" ? "default" : "ghost"}
                size="sm"
                className="rounded-md"
                onClick={() => setView("map")}
              >
                <MapIcon className="h-4 w-4 mr-2" />
                Map
              </Button>
              <Button
                type="button"
                variant={view === "cards" ? "default" : "ghost"}
                size="sm"
                className="rounded-md"
                onClick={() => setView("cards")}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Cards
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {view === "map" ? (
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        ) : (
          <div className="container mx-auto px-4 py-6 overflow-auto h-full">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold">Available Plots</h1>
              <p className="text-muted-foreground">{properties.length} results</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium text-gray-900">Size:</span> {property.size}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Location:</span> {property.city}, {property.state}
                      </p>
                      <p className="line-clamp-2">{property.description}</p>
                    </div>
                    <p className="text-xl font-bold text-indigo-600 mt-4">{property.price}</p>
                  </div>
                </div>
              ))}
            </div>
            {properties.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 mt-8">
                No properties found. Try searching for a different location.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

