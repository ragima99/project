import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { Icon, LatLngBounds, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Assignment, Vehicle, Customer, Order } from '../types';

interface DeliveryMapProps {
  assignment: Assignment;
  vehicle: Vehicle;
  orders: Order[];
  customers: Customer[];
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  assignment,
  vehicle,
  orders,
  customers,
}) => {
  const assignedOrders = orders.filter(order => 
    assignment.orderIds.includes(order.id)
  );

  const assignedCustomers = assignedOrders
    .map(order => customers.find(c => c.id === order.customerId))
    .filter((customer): customer is Customer => customer !== undefined);

  // Calculate bounds for all locations
  const bounds = new LatLngBounds(
    [vehicle.currentLocation.lat, vehicle.currentLocation.lng]
  );

  assignedCustomers.forEach(customer => {
    bounds.extend([customer.location.lat, customer.location.lng]);
  });

  // Create path for the route
  const positions: [number, number][] = [
    [vehicle.currentLocation.lat, vehicle.currentLocation.lng],
    ...assignedCustomers.map(customer => [
      customer.location.lat,
      customer.location.lng,
    ]),
  ];

  // Custom icons
  const vehicleIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const customerIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <MapContainer
      bounds={bounds}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Vehicle marker */}
      <Marker
        position={[vehicle.currentLocation.lat, vehicle.currentLocation.lng]}
        icon={vehicleIcon}
      >
        <Popup>{vehicle.name}</Popup>
      </Marker>

      {/* Customer markers */}
      {assignedCustomers.map((customer, index) => (
        <Marker
          key={customer.id}
          position={[customer.location.lat, customer.location.lng]}
          icon={customerIcon}
        >
          <Popup>
            Customer ID: {customer.id}<br />
            Stop #{index + 1}
          </Popup>
        </Marker>
      ))}

      {/* Route path */}
      <Polyline
        positions={positions}
        color="#1E3A8A"
        weight={3}
        opacity={0.8}
      />
    </MapContainer>
  );
};

export default DeliveryMap;