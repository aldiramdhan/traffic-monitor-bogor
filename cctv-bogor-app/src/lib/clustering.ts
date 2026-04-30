import { CCTVLocation } from '@/types'

interface ClusterPoint {
  lat: number
  lon: number
  count: number
  cctvs: CCTVLocation[]
  id: string
}

export interface MarkerCluster {
  type: 'single' | 'cluster'
  data: CCTVLocation | ClusterPoint
}

/**
 * Calculate distance between two points in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Get clustering distance based on zoom level
 */
function getClusteringDistance(zoom: number): number {
  if (zoom >= 16) return 0 // No clustering at high zoom
  if (zoom >= 14) return 0.05 // 50 meters
  if (zoom >= 12) return 0.1 // 100 meters
  if (zoom >= 10) return 0.2 // 200 meters
  if (zoom >= 8) return 0.5 // 500 meters
  return 1.0 // 1 kilometer for very low zoom
}

/**
 * Cluster CCTV locations based on zoom level and distance
 */
export function clusterCCTVLocations(cctvs: CCTVLocation[], zoom: number): MarkerCluster[] {
  const clusteringDistance = getClusteringDistance(zoom)
  
  // If no clustering needed, return all as single markers
  if (clusteringDistance === 0) {
    return cctvs.map(cctv => ({
      type: 'single' as const,
      data: cctv
    }))
  }

  const clusters: MarkerCluster[] = []
  const processed = new Set<string>()

  for (const cctv of cctvs) {
    if (processed.has(cctv.id)) continue

    // Find nearby CCTVs within clustering distance
    const nearbyEverything = cctvs.filter(other => {
      if (processed.has(other.id) || other.id === cctv.id) return false
      const distance = calculateDistance(cctv.lat, cctv.lon, other.lat, other.lon)
      return distance <= clusteringDistance
    })

    if (nearbyEverything.length === 0) {
      // Single marker
      clusters.push({
        type: 'single',
        data: cctv
      })
      processed.add(cctv.id)
    } else {
      // Create cluster
      const allCCTVs = [cctv, ...nearbyEverything]
      
      // Calculate center point
      const centerLat = allCCTVs.reduce((sum, c) => sum + c.lat, 0) / allCCTVs.length
      const centerLon = allCCTVs.reduce((sum, c) => sum + c.lon, 0) / allCCTVs.length

      const clusterPoint: ClusterPoint = {
        lat: centerLat,
        lon: centerLon,
        count: allCCTVs.length,
        cctvs: allCCTVs,
        id: `cluster-${allCCTVs.map(c => c.id).join('-')}`
      }

      clusters.push({
        type: 'cluster',
        data: clusterPoint
      })

      // Mark all as processed
      allCCTVs.forEach(c => processed.add(c.id))
    }
  }

  return clusters
}

/**
 * Get cluster status summary
 */
export function getClusterStatus(cctvs: CCTVLocation[]): {
  online: number
  offline: number
  maintenance: number
} {
  return cctvs.reduce((acc, cctv) => {
    acc[cctv.status]++
    return acc
  }, { online: 0, offline: 0, maintenance: 0 })
}
