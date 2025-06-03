import React, { useState } from 'react';
import { Plus, Edit, Trash2, Truck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Vehicle } from '../types';
import { v4 as uuidv4 } from 'uuid';

const Vehicles: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { vehicles } = state;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    licensePlate: '',
    maxWeight: 0,
    maxVolume: 0,
    available: true,
    lat: 0,
    lng: 0,
  });
  
  const openModal = (vehicle: Vehicle | null = null) => {
    if (vehicle) {
      setCurrentVehicle(vehicle);
      setFormData({
        name: vehicle.name,
        licensePlate: vehicle.licensePlate,
        maxWeight: vehicle.maxWeight,
        maxVolume: vehicle.maxVolume,
        available: vehicle.available,
        lat: vehicle.currentLocation.lat,
        lng: vehicle.currentLocation.lng,
      });
    } else {
      setCurrentVehicle(null);
      setFormData({
        name: '',
        licensePlate: '',
        maxWeight: 1000,
        maxVolume: 10,
        available: true,
        lat: 39.78,
        lng: -89.65,
      });
    }
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentVehicle(null);
  };
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (name === 'maxWeight' || name === 'maxVolume' || name === 'lat' || name === 'lng') {
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
    
    const vehicleData = {
      name: formData.name,
      licensePlate: formData.licensePlate,
      maxWeight: formData.maxWeight,
      maxVolume: formData.maxVolume,
      available: formData.available,
      currentLocation: {
        lat: formData.lat,
        lng: formData.lng,
      },
    };
    
    if (currentVehicle) {
      dispatch({
        type: 'UPDATE_VEHICLE',
        payload: {
          ...currentVehicle,
          ...vehicleData,
        },
      });
    } else {
      dispatch({
        type: 'ADD_VEHICLE',
        payload: {
          id: uuidv4(),
          ...vehicleData,
        },
      });
    }
    
    closeModal();
  };
  
  const handleDelete = (vehicle: Vehicle) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      dispatch({
        type: 'DELETE_VEHICLE',
        payload: vehicle.id,
      });
    }
  };
  
  const vehicleColumns = [
    {
      header: 'Name',
      accessor: 'name',
    },
    {
      header: 'License Plate',
      accessor: 'licensePlate',
    },
    {
      header: 'Max Weight',
      accessor: 'maxWeight',
      cell: (vehicle: Vehicle) => <span>{vehicle.maxWeight} kg</span>,
    },
    {
      header: 'Max Volume',
      accessor: 'maxVolume',
      cell: (vehicle: Vehicle) => <span>{vehicle.maxVolume} m³</span>,
    },
    {
      header: 'Status',
      accessor: 'available',
      cell: (vehicle: Vehicle) => (
        <StatusBadge 
          status={vehicle.available ? 'available' : 'unavailable'} 
          text={vehicle.available ? 'Available' : 'Unavailable'}
        />
      ),
    },
    {
      header: 'Location',
      accessor: (vehicle: Vehicle) => (
        <span className="text-sm">
          {vehicle.currentLocation.lat.toFixed(4)}, {vehicle.currentLocation.lng.toFixed(4)}
        </span>
      ),
      sortable: false,
    },
    {
      header: 'Actions',
      accessor: (vehicle: Vehicle) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal(vehicle);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(vehicle);
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
          <h1 className="text-2xl font-bold text-gray-800">Vehicles</h1>
          <p className="text-gray-600">Manage your delivery fleet</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-[#F97316] text-white rounded-md flex items-center space-x-2 hover:bg-[#F97316]/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Vehicle</span>
        </button>
      </div>
      
      <DataTable
        data={vehicles}
        columns={vehicleColumns}
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
                  {currentVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
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
                    License Plate
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Max Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="maxWeight"
                      value={formData.maxWeight}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Max Volume (m³)
                    </label>
                    <input
                      type="number"
                      name="maxVolume"
                      value={formData.maxVolume}
                      onChange={handleInputChange}
                      required
                      min="0.1"
                      step="0.1"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="available"
                      checked={formData.available}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-[#F97316] rounded border-gray-300 focus:ring-[#F97316]"
                    />
                    <span className="ml-2 text-gray-700">Available for delivery</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Current Latitude
                    </label>
                    <input
                      type="number"
                      name="lat"
                      value={formData.lat}
                      onChange={handleInputChange}
                      step="0.000001"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Current Longitude
                    </label>
                    <input
                      type="number"
                      name="lng"
                      value={formData.lng}
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
                    className="px-4 py-2 bg-[#F97316] text-white rounded-md hover:bg-[#F97316]/90"
                  >
                    {currentVehicle ? 'Update' : 'Add'}
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

export default Vehicles;