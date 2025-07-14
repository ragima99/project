import React, { useState } from 'react';
import { Package, Truck, Users, Navigation, Clock, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import SummaryCard from '../components/SummaryCard';
import AssignmentCard from '../components/AssignmentCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { optimizeDeliveries } from '../utils/optimizationAlgorithm';

const Dashboard: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { customers, orders, vehicles, assignments } = state;
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const assignedOrders = orders.filter(order => order.status === 'assigned');
  const availableVehicles = vehicles.filter(vehicle => vehicle.available);
  
  // Calculate total waiting time for all customers
  const totalWaitingTime = customers.reduce((total, customer) => {
    return total + (customer.waitingTime || 5);
  }, 0);
  
  const handleOptimize = () => {
    console.log('=== PLAN DELIVERIES DEBUG ===');
    console.log('Pending orders:', pendingOrders.length, pendingOrders);
    console.log('Available vehicles:', availableVehicles.length, availableVehicles);
    console.log('Customers:', customers.length, customers);
    
    setIsOptimizing(true);
    
    // Add a small delay to show loading state
    setTimeout(() => {
      console.log('Starting optimization...');
      const newAssignments = optimizeDeliveries(orders, vehicles, customers);
      console.log('Optimization result:', newAssignments);
      
      dispatch({ type: 'SET_ASSIGNMENTS', payload: newAssignments });
      
      // Update order statuses
      const updatedOrders = [...orders];
      
      newAssignments.forEach(assignment => {
        assignment.orderIds.forEach(orderId => {
          const orderIndex = updatedOrders.findIndex(o => o.id === orderId);
          if (orderIndex !== -1) {
            updatedOrders[orderIndex] = {
              ...updatedOrders[orderIndex],
              status: 'assigned',
            };
          }
        });
      });
      
      dispatch({ type: 'SET_ORDERS', payload: updatedOrders });
      console.log('Updated orders:', updatedOrders);
      setIsOptimizing(false);
    }, 1000);
  };
  
  // Recent orders for dashboard
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const orderColumns = [
    {
      header: 'Order ID',
      accessor: 'id',
      cell: (order) => <span className="font-mono text-xs">{order.id.substring(0, 8)}...</span>,
    },
    {
      header: 'Customer',
      accessor: (order) => {
        const customer = customers.find(c => c.id === order.customerId);
        return customer ? customer.name : 'Unknown';
      },
    },
    {
      header: 'Weight',
      accessor: 'weight',
      cell: (order) => <span>{(order.weight / 1000).toFixed(1)} tons</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (order) => <StatusBadge status={order.status} />,
    },
  ];

  // Check for potential scheduling conflicts
  const hasTimeConflicts = () => {
    return pendingOrders.some(order => {
      const customer = customers.find(c => c.id === order.customerId);
      if (!customer) return false;
      
      return !availableVehicles.some(vehicle => {
        const vehicleHours = vehicle.workingHours || '09:00-17:00';
        const customerHours = customer.acceptanceHours || '09:00-17:00';
        
        // Simple overlap check
        const [vStart] = vehicleHours.split('-');
        const [vEnd] = vehicleHours.split('-')[1] || '17:00';
        const [cStart] = customerHours.split('-');
        const [cEnd] = customerHours.split('-')[1] || '17:00';
        
        return vStart < cEnd && cStart < vEnd;
      });
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Overview of your logistics operations</p>
        
        {hasTimeConflicts() && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center">
            <AlertTriangle size={20} className="text-yellow-600 mr-2" />
            <span className="text-yellow-800 text-sm">
              Some orders may have scheduling conflicts with vehicle working hours
            </span>
          </div>
        )}
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <SummaryCard
          title="Total Customers"
          value={customers.length}
          icon={<Users size={24} />}
          color="#1E3A8A"
        />
        <SummaryCard
          title="Pending Orders"
          value={pendingOrders.length}
          icon={<Package size={24} />}
          trend={{ value: 12, isPositive: true }}
          color="#F97316"
        />
        <SummaryCard
          title="Available Vehicles"
          value={`${availableVehicles.length}/${vehicles.length}`}
          icon={<Truck size={24} />}
          color="#0D9488"
        />
        <SummaryCard
          title="Assigned Orders"
          value={assignedOrders.length}
          icon={<Navigation size={24} />}
          trend={{ value: 5, isPositive: true }}
          color="#8B5CF6"
        />
        <SummaryCard
          title="Total Wait Time"
          value={`${Math.round(totalWaitingTime / customers.length)}min avg`}
          icon={<Clock size={24} />}
          color="#EF4444"
        />
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Delivery Planning Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Delivery Planning</h2>
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || pendingOrders.length === 0 || availableVehicles.length === 0}
              className={`px-4 py-2 rounded-md text-white font-medium flex items-center space-x-2 ${
                isOptimizing || pendingOrders.length === 0 || availableVehicles.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#0D9488] hover:bg-[#0D9488]/90 transition-colors'
              }`}
            >
              {isOptimizing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Optimizing...</span>
                </>
              ) : (
                <>
                  <Truck size={18} />
                  <span>Plan Deliveries</span>
                </>
              )}
            </button>
          </div>

          {assignments.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {assignments.map((assignment) => {
                const vehicle = vehicles.find((v) => v.id === assignment.vehicleId);
                if (!vehicle) return null;
                
                return (
                  <AssignmentCard
                    key={assignment.vehicleId}
                    assignment={assignment}
                    vehicle={vehicle}
                    orders={orders}
                    customers={customers}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center h-[600px] flex flex-col items-center justify-center">
              <Truck size={48} className="text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">No Active Assignments</h3>
              <p className="text-gray-600 mb-4">
                {pendingOrders.length === 0
                  ? "There are no pending orders to assign."
                  : availableVehicles.length === 0
                  ? "There are no available vehicles for delivery."
                  : "Click 'Plan Deliveries' to optimize and create delivery assignments considering working hours and waiting times."}
              </p>
            </div>
          )}
        </div>
        
        {/* Recent Orders Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Orders</h2>
          <div className="h-[600px] overflow-y-auto">
            <DataTable
              data={recentOrders}
              columns={orderColumns}
              keyField="id"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;