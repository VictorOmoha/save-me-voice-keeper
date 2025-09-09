import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Search, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { TableData } from '../types';
import { toast } from 'sonner';

interface ShoppingListCardViewerProps {
  value: TableData;
  title?: string;
  showExport?: boolean;
}

export const ShoppingListCardViewer: React.FC<ShoppingListCardViewerProps> = ({
  value,
  title,
  showExport = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!value || !value.columns || value.columns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border border-border rounded-lg">
        No shopping list data available
      </div>
    );
  }

  // Find relevant columns
  const itemColumn = value.columns.find(col => col.name.toLowerCase().includes('item'));
  const quantityColumn = value.columns.find(col => col.name.toLowerCase().includes('quantity') || col.name.toLowerCase().includes('qty'));
  const unitColumn = value.columns.find(col => col.name.toLowerCase().includes('unit'));
  const priceColumn = value.columns.find(col => col.name.toLowerCase().includes('price') || col.name.toLowerCase().includes('cost'));
  const categoryColumn = value.columns.find(col => col.name.toLowerCase().includes('category') || col.name.toLowerCase().includes('aisle'));
  const purchasedColumn = value.columns.find(col => col.name.toLowerCase().includes('purchased') || col.name.toLowerCase().includes('got it') || col.type === 'checkbox');
  const notesColumn = value.columns.find(col => col.name.toLowerCase().includes('notes') || col.name.toLowerCase().includes('note'));

  const filteredRows = React.useMemo(() => {
    if (!searchTerm) return value.rows;
    
    return value.rows.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [value.rows, searchTerm]);

  // Calculate totals
  const totals = React.useMemo(() => {
    const totalItems = filteredRows.length;
    const purchasedItems = purchasedColumn 
      ? filteredRows.filter(row => row[purchasedColumn.id]).length 
      : 0;
    const totalCost = priceColumn 
      ? filteredRows.reduce((sum, row) => sum + (parseFloat(row[priceColumn.id]) || 0), 0)
      : 0;
    const purchasedCost = priceColumn && purchasedColumn
      ? filteredRows
          .filter(row => row[purchasedColumn.id])
          .reduce((sum, row) => sum + (parseFloat(row[priceColumn.id]) || 0), 0)
      : 0;

    return {
      totalItems,
      purchasedItems,
      remainingItems: totalItems - purchasedItems,
      totalCost,
      purchasedCost,
      remainingCost: totalCost - purchasedCost
    };
  }, [filteredRows, priceColumn, purchasedColumn]);

  const exportToCSV = () => {
    try {
      const headers = value.columns.map(col => col.name);
      const csvContent = [
        headers.join(','),
        ...value.rows.map(row =>
          value.columns.map(col => {
            const value = row[col.id] || '';
            if (col.type === 'checkbox') {
              return value ? 'true' : 'false';
            }
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${title || 'shopping-list'}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Shopping list exported to CSV');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export shopping list');
    }
  };

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-card">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {title && (
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">{title}</h3>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {totals.totalItems} items
              </Badge>
              {purchasedColumn && (
                <Badge variant="outline" className="flex items-center gap-1">
                  ✓ {totals.purchasedItems} completed
                </Badge>
              )}
              {priceColumn && totals.totalCost > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${totals.totalCost.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
          
          {showExport && (
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Progress Summary */}
        {purchasedColumn && totals.totalItems > 0 && (
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {Math.round((totals.purchasedItems / totals.totalItems) * 100)}% complete
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(totals.purchasedItems / totals.totalItems) * 100}%` }}
              />
            </div>
            {priceColumn && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>Spent: ${totals.purchasedCost.toFixed(2)}</span>
                <span>Remaining: ${totals.remainingCost.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search shopping list..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Shopping List Cards */}
      <div className="space-y-3">
        {filteredRows.map((row, index) => {
          const isPurchased = purchasedColumn ? Boolean(row[purchasedColumn.id]) : false;
          
          return (
            <Card 
              key={index} 
              className={`transition-all duration-200 ${
                isPurchased 
                  ? 'bg-muted/50 opacity-75' 
                  : 'bg-card hover:shadow-sm'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left side - Item details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      {purchasedColumn && (
                        <Checkbox 
                          checked={isPurchased}
                          disabled
                          className="pointer-events-none"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className={`font-medium ${isPurchased ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {itemColumn ? row[itemColumn.id] : 'Unknown Item'}
                        </h4>
                        
                        {/* Quantity and Price on same line */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {quantityColumn && row[quantityColumn.id] && (
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {row[quantityColumn.id]}
                              {unitColumn && row[unitColumn.id] && ` ${row[unitColumn.id]}`}
                            </span>
                          )}
                          {priceColumn && row[priceColumn.id] && (
                            <span className="flex items-center gap-1 font-medium">
                              <DollarSign className="h-3 w-3" />
                              {parseFloat(row[priceColumn.id]).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Category and Notes */}
                    <div className="flex items-center gap-2 text-xs">
                      {categoryColumn && row[categoryColumn.id] && (
                        <Badge variant="secondary" className="text-xs">
                          {row[categoryColumn.id]}
                        </Badge>
                      )}
                      {notesColumn && row[notesColumn.id] && (
                        <span className="text-muted-foreground italic">
                          {row[notesColumn.id]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRows.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'No matching items found.' : 'No items in shopping list.'}
        </div>
      )}

      {searchTerm && filteredRows.length !== value.rows.length && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredRows.length} of {value.rows.length} items
        </div>
      )}
    </div>
  );
};