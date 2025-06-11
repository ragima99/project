import React from 'react';
import { Truck, Box, MapPin, Clock, Weight, Users, Calendar } from 'lucide-react';
import { Vehicle, Order, Customer, Assignment } from '../types';
import DeliveryMap from './DeliveryMap';

interface AssignmentCardProps {
  assignment: Assignment;
  vehicle: Vehicle;
  orders: Order[];
  customers: Customer[];
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  vehicle,
  orders,
  customers,
}) => {
  const assignedOrders = orders.filter(order => 
    assignment.orderIds.includes(order.id)
  );

  // Get unique customer IDs for this assignment
  const customerIds = assignedOrders
    .map(order => {
      const customer = customers.find(c => c.id === order.customerId);
      return customer ? customer.id : null;
    })
    .filter((id, index, self) => 
      id !== null && self.indexOf(id) === index
    );

  // Format time from ISO string
  const formatTime = (isoString: string | undefined) => {
    if (!isoString) return 'Not scheduled';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Calculate total waiting time for all customers
  const totalWaitingTime = assignedOrders.reduce((total, order) => {
    const customer = customers.find(c => c.id === order.customerId);
    return total + (customer?.waitingTime || 5);
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-lg">
      <div className="bg-[#1E3A8A] text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Truck size={20} />
            <h3 className="font-semibold">{vehicle.name}</h3>
          </div>
          <span className="text-sm bg-white/20 px-2 py-1 rounded">
            {vehicle.licensePlate}
          </span>
        </div>
        <div className="mt-2 text-sm opacity-90">
          Working Hours: {vehicle.workingHours || '09:00-17:00'}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Box size={16} className="mr-2 text-[#0D9488]" />
              <span>{assignedOrders.length} Orders</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Weight size={16} className="mr-2 text-[#0D9488]" />
              <span>{(assignment.totalWeight / 1000).toFixed(1)} tons</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin size={16} className="mr-2 text-[#0D9488]" />
              <span>{assignment.estimatedDistance.toFixed(1)} km</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock size={16} className="mr-2 text-[#0D9488]" />
              <span>{Math.round(assignment.estimatedTime)} min</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users size={16} className="mr-2 text-[#F97316]" />
              <span>{totalWaitingTime} min wait</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar size={16} className="mr-2 text-[#F97316]" />
              <span>{formatTime(assignment.scheduledStartTime)}</span>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Delivery Schedule:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto text-sm">
              {assignment.scheduledStartTime && assignment.scheduledEndTime && (
                <div className="bg-blue-50 p-2 rounded text-xs">
                  <div className="font-medium text-blue-800">
                    Start: {formatTime(assignment.scheduledStartTime)}
                  </div>
                  <div className="text-blue-600">
                    End: {formatTime(assignment.scheduledEndTime)}
                  </div>
                </div>
              )}
              {assignedOrders.slice(0, 3).map((order, index) => {
                const customer = customers.find(c => c.id === order.customerId);
                return (
                  <div key={order.id} className="flex items-start text-xs">
                    <span className="bg-[#0D9488] text-white rounded-full w-4 h-4 flex items-center justify-center mr-2 mt-0.5 text-xs">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium">Customer {order.customerId}</div>
                      <div className="text-gray-500">
                        Wait: {customer?.waitingTime || 5}min | 
                        Hours: {customer?.acceptanceHours || '09:00-17:00'}
                      </div>
                    </div>
                  </div>
                );
              })}
              {assignedOrders.length > 3 && (
                <div className="text-xs text-gray-500 italic">
                  +{assignedOrders.length - 3} more deliveries...
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Vehicle Capacity: {Math.round((assignment.totalWeight / vehicle.maxWeight) * 100)}%
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#0D9488] h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      Math.round((assignment.totalWeight / vehicle.maxWeight) * 100),
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-64">
          <DeliveryMap
            assignment={assignment}
            vehicle={vehicle}
            orders={orders}
            customers={customers}
          />
        </div>
      </div>
    </div>
  );
};

export default AssignmentCard;