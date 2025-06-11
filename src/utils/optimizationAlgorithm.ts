import { Order, Vehicle, Customer, Assignment } from '../types';

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Parse time string (HH:MM) to minutes from midnight
const parseTimeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Convert minutes from midnight to time string (HH:MM)
const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Check if two time ranges overlap
const timeRangesOverlap = (range1: string, range2: string): boolean => {
  const [start1Str, end1Str] = range1.split('-');
  const [start2Str, end2Str] = range2.split('-');
  
  const start1 = parseTimeToMinutes(start1Str);
  let end1 = parseTimeToMinutes(end1Str);
  const start2 = parseTimeToMinutes(start2Str);
  let end2 = parseTimeToMinutes(end2Str);
  
  // Handle overnight shifts (e.g., 15:00-00:00 means 15:00-24:00)
  if (end1 === 0) end1 = 24 * 60; // 00:00 means end of day
  if (end2 === 0) end2 = 24 * 60;
  
  return start1 < end2 && start2 < end1;
};

// Get the overlapping time window between vehicle and customer
const getOverlappingTimeWindow = (vehicleHours: string, customerHours: string): { start: number; end: number } | null => {
  const [vStartStr, vEndStr] = vehicleHours.split('-');
  const [cStartStr, cEndStr] = customerHours.split('-');
  
  const vStart = parseTimeToMinutes(vStartStr);
  let vEnd = parseTimeToMinutes(vEndStr);
  const cStart = parseTimeToMinutes(cStartStr);
  let cEnd = parseTimeToMinutes(cEndStr);
  
  // Handle overnight shifts
  if (vEnd === 0) vEnd = 24 * 60;
  if (cEnd === 0) cEnd = 24 * 60;
  
  const overlapStart = Math.max(vStart, cStart);
  const overlapEnd = Math.min(vEnd, cEnd);
  
  if (overlapStart < overlapEnd) {
    return { start: overlapStart, end: overlapEnd };
  }
  
  return null; // No overlap
};

// Calculate the center point of a cluster of locations
const calculateClusterCenter = (locations: { lat: number; lng: number }[]): { lat: number; lng: number } => {
  const sum = locations.reduce(
    (acc, loc) => ({
      lat: acc.lat + loc.lat,
      lng: acc.lng + loc.lng
    }),
    { lat: 0, lng: 0 }
  );
  
  return {
    lat: sum.lat / locations.length,
    lng: sum.lng / locations.length
  };
};

// Group nearby delivery locations using k-means clustering
const clusterDeliveryLocations = (
  orders: Order[],
  customers: Customer[],
  numClusters: number
): Order[][] => {
  // Get customer locations for orders
  const orderLocations = orders.map(order => {
    const customer = customers.find(c => c.id === order.customerId);
    return {
      order,
      location: customer ? customer.location : { lat: 0, lng: 0 }
    };
  });

  // Initialize clusters with random centroids
  let clusters = Array.from({ length: numClusters }, () => ({
    centroid: orderLocations[Math.floor(Math.random() * orderLocations.length)].location,
    orders: []
  }));

  let changed = true;
  const maxIterations = 100;
  let iteration = 0;

  while (changed && iteration < maxIterations) {
    changed = false;
    iteration++;

    // Reset cluster orders
    clusters = clusters.map(cluster => ({ ...cluster, orders: [] }));

    // Assign orders to nearest centroid
    orderLocations.forEach(({ order, location }) => {
      let minDistance = Infinity;
      let nearestClusterIndex = 0;

      clusters.forEach((cluster, index) => {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          cluster.centroid.lat,
          cluster.centroid.lng
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestClusterIndex = index;
        }
      });

      clusters[nearestClusterIndex].orders.push(order);
    });

    // Recalculate centroids
    clusters.forEach((cluster, index) => {
      if (cluster.orders.length > 0) {
        const locations = cluster.orders.map(order => {
          const customer = customers.find(c => c.id === order.customerId);
          return customer ? customer.location : { lat: 0, lng: 0 };
        });

        const newCentroid = calculateClusterCenter(locations);

        if (
          newCentroid.lat !== cluster.centroid.lat ||
          newCentroid.lng !== cluster.centroid.lng
        ) {
          changed = true;
          clusters[index].centroid = newCentroid;
        }
      }
    });
  }

  return clusters.map(cluster => cluster.orders).filter(orders => orders.length > 0);
};

// Optimize route using 2-opt algorithm for TSP with time constraints
const optimizeRouteWithTwoOpt = (
  vehicle: Vehicle,
  orders: Order[],
  customers: Customer[]
): {
  orderedIds: string[];
  totalDistance: number;
  totalWaitingTime: number;
  canCompleteInWorkingHours: boolean;
} => {
  if (orders.length === 0) {
    return { 
      orderedIds: [], 
      totalDistance: 0, 
      totalWaitingTime: 0,
      canCompleteInWorkingHours: true 
    };
  }

  // Filter orders that can be delivered within overlapping time windows
  const validOrders = orders.filter(order => {
    const customer = customers.find(c => c.id === order.customerId);
    if (!customer) return false;
    
    const overlap = getOverlappingTimeWindow(
      vehicle.workingHours || '09:00-17:00',
      customer.acceptanceHours || '09:00-17:00'
    );
    
    return overlap !== null;
  });

  if (validOrders.length === 0) {
    return { 
      orderedIds: [], 
      totalDistance: 0, 
      totalWaitingTime: 0,
      canCompleteInWorkingHours: false 
    };
  }

  // Create initial route
  const route = [...validOrders];
  let improved = true;
  let totalDistance = 0;
  let totalWaitingTime = 0;

  while (improved) {
    improved = false;
    const routeMetrics = calculateRouteMetrics(vehicle, route, customers);
    let bestDistance = routeMetrics.totalDistance;

    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        // Try reversing the segment between i and j
        const newRoute = [...route];
        const segment = newRoute.slice(i, j + 1).reverse();
        newRoute.splice(i, segment.length, ...segment);

        const newMetrics = calculateRouteMetrics(vehicle, newRoute, customers);

        if (newMetrics.totalDistance < bestDistance && newMetrics.canCompleteInWorkingHours) {
          route.splice(0, route.length, ...newRoute);
          bestDistance = newMetrics.totalDistance;
          totalDistance = newMetrics.totalDistance;
          totalWaitingTime = newMetrics.totalWaitingTime;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
    
    if (!improved) {
      const finalMetrics = calculateRouteMetrics(vehicle, route, customers);
      totalDistance = finalMetrics.totalDistance;
      totalWaitingTime = finalMetrics.totalWaitingTime;
    }
  }

  const finalMetrics = calculateRouteMetrics(vehicle, route, customers);

  return {
    orderedIds: route.map(order => order.id),
    totalDistance,
    totalWaitingTime,
    canCompleteInWorkingHours: finalMetrics.canCompleteInWorkingHours
  };
};

const calculateRouteMetrics = (
  vehicle: Vehicle,
  route: Order[],
  customers: Customer[]
): {
  totalDistance: number;
  totalWaitingTime: number;
  canCompleteInWorkingHours: boolean;
} => {
  let totalDistance = 0;
  let totalWaitingTime = 0;
  let currentLat = vehicle.currentLocation.lat;
  let currentLng = vehicle.currentLocation.lng;
  
  // Parse vehicle working hours
  const [vStartStr, vEndStr] = (vehicle.workingHours || '09:00-17:00').split('-');
  const workStart = parseTimeToMinutes(vStartStr);
  let workEnd = parseTimeToMinutes(vEndStr);
  if (workEnd === 0) workEnd = 24 * 60; // Handle overnight shifts
  
  let currentTime = workStart; // Start at beginning of work shift
  
  route.forEach(order => {
    const customer = customers.find(c => c.id === order.customerId);
    if (customer) {
      // Calculate travel distance and time
      const distance = calculateDistance(
        currentLat,
        currentLng,
        customer.location.lat,
        customer.location.lng
      );
      
      totalDistance += distance;
      
      // Travel time (assuming 30 km/h average speed)
      const travelTime = (distance / 30) * 60; // minutes
      currentTime += travelTime;
      
      // Add customer waiting time
      const waitingTime = customer.waitingTime || 5;
      totalWaitingTime += waitingTime;
      currentTime += waitingTime;
      
      // Update current position
      currentLat = customer.location.lat;
      currentLng = customer.location.lng;
    }
  });

  // Check if route can be completed within working hours
  const canCompleteInWorkingHours = currentTime <= workEnd;

  return {
    totalDistance,
    totalWaitingTime,
    canCompleteInWorkingHours
  };
};

// Main optimization function
export const optimizeDeliveries = (
  orders: Order[],
  vehicles: Vehicle[],
  customers: Customer[]
): Assignment[] => {
  // Filter for only pending orders
  const pendingOrders = orders.filter(order => order.status === 'pending');
  
  // Filter for only available vehicles
  const availableVehicles = vehicles.filter(vehicle => vehicle.available);
  
  if (pendingOrders.length === 0 || availableVehicles.length === 0) {
    return [];
  }

  // Cluster orders based on location proximity
  const numClusters = Math.min(availableVehicles.length, Math.ceil(pendingOrders.length / 3));
  const orderClusters = clusterDeliveryLocations(pendingOrders, customers, numClusters);

  const assignments: Assignment[] = [];
  let clusterIndex = 0;

  // Sort vehicles by capacity (descending) and working hours compatibility
  const sortedVehicles = [...availableVehicles].sort((a, b) => {
    // First sort by capacity
    const capacityDiff = b.maxWeight - a.maxWeight;
    if (capacityDiff !== 0) return capacityDiff;
    
    // Then by working hours duration (longer shifts preferred)
    const [aStartStr, aEndStr] = (a.workingHours || '09:00-17:00').split('-');
    const [bStartStr, bEndStr] = (b.workingHours || '09:00-17:00').split('-');
    
    const aDuration = parseTimeToMinutes(aEndStr) - parseTimeToMinutes(aStartStr);
    const bDuration = parseTimeToMinutes(bEndStr) - parseTimeToMinutes(bStartStr);
    
    return bDuration - aDuration;
  });

  // Assign clusters to vehicles
  sortedVehicles.forEach(vehicle => {
    if (clusterIndex >= orderClusters.length) return;

    const clusterOrders = orderClusters[clusterIndex];
    const vehicleOrders: Order[] = [];
    let remainingWeight = vehicle.maxWeight;
    let remainingVolume = vehicle.maxVolume;

    // Filter orders that can be delivered within time constraints
    const timeCompatibleOrders = clusterOrders.filter(order => {
      const customer = customers.find(c => c.id === order.customerId);
      if (!customer) return false;
      
      return timeRangesOverlap(
        vehicle.workingHours || '09:00-17:00',
        customer.acceptanceHours || '09:00-17:00'
      );
    });

    // Sort by weight/volume ratio for better packing
    const sortedClusterOrders = [...timeCompatibleOrders].sort((a, b) => 
      (b.weight / b.volume) - (a.weight / a.volume)
    );

    // Try to fill the vehicle optimally
    sortedClusterOrders.forEach(order => {
      if (order.weight <= remainingWeight && order.volume <= remainingVolume) {
        vehicleOrders.push(order);
        remainingWeight -= order.weight;
        remainingVolume -= order.volume;
      }
    });

    if (vehicleOrders.length > 0) {
      // Optimize the route for this vehicle with time constraints
      const routeResult = optimizeRouteWithTwoOpt(vehicle, vehicleOrders, customers);

      if (routeResult.canCompleteInWorkingHours && routeResult.orderedIds.length > 0) {
        // Calculate total time including travel, waiting, and loading
        const travelTime = (routeResult.totalDistance / 30) * 60; // 30 km/h average speed
        const loadingTime = vehicleOrders.length * 5; // 5 minutes per stop for loading
        const totalTime = travelTime + routeResult.totalWaitingTime + loadingTime;

        // Calculate working time window
        const [startStr, endStr] = (vehicle.workingHours || '09:00-17:00').split('-');
        const workStart = parseTimeToMinutes(startStr);
        let workEnd = parseTimeToMinutes(endStr);
        if (workEnd === 0) workEnd = 24 * 60;

        const scheduledStartTime = new Date();
        scheduledStartTime.setHours(Math.floor(workStart / 60), workStart % 60, 0, 0);
        
        const scheduledEndTime = new Date(scheduledStartTime.getTime() + totalTime * 60000);

        assignments.push({
          vehicleId: vehicle.id,
          orderIds: routeResult.orderedIds,
          totalWeight: vehicle.maxWeight - remainingWeight,
          totalVolume: vehicle.maxVolume - remainingVolume,
          estimatedDistance: routeResult.totalDistance,
          estimatedTime: totalTime,
          totalWaitingTime: routeResult.totalWaitingTime,
          scheduledStartTime: scheduledStartTime.toISOString(),
          scheduledEndTime: scheduledEndTime.toISOString()
        });
      }
    }

    clusterIndex++;
  });

  return assignments;
};