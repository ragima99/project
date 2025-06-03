import React, { useState } from 'react';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import DataTable from '../components/DataTable';
import { Customer } from '../types';
import { v4 as uuidv4 } from 'uuid';

const Customers: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { customers, orders } = state;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    location: { lat: 0, lng: 0 },
  });
  
  const openModal = (customer: Customer | null = null) => {
    if (customer) {
      setCurrentCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        location: { ...customer.location },
      });
    } else {
      setCurrentCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        location: { lat: 0, lng: 0 },
      });
    }
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCustomer(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'lat' || name === 'lng') {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [name]: parseFloat(value) || 0,
        },
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
    
    // For a real app, we would validate the location coordinates
    // For demo purposes, if they are 0, generate some random coordinates
    let location = formData.location;
    if (location.lat === 0 && location.lng === 0) {
      location = {
        lat: 39.7 + Math.random() * 0.1,
        lng: -89.6 - Math.random() * 0.1,
      };
    }
    
    if (currentCustomer) {
      dispatch({
        type: 'UPDATE_CUSTOMER',
        payload: {
          ...currentCustomer,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          location,
        },
      });
    } else {
      dispatch({
        type: 'ADD_CUSTOMER',
        payload: {
          id: uuidv4(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          location,
        },
      });
    }
    
    closeModal();
  };
  
  const handleDelete = (customer: Customer) => {
    // Check if customer has orders
    const customerOrders = orders.filter(order => order.customerId === customer.id);
    
    if (customerOrders.length > 0) {
      alert(`Cannot delete customer with ${customerOrders.length} active orders.`);
      return;
    }
    
    if (confirm('Are you sure you want to delete this customer?')) {
      dispatch({
        type: 'DELETE_CUSTOMER',
        payload: customer.id,
      });
    }
  };
  
  const customerColumns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Phone',
      accessor: 'phone',
    },
    {
      header: 'Address',
      accessor: 'address',
    },
    {
      header: 'Actions',
      accessor: (customer: Customer) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal(customer);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(customer);
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
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-[#1E3A8A] text-white rounded-md flex items-center space-x-2 hover:bg-[#1E3A8A]/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>
      
      <DataTable
        data={customers}
        columns={customerColumns}
        keyField="id"
        searchField="name"
      />
      
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {currentCustomer ? 'Edit Customer' : 'Add New Customer'}
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
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      name="lat"
                      value={formData.location.lat}
                      onChange={handleInputChange}
                      step="0.000001"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      name="lng"
                      value={formData.location.lng}
                      onChange={handleInputChange}
                      step="0.000001"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
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
                    className="px-4 py-2 bg-[#1E3A8A] text-white rounded-md hover:bg-[#1E3A8A]/90"
                  >
                    {currentCustomer ? 'Update' : 'Add'}
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

export default Customers;