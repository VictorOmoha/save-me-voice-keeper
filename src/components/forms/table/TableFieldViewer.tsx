/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, Search, SortAsc, SortDesc } from 'lucide-react';
import { TableData, TableColumn } from '../types';
import { fieldValueToText } from '@/utils/fieldValueGuards';
import { toast } from 'sonner';

interface TableFieldViewerProps {
  value: TableData;
  title?: string;
  showExport?: boolean;
}

export const TableFieldViewer: React.FC<TableFieldViewerProps> = ({
  value,
  title,
  showExport = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const columns = value?.columns ?? [];
  const rows = value?.rows ?? [];

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedRows = React.useMemo(() => {
    let filtered = rows;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn] || '';
        const bVal = b[sortColumn] || '';
        
        const column = columns.find(col => col.id === sortColumn);
        
        if (column?.type === 'number') {
          const aNum = parseFloat(String(aVal)) || 0;
          const bNum = parseFloat(String(bVal)) || 0;
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        if (column?.type === 'date') {
          const aDate = new Date(String(aVal));
          const bDate = new Date(String(bVal));
          return sortDirection === 'asc' 
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }
        
        if (column?.type === 'checkbox') {
          const aBool = Boolean(aVal);
          const bBool = Boolean(bVal);
          return sortDirection === 'asc'
            ? (aBool === bBool ? 0 : aBool ? 1 : -1)
            : (aBool === bBool ? 0 : aBool ? -1 : 1);
        }

        // Text comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [rows, searchTerm, sortColumn, sortDirection, columns]);


  if (!value || columns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border border-border rounded-lg">
        No table data available
      </div>
    );
  }

  const exportToCSV = () => {
    try {
      const headers = columns.map(col => col.name);
      const csvContent = [
        headers.join(','),
        ...rows.map(row =>
          columns.map(col => {
            const value = row[col.id] || '';
            if (col.type === 'checkbox') {
              return value ? 'true' : 'false';
            }
            // Escape commas and quotes
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${title || 'table-data'}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Table exported to CSV');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export table');
    }
  };

  const renderCellValue = (row: Record<string, unknown>, column: TableColumn) => {
    const cellValue = row[column.id];

    switch (column.type) {
      case 'checkbox':
        return (
          <div className="flex justify-center">
            <Checkbox checked={!!cellValue} disabled className="pointer-events-none" />
          </div>
        );
      case 'number':
        return (
          <span className="font-mono">
            {cellValue !== null && cellValue !== undefined ? Number(cellValue).toLocaleString() : '—'}
          </span>
        );
      case 'date':
        return cellValue ? new Date(String(cellValue)).toLocaleDateString() : '—';
      default:
        return cellValue ? fieldValueToText(cellValue) : '—';
    }
  };

  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />;
  };

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">
              {rows.length} row{value.rows.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline">
              {columns.length} column{value.columns.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        
        {showExport && (
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search table data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className="border border-border p-3 text-left text-sm font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => handleSort(column.id)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.name}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {column.type}
                      </Badge>
                      {getSortIcon(column.id)}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/30 transition-colors">
                {columns.map((column) => (
                  <td key={column.id} className="border border-border p-3 text-sm">
                    {renderCellValue(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedRows.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'No matching results found.' : 'No data available.'}
        </div>
      )}

      {searchTerm && filteredAndSortedRows.length !== rows.length && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredAndSortedRows.length} of {rows.length} rows
        </div>
      )}
    </div>
  );
};