import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit, Check } from 'lucide-react';
import { TableData, TableColumn } from '../types';
import { toast } from 'sonner';

interface TableFieldEditorProps {
  value: TableData;
  onChange: (value: TableData) => void;
  disabled?: boolean;
}

export const TableFieldEditor: React.FC<TableFieldEditorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<TableColumn['type']>('text');

  const addColumn = () => {
    if (!newColumnName.trim()) {
      toast.error('Column name is required');
      return;
    }

    const newColumn: TableColumn = {
      id: `col_${Date.now()}`,
      name: newColumnName.trim(),
      type: newColumnType,
      required: false
    };

    const updatedValue = {
      ...value,
      columns: [...value.columns, newColumn],
      rows: value.rows.map(row => ({ ...row, [newColumn.id]: '' }))
    };

    onChange(updatedValue);
    setNewColumnName('');
    setNewColumnType('text');
    toast.success('Column added successfully');
  };

  const updateColumn = (columnId: string, updates: Partial<TableColumn>) => {
    const updatedValue = {
      ...value,
      columns: value.columns.map(col => 
        col.id === columnId ? { ...col, ...updates } : col
      )
    };
    onChange(updatedValue);
    setEditingColumn(null);
  };

  const deleteColumn = (columnId: string) => {
    const updatedValue = {
      ...value,
      columns: value.columns.filter(col => col.id !== columnId),
      rows: value.rows.map(row => {
        const { [columnId]: deleted, ...rest } = row;
        return rest;
      })
    };
    onChange(updatedValue);
    toast.success('Column deleted');
  };

  const addRow = () => {
    const newRow: Record<string, unknown> = {};
    value.columns.forEach(col => {
      newRow[col.id] = col.type === 'checkbox' ? false : '';
    });

    const updatedValue = {
      ...value,
      rows: [...value.rows, newRow]
    };
    onChange(updatedValue);
  };

  const updateRowValue = (rowIndex: number, columnId: string, newValue: unknown) => {
    const updatedValue = {
      ...value,
      rows: value.rows.map((row, index) => 
        index === rowIndex ? { ...row, [columnId]: newValue } : row
      )
    };
    onChange(updatedValue);
  };

  const deleteRow = (rowIndex: number) => {
    const updatedValue = {
      ...value,
      rows: value.rows.filter((_, index) => index !== rowIndex)
    };
    onChange(updatedValue);
  };

  const renderCellInput = (row: Record<string, unknown>, column: TableColumn, rowIndex: number) => {
    const cellValue = row[column.id] || '';
    const inputValue = ((typeof cellValue === 'string' || typeof cellValue === 'number') && cellValue) || '';

    switch (column.type) {
      case 'checkbox':
        return (
          <Checkbox
            checked={!!cellValue}
            onCheckedChange={(checked) => updateRowValue(rowIndex, column.id, checked)}
            disabled={disabled}
            className="mx-auto"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => updateRowValue(rowIndex, column.id, e.target.value)}
            disabled={disabled}
            className="min-w-0"
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={inputValue}
            onChange={(e) => updateRowValue(rowIndex, column.id, e.target.value)}
            disabled={disabled}
            className="min-w-0"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => updateRowValue(rowIndex, column.id, e.target.value)}
            disabled={disabled}
            className="min-w-0"
          />
        );
    }
  };

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-card">
      {/* Column Management */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Table Columns</Label>
        
        {/* Add New Column */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              placeholder="Column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              disabled={disabled}
            />
          </div>
          <Select value={newColumnType} onValueChange={(value: TableColumn['type']) => setNewColumnType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={addColumn} disabled={disabled}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Existing Columns */}
        <div className="flex flex-wrap gap-2">
          {value.columns.map((column) => (
            <div key={column.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
              {editingColumn === column.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={column.name}
                    onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                    className="w-24 h-6 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingColumn(null)}
                    className="h-6 w-6 p-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium">{column.name}</span>
                  <span className="text-xs text-muted-foreground">({column.type})</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingColumn(column.id)}
                    disabled={disabled}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteColumn(column.id)}
                    disabled={disabled}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Table Data */}
      {value.columns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Table Data</Label>
            <Button type="button" onClick={addRow} disabled={disabled} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  {value.columns.map((column) => (
                    <th
                      key={column.id}
                      className="border border-border p-2 text-left text-sm font-medium"
                    >
                      {column.name}
                    </th>
                  ))}
                  <th className="border border-border p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {value.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {value.columns.map((column) => (
                      <td key={column.id} className="border border-border p-2">
                        {renderCellInput(row, column, rowIndex)}
                      </td>
                    ))}
                    <td className="border border-border p-2 text-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRow(rowIndex)}
                        disabled={disabled}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {value.rows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No data rows. Click "Add Row" to get started.
            </div>
          )}
        </div>
      )}

      {value.columns.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No columns defined. Add a column to get started.
        </div>
      )}
    </div>
  );
};
