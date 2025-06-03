import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Order } from '../types';
import { v4 as uuidv4 } from 'uuid';

const Orders: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { customers, orders } = state;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    items: '',
    weight: 0,
    volume: 0,
    status: 'pending' as const,
  });
  
  const openModal = (order: Order | null = null) => {
    if (order) {
      setCurrentOrder(order);
      setFormData({
        customerId: order.customerId,
        items: order.items,
        weight: order.weight,
        volume: order.volume,
        status: order.status,
      });
    } else {
      setCurrentOrder(null);
      setFormData({
        customerId: customers.length > 0 ? customers[0].id : '',
        items: '',
        weight: 0,
        volume: 0,
        status: 'pending',
      });
    }
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentOrder(null);
  };
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'weight' || name === 'volume') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentOrder) {
      dispatch({
        type: 'UPDATE_ORDER',
        payload: {
          ...currentOrder,
          customerId: formData.customerId,
          items: formData.items,
          weight: formData.weight,
          volume: formData.volume,
          status: formData.status,
        },
      });
    } else {
      dispatch({
        type: 'ADD_ORDER',
        payload: {
          id: uuidv4(),
          customerId: formData.customerId,
          items: formData.items,
          weight: formData.weight,
          volume: formData.volume,
          status: formData.status,
          createdAt: new Date().toISOString(),
          deliveryDate: null,
        },
      });
    }
    
    closeModal();
  };
  
  const handleDelete = (order: Order) => {
    if (confirm('Are you sure you want to delete this order?')) {
      dispatch({
        type: 'DELETE_ORDER',
        payload: order.id,
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  const orderColumns = [
    {
      header: 'Order ID',
      accessor: 'id',
      cell: (order: Order) => (
        <span className="font-mono text-xs">{order.id.substring(0, 8)}...</span>
      ),
    },
    {
      header: 'Customer',
      accessor: (order: Order) => {
        const customer = customers.find(c => c.id === order.customerId);
        return customer ? customer.name : 'Unknown';
      },
    },
    {
      header: 'Items',
      accessor: 'items',
    },
    {
      header: 'Weight',
      accessor: 'weight',
      cell: (order: Order) => <span>{order.weight} kg</span>,
    },
    {
      header: 'Volume',
      accessor: 'volume',
      cell: (order: Order) => <span>{order.volume} m³</span>,
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      cell: (order: Order) => <span>{formatDate(order.createdAt)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (order: Order) => <StatusBadge status={order.status} />,
    },
    {
      header: 'Actions',
      accessor: (order: Order) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal(order);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(order);
            }}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-600">Manage customer orders</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-[#0D9488] text-white rounded-md flex items-center space-x-2 hover:bg-[#0D9488]/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Order</span>
        </button>
      </div>
      
      <DataTable
        data={orders}
        columns={orderColumns}
        keyField="id"
        searchField="items"
      />
      
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {currentOrder ? 'Edit Order' : 'Add New Order'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Customer
                  </label>
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Items
                  </label>
                  <textarea
                    name="items"
                    value={formData.items}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                      min="0.1"
                      step="0.1"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Volume (m³)
                    </label>
                    <input
                      type="number"
                      name="volume"
                      value={formData.volume}
                      onChange={handleInputChange}
                      required
                      min="0.01"
                      step="0.01"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                {currentOrder && (
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="in-transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0D9488] text-white rounded-md hover:bg-[#0D9488]/90"
                  >
                    {currentOrder ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;