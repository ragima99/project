import React from 'react';
import { Truck, Box, MapPin, Clock, Weight } from 'lucide-react';
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
              <span>{assignment.totalWeight.toFixed(1)} kg</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin size={16} className="mr-2 text-[#0D9488]" />
              <span>{assignment.estimatedDistance.toFixed(1)} km</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock size={16} className="mr-2 text-[#0D9488]" />
              <span>{Math.round(assignment.estimatedTime)} min</span>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Delivery Locations:</h4>
            <div className="space-y-1 max-h-24 overflow-y-auto text-sm">
              {customerIds.map((customerId, index) => (
                <div key={index} className="flex items-start">
                  <MapPin size={14} className="mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span className="text-gray-600">Customer ID: {customerId}</span>
                </div>
              ))}
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