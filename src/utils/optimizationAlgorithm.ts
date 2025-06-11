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

// Optimize route using 2-opt algorithm for TSP
const optimizeRouteWithTwoOpt = (
  startLat: number,
  startLng: number,
  orders: Order[],
  customers: Customer[]
): {
  orderedIds: string[];
  totalDistance: number;
} => {
  if (orders.length === 0) {
    return { orderedIds: [], totalDistance: 0 };
  }

  // Create initial route
  const route = [...orders];
  let improved = true;
  let totalDistance = 0;

  while (improved) {
    improved = false;
    let bestDistance = calculateTotalRouteDistance(startLat, startLng, route, customers);

    for (let i = 0; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        // Try reversing the segment between i and j
        const newRoute = [...route];
        const segment = newRoute.slice(i, j + 1).reverse();
        newRoute.splice(i, segment.length, ...segment);

        const newDistance = calculateTotalRouteDistance(startLat, startLng, newRoute, customers);

        if (newDistance < bestDistance) {
          route.splice(0, route.length, ...newRoute);
          bestDistance = newDistance;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
    totalDistance = bestDistance;
  }

  return {
    orderedIds: route.map(order => order.id),
    totalDistance
  };
};

const calculateTotalRouteDistance = (
  startLat: number,
  startLng: number,
  route: Order[],
  customers: Customer[]
): number => {
  let totalDistance = 0;
  let currentLat = startLat;
  let currentLng = startLng;

  route.forEach(order => {
    const customer = customers.find(c => c.id === order.customerId);
    if (customer) {
      totalDistance += calculateDistance(
        currentLat,
        currentLng,
        customer.location.lat,
        customer.location.lng
      );
      currentLat = customer.location.lat;
      currentLng = customer.location.lng;
    }
  });

  return totalDistance;
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

  // Sort vehicles by capacity (descending)
  const sortedVehicles = [...availableVehicles].sort((a, b) => b.maxWeight - a.maxWeight);

  // Assign clusters to vehicles
  sortedVehicles.forEach(vehicle => {
    if (clusterIndex >= orderClusters.length) return;

    const clusterOrders = orderClusters[clusterIndex];
    const vehicleOrders: Order[] = [];
    let remainingWeight = vehicle.maxWeight;
    let remainingVolume = vehicle.maxVolume;

    // Sort cluster orders by weight/volume ratio for better packing
    const sortedClusterOrders = [...clusterOrders].sort((a, b) => 
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
      // Optimize the route for this vehicle using 2-opt
      const { orderedIds, totalDistance } = optimizeRouteWithTwoOpt(
        vehicle.currentLocation.lat,
        vehicle.currentLocation.lng,
        vehicleOrders,
        customers
      );

      // Estimate time based on distance and number of stops
      // Assume: 30 km/h average speed + 5 minutes per stop
      const travelTime = totalDistance / 30 * 60; // convert to minutes
      const loadingTime = vehicleOrders.length * 5; // 5 minutes per stop
      const estimatedTime = travelTime + loadingTime;

      assignments.push({
        vehicleId: vehicle.id,
        orderIds: orderedIds,
        totalWeight: vehicle.maxWeight - remainingWeight,
        totalVolume: vehicle.maxVolume - remainingVolume,
        estimatedDistance: totalDistance,
        estimatedTime: estimatedTime,
      });
    }

    clusterIndex++;
  });

  return assignments;
};