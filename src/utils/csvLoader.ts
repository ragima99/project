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

// Transform CSV data to application types
export const transformCustomerData = (csvData: any[]) => {
  return csvData.map(row => ({
    id: row.customer_id,
    name: row.name || `Customer ${row.customer_id}`,
    email: row.email || `customer${row.customer_id}@example.com`,
    phone: row.phone || '(000) 000-0000',
    address: row.address || `Location at ${row.lat}, ${row.lng}`,
    location: {
      lat: parseFloat(row.lat) || 0,
      lng: parseFloat(row.lng) || 0
    }
  }));
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
    name: row.name || `${row.name} - ${row.license_plate}`,
    licensePlate: row.license_plate,
    maxWeight: parseFloat(row.max_weight_ton) * 1000, // Convert tons to kg
    maxVolume: parseFloat(row.max_weight_ton) * 1.2, // Estimate volume
    available: true,
    currentLocation: {
      lat: parseFloat(row.lat) || 40.4449,
      lng: parseFloat(row.lng) || 49.2756
    }
  }));
};