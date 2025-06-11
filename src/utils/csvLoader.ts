// CSV parsing utility functions
export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    const obj: any = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    return obj;
  });
};

// Load CSV data from public folder
export const loadCSVData = async (filename: string): Promise<any[]> => {
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error loading CSV file ${filename}:`, error);
    return [];
  }
};

// Generate random coordinates around a center point
const generateRandomLocation = (centerLat: number, centerLng: number, radiusKm: number = 50) => {
  const radiusInDegrees = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
  const lat = centerLat + (Math.random() - 0.5) * 2 * radiusInDegrees;
  const lng = centerLng + (Math.random() - 0.5) * 2 * radiusInDegrees;
  return { lat, lng };
};

// Transform CSV data to application types
export const transformCustomerData = (csvData: any[]) => {
  return csvData.map(row => {
    // Generate random location if coordinates are not provided or are 0
    const hasValidCoords = row.lat && row.lng && parseFloat(row.lat) !== 0 && parseFloat(row.lng) !== 0;
    const location = hasValidCoords 
      ? { lat: parseFloat(row.lat), lng: parseFloat(row.lng) }
      : generateRandomLocation(40.4449, 49.2756);

    return {
      id: row.customer_id,
      name: row.name || `Customer ${row.customer_id}`,
      email: row.email || `customer${row.customer_id}@example.com`,
      phone: row.phone || '(000) 000-0000',
      address: row.address || `Location at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
      location,
      waitingTime: parseFloat(row.waiting_time) || 5, // Default 5 minutes if not specified
      acceptanceHours: row.acceptance_hours || '09:00-17:00' // Default business hours
    };
  });
};

export const transformOrderData = (csvData: any[]) => {
  return csvData
    .filter(row => row.weight_ton && parseFloat(row.weight_ton) > 0)
    .map(row => ({
      id: `order-${row.customer_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerId: row.customer_id,
      items: row.items || `Package for Customer ${row.customer_id}`,
      weight: parseFloat(row.weight_ton) * 1000, // Convert tons to kg
      volume: parseFloat(row.weight_ton) * 0.8, // Estimate volume
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      deliveryDate: null
    }));
};

export const transformVehicleData = (csvData: any[]) => {
  return csvData.map(row => ({
    id: row.license_plate,
    name: `${row.name} - ${row.license_plate}`,
    licensePlate: row.license_plate,
    maxWeight: parseFloat(row.max_weight_ton) * 1000, // Convert tons to kg
    maxVolume: parseFloat(row.max_weight_ton) * 1.2, // Estimate volume
    available: true,
    currentLocation: {
      lat: parseFloat(row.lat) || 40.4449,
      lng: parseFloat(row.lng) || 49.2756
    },
    workingHours: row['working hours'] || '09:00-17:00' // Default working hours
  }));
};