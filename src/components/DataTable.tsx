import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  searchField?: keyof T;
}

function DataTable<T>({
  data,
  columns,
  keyField,
  onRowClick,
  searchField,
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (accessor: keyof T | ((item: T) => React.ReactNode)) => {
    if (typeof accessor === 'function') return;
    
    if (sortField === accessor) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(accessor);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    
    // Filter by search term if searchField is provided
    if (searchField && searchTerm) {
      sortableData = sortableData.filter((item) => {
        const value = item[searchField];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }
    
    // Sort data if sortField is set
    if (sortField) {
      sortableData.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue === bValue) return 0;
        
        // Handle different types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        }
        
        // Default comparison
        const compareA = String(aValue);
        const compareB = String(bValue);
        return sortDirection === 'asc' 
          ? compareA.localeCompare(compareB)
          : compareB.localeCompare(compareA);
      });
    }
    
    return sortableData;
  }, [data, sortField, sortDirection, searchTerm, searchField]);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      {searchField && (
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => {
                const accessor = column.accessor;
                const isSortable = column.sortable !== false && typeof accessor !== 'function';
                
                return (
                  <th
                    key={index}
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      isSortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={() => isSortable && handleSort(accessor)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {isSortable && sortField === accessor && (
                        <span>
                          {sortDirection === 'asc' ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.length > 0 ? (
              sortedData.map((item) => (
                <tr 
                  key={String(item[keyField])}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((column, cellIndex) => {
                    const accessor = column.accessor;
                    let cellValue;
                    
                    if (typeof accessor === 'function') {
                      cellValue = accessor(item);
                    } else if (column.cell) {
                      cellValue = column.cell(item);
                    } else {
                      cellValue = item[accessor];
                    }
                    
                    return (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap">
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;