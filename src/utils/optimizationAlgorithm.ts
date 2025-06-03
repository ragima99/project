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

// Function to find the optimal order for a given route (simple nearest neighbor)
const optimizeRoute = (
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

  const unvisited = [...orders];
  const orderedIds: string[] = [];
  let totalDistance = 0;
  let currentLat = startLat;
  let currentLng = startLng;

  while (unvisited.length > 0) {
    // Find the closest order
    let closestIndex = 0;
    let closestDistance = Number.MAX_VALUE;

    for (let i = 0; i < unvisited.length; i++) {
      const customer = customers.find(c => c.id === unvisited[i].customerId);
      if (!customer) continue;

      const distance = calculateDistance(
        currentLat,
        currentLng,
        customer.location.lat,
        customer.location.lng
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    // Add the closest order to the route
    const closestOrder = unvisited[closestIndex];
    const customer = customers.find(c => c.id === closestOrder.customerId);
    
    if (customer) {
      currentLat = customer.location.lat;
      currentLng = customer.location.lng;
      totalDistance += closestDistance;
    }

    orderedIds.push(closestOrder.id);
    unvisited.splice(closestIndex, 1);
  }

  return { orderedIds, totalDistance };
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

  // Sort orders by weight (descending) for a simple bin-packing approach
  const sortedOrders = [...pendingOrders].sort((a, b) => b.weight - a.weight);
  
  const assignments: Assignment[] = [];

  // Simple bin-packing algorithm for weight and volume constraints
  const remainingOrders = [...sortedOrders];
  
  availableVehicles.forEach(vehicle => {
    if (remainingOrders.length === 0) return;

    const vehicleOrders: Order[] = [];
    let remainingWeight = vehicle.maxWeight;
    let remainingVolume = vehicle.maxVolume;

    // Try to fill the vehicle as much as possible
    for (let i = 0; i < remainingOrders.length; i++) {
      const order = remainingOrders[i];
      
      if (order.weight <= remainingWeight && order.volume <= remainingVolume) {
        vehicleOrders.push(order);
        remainingWeight -= order.weight;
        remainingVolume -= order.volume;
        remainingOrders.splice(i, 1);
        i--; // Adjust index after removing an item
      }
    }

    if (vehicleOrders.length > 0) {
      // Optimize the route for this vehicle
      const { orderedIds, totalDistance } = optimizeRoute(
        vehicle.currentLocation.lat,
        vehicle.currentLocation.lng,
        vehicleOrders,
        customers
      );

      // Estimate time (very simplified - assume 30 km/h average speed)
      const estimatedTime = totalDistance / 30 * 60; // convert to minutes

      assignments.push({
        vehicleId: vehicle.id,
        orderIds: orderedIds,
        totalWeight: vehicle.maxWeight - remainingWeight,
        totalVolume: vehicle.maxVolume - remainingVolume,
        estimatedDistance: totalDistance,
        estimatedTime: estimatedTime,
      });
    }
  });

  return assignments;
};