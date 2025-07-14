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
    const response = await fetch(`/${filename}`);
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

// Generate random coordinates around a center point (Baku, Azerbaijan area)
const generateRandomLocation = (centerLat: number = 40.4093, centerLng: number = 49.8671, radiusKm: number = 30) => {
  const radiusInDegrees = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
  const lat = centerLat + (Math.random() - 0.5) * 2 * radiusInDegrees;
  const lng = centerLng + (Math.random() - 0.5) * 2 * radiusInDegrees;
  return { lat, lng };
};

// Transform CSV data to application types
export const transformCustomerData = (csvData: any[]) => {
  console.log('Raw customer CSV data:', csvData.slice(0, 3)); // Debug log
  
  return csvData
    .filter(row => row.Customer_id && row.Customer_id.trim() !== '') // Filter out empty rows
    .map(row => {
      // Generate random location around Baku since CSV doesn't have coordinates
      const location = generateRandomLocation();

      return {
        id: row.Customer_id,
        name: row.name || `Customer ${row.Customer_id}`,
        email: row.email || `customer${row.Customer_id}@example.com`,
        phone: row.phone || '(000) 000-0000',
        address: row.address || `Baku, Azerbaijan (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`,
        location,
        waitingTime: parseInt(row.waiting_time) || Math.floor(Math.random() * 10) + 5, // Parse waiting time from CSV
        acceptanceHours: row.acceptance_hours || '09:00-17:00' // Parse acceptance hours from CSV
      };
    });
};

export const transformOrderData = (csvData: any[]) => {
  console.log('Raw order CSV data:', csvData.slice(0, 3)); // Debug log
  
  return csvData
    .filter(row => row.customer_id && row.weight_ton && parseFloat(row.weight_ton) > 0)
    .map(row => ({
      id: `order-${row.customer_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerId: row.customer_id,
      items: row.items || `Package for Customer ${row.customer_id}`,
      weight: parseFloat(row.weight_ton) * 1000, // Convert tons to kg
      volume: parseFloat(row.weight_ton) * 0.8, // Estimate volume based on weight
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      deliveryDate: null
    }));
};

export const transformVehicleData = (csvData: any[]) => {
  console.log('Raw vehicle CSV data:', csvData.slice(0, 3)); // Debug log
  
  return csvData
    .filter(row => row.license_plate && row.license_plate.trim() !== '') // Filter out empty rows
    .map(row => ({
      id: row.license_plate,
      name: `${row.name || 'Vehicle'} - ${row.license_plate}`,
      licensePlate: row.license_plate,
      maxWeight: parseFloat(row.max_weight_ton) * 1000, // Convert tons to kg
      maxVolume: parseFloat(row.max_weight_ton) * 1.2, // Estimate volume
      available: true,
      currentLocation: {
        lat: parseFloat(row.lat) || 40.4093, // Baku coordinates as default
        lng: parseFloat(row.lng) || 49.8671
      },
      workingHours: row['working hours'] || '09:00-17:00' // Parse working hours from CSV
    }));
};
