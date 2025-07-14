import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Customer, Order, Vehicle, Assignment } from '../types';
import { generateCustomers, generateOrders, generateVehicles } from '../data/mockData';

const initialState: AppState = {
  customers: [],
  orders: [],
  vehicles: [],
  assignments: [],
  selectedOrder: null,
  selectedVehicle: null,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(customer => 
          customer.id === action.payload.id ? action.payload : customer
        ),
      };
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload),
      };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.payload] };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(order => 
          order.id === action.payload.id ? action.payload : order
        ),
      };
    case 'DELETE_ORDER':
      return {
        ...state,
        orders: state.orders.filter(order => order.id !== action.payload),
      };
    case 'SET_VEHICLES':
      return { ...state, vehicles: action.payload };
    case 'ADD_VEHICLE':
      return { ...state, vehicles: [...state.vehicles, action.payload] };
    case 'UPDATE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.map(vehicle => 
          vehicle.id === action.payload.id ? action.payload : vehicle
        ),
      };
    case 'DELETE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.filter(vehicle => vehicle.id !== action.payload),
      };
    case 'SET_ASSIGNMENTS':
      return { ...state, assignments: action.payload };
    case 'ADD_ASSIGNMENT':
      return { ...state, assignments: [...state.assignments, action.payload] };
    case 'CLEAR_ASSIGNMENTS':
      return { ...state, assignments: [] };
    case 'SELECT_ORDER':
      return { ...state, selectedOrder: action.payload };
    case 'SELECT_VEHICLE':
      return { ...state, selectedVehicle: action.payload };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from CSV files on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('=== CSV DATA LOADING DEBUG ===');
        
        const [customers, orders, vehicles] = await Promise.all([
          generateCustomers(),
          generateOrders(),
          generateVehicles()
        ]);

        console.log('=== LOADED DATA SUMMARY ===', {
          customers: customers.length,
          orders: orders.length,
          vehicles: vehicles.length
        });
        
        console.log('Sample customer:', customers[0]);
        console.log('Sample order:', orders[0]);
        console.log('Sample vehicle:', vehicles[0]);

        dispatch({ type: 'SET_CUSTOMERS', payload: customers });
        dispatch({ type: 'SET_ORDERS', payload: orders });
        dispatch({ type: 'SET_VEHICLES', payload: vehicles });
      } catch (error) {
        console.error('=== CSV LOADING ERROR ===', error);
        
        // Fallback: create some sample data if CSV loading fails
        const fallbackCustomers: Customer[] = [
          {
            id: 'cust-001',
            name: 'Sample Customer 1',
            email: 'customer1@example.com',
            phone: '(555) 123-4567',
            address: 'Baku, Azerbaijan',
            location: { lat: 40.4093, lng: 49.8671 },
            waitingTime: 10,
            acceptanceHours: '09:00-17:00'
          }
        ];
        
        const fallbackOrders: Order[] = [
          {
            id: 'order-001',
            customerId: 'cust-001',
            items: 'Sample Package',
            weight: 500, // 0.5 tons in kg
            volume: 0.4,
            status: 'pending',
            createdAt: new Date().toISOString(),
            deliveryDate: null
          }
        ];
        
        const fallbackVehicles: Vehicle[] = [
          {
            id: 'vehicle-001',
            name: 'Sample Truck',
            licensePlate: 'ABC-123',
            maxWeight: 2700, // 2.7 tons in kg
            maxVolume: 3.2,
            available: true,
            currentLocation: { lat: 40.4093, lng: 49.8671 },
            workingHours: '09:00-17:00'
          }
        ];
        
        dispatch({ type: 'SET_CUSTOMERS', payload: fallbackCustomers });
        dispatch({ type: 'SET_ORDERS', payload: fallbackOrders });
        dispatch({ type: 'SET_VEHICLES', payload: fallbackVehicles });
      }
    };

    loadData();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);