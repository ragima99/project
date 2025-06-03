export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface Order {
  id: string;
  customerId: string;
  items: string;
  weight: number; // in kg
  volume: number; // in cubic meters
  status: 'pending' | 'assigned' | 'in-transit' | 'delivered';
  createdAt: string;
  deliveryDate: string | null;
}

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  maxWeight: number; // in kg
  maxVolume: number; // in cubic meters
  available: boolean;
  currentLocation: {
    lat: number;
    lng: number;
  };
}

export interface Assignment {
  vehicleId: string;
  orderIds: string[];
  totalWeight: number;
  totalVolume: number;
  estimatedDistance: number; // in km
  estimatedTime: number; // in minutes
}

export interface AppState {
  customers: Customer[];
  orders: Order[];
  vehicles: Vehicle[];
  assignments: Assignment[];
  selectedOrder: string | null;
  selectedVehicle: string | null;
}

export type AppAction = 
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'DELETE_ORDER'; payload: string }
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'UPDATE_VEHICLE'; payload: Vehicle }
  | { type: 'DELETE_VEHICLE'; payload: string }
  | { type: 'SET_ASSIGNMENTS'; payload: Assignment[] }
  | { type: 'ADD_ASSIGNMENT'; payload: Assignment }
  | { type: 'CLEAR_ASSIGNMENTS'; payload: null }
  | { type: 'SELECT_ORDER'; payload: string | null }
  | { type: 'SELECT_VEHICLE'; payload: string | null };