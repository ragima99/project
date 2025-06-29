import { Customer, Order, Vehicle } from '../types';
import { 
  loadCSVData, 
  transformCustomerData, 
  transformOrderData, 
  transformVehicleData 
} from '../utils/csvLoader';

// Load data from CSV files
export const generateCustomers = async (): Promise<Customer[]> => {
  try {
    const csvData = await loadCSVData('data/customers.csv'); // <-- update path here
    return transformCustomerData(csvData);
  } catch (error) {
    console.error('Error loading customer data:', error);
    return [];
  }
};

export const generateOrders = async (): Promise<Order[]> => {
  try {
    const csvData = await loadCSVData('data/orders.csv');
    return transformOrderData(csvData);
  } catch (error) {
    console.error('Error loading order data:', error);
    return [];
  }
};

export const generateVehicles = async (): Promise<Vehicle[]> => {
  try {
    const csvData = await loadCSVData('data/vehicles.csv');
    return transformVehicleData(csvData);
  } catch (error) {
    console.error('Error loading vehicle data:', error);
    return [];
  }
};