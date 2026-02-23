import React, { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, Focus } from 'lucide-react';
import { TableData, TableColumn } from '../types';
import { TableQuickActions } from './TableQuickActions';
import { useTableFillMode } from '@/hooks/useTableFillMode';

interface EnhancedTableFillModeProps {
  value: TableData;
  onChange: (value: TableData) => void;
  disabled?: boolean;
  isVoiceActive?: boolean;
  highlightedCell?: { rowIndex: number; columnId: string } | null;
}

export const EnhancedTableFillMode: React.FC<EnhancedTableFillModeProps> = ({
  value,
  onChange,
  disabled = false,
  isVoiceActive = false,
  highlightedCell
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  
  const {
    focusedCell,
    bulkAddCount,
    setBulkAddCount,
    addRow,
    addBulkRows,
    duplicateLastRow,
    generateRowTemplate,
    registerInputRef,
    handleCellNavigation,
    setFocusedCell
  } = useTableFillMode({
    value,
    onChange,
    onFocusField: (rowIndex, columnId) => {
      // Scroll to focused cell if needed
      setTimeout(() => {
        const cell = document.querySelector(`[data-cell="${rowIndex}-${columnId}"]`);
        if (cell) {
          cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  });

  const updateRowValue = useCallback((rowIndex: number, columnId: string, newValue: unknown) => {
    const updatedValue = {
      ...value,
      rows: value.rows.map((row, index) => 
        index === rowIndex ? { ...row, [columnId]: newValue } : row
      )
    };
    onChange(updatedValue);
  }, [value, onChange]);

  const deleteRow = useCallback((rowIndex: number) => {
    const updatedValue = {
      ...value,
      rows: value.rows.filter((_, index) => index !== rowIndex)
    };
    onChange(updatedValue);
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, columnId: string) => {
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          handleCellNavigation(rowIndex, columnId, 'left');
        } else {
          handleCellNavigation(rowIndex, columnId, 'right');
        }
        break;
      case 'Enter':
        e.preventDefault();
        handleCellNavigation(rowIndex, columnId, 'enter');
        break;
      case 'ArrowUp':
        e.preventDefault();
        handleCellNavigation(rowIndex, columnId, 'up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleCellNavigation(rowIndex, columnId, 'down');
        break;
      case 'ArrowLeft':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleCellNavigation(rowIndex, columnId, 'left');
        }
        break;
      case 'ArrowRight':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleCellNavigation(rowIndex, columnId, 'right');
        }
        break;
    }
  }, [handleCellNavigation]);

  const renderCellInput = useCallback((row: Record<string, unknown>, column: TableColumn, rowIndex: number) => {
    const cellValue = row[column.id] || '';
    const isFocused = focusedCell?.rowIndex === rowIndex && focusedCell?.columnId === column.id;
    const isHighlighted = highlightedCell?.rowIndex === rowIndex && highlightedCell?.columnId === column.id;
    
    const baseClassName = `transition-all duration-300 ${
      isFocused ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
    } ${
      isHighlighted ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''
    }`;

    const commonProps = {
      disabled,
      className: baseClassName,
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, rowIndex, column.id),
      onFocus: () => setFocusedCell({ rowIndex, columnId: column.id }),
      ref: (el: HTMLInputElement | null) => registerInputRef(rowIndex, column.id, el),
      'data-cell': `${rowIndex}-${column.id}`
    };

    switch (column.type) {
      case 'checkbox':
        return (
          <div className="flex justify-center">
            <Checkbox
              checked={!!cellValue}
              onCheckedChange={(checked) => updateRowValue(rowIndex, column.id, checked)}
              disabled={disabled}
              className={`transition-all duration-300 ${
                isFocused ? 'ring-2 ring-blue-500' : ''
              } ${
                isHighlighted ? 'ring-2 ring-orange-500' : ''
              }`}
              onFocus={() => setFocusedCell({ rowIndex, columnId: column.id })}
            />
          </div>
        );
      case 'number':
        return (
          <Input
            type="number"
            value={cellValue}
            onChange={(e) => updateRowValue(rowIndex, column.id, e.target.value)}
            placeholder="0"
            {...commonProps}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={cellValue}
            onChange={(e) => updateRowValue(rowIndex, column.id, e.target.value)}
            {...commonProps}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={cellValue}
            onChange={(e) => updateRowValue(rowIndex, column.id, e.target.value)}
            placeholder={`Enter ${column.name.toLowerCase()}...`}
            {...commonProps}
          />
        );
    }
  }, [
    focusedCell,
    highlightedCell,
    disabled,
    handleKeyDown,
    setFocusedCell,
    registerInputRef,
    updateRowValue
  ]);

  const template = generateRowTemplate();

  if (!value || !value.columns || value.columns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border border-border rounded-lg">
        No table structure defined. Please set up columns first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <TableQuickActions
        tableData={value}
        onAddRow={() => addRow()}
        onAddBulkRows={addBulkRows}
        onDuplicateLastRow={duplicateLastRow}
        onAddWithTemplate={(template) => addRow(template)}
        bulkAddCount={bulkAddCount}
        setBulkAddCount={setBulkAddCount}
        template={template}
      />

      {/* Enhanced Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Header with stats */}
        <div className="bg-muted/30 p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Focus className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Fill Data</span>
              {isVoiceActive && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  🎤 Voice Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                {value.rows.length} row{value.rows.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline">
                {value.columns.length} column{value.columns.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table ref={tableRef} className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                {value.columns.map((column) => (
                  <th
                    key={column.id}
                    className="border-r border-border p-3 text-left text-sm font-medium min-w-[150px]"
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {column.type}
                      </Badge>
                    </div>
                  </th>
                ))}
                <th className="border-l border-border p-3 w-12 text-center">
                  <Trash2 className="h-4 w-4 text-muted-foreground mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {value.rows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`transition-colors hover:bg-muted/20 ${
                    focusedCell?.rowIndex === rowIndex ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  {value.columns.map((column) => (
                    <td 
                      key={column.id} 
                      className="border-r border-b border-border p-2"
                    >
                      {renderCellInput(row, column, rowIndex)}
                    </td>
                  ))}
                  <td className="border-l border-b border-border p-2 text-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRow(rowIndex)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
          <div className="text-center py-12 text-muted-foreground">
            <Focus className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="font-medium mb-1">Ready to fill data!</p>
            <p className="text-sm">Click "Add Row" above to start adding your data.</p>
          </div>
        )}
      </div>

      {/* Footer hints */}
      {value.rows.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span>💡 <strong>Tips:</strong></span>
            <span>Use Tab to move between cells</span>
            <span>Press Enter to go to next row</span>
            <span>Use arrow keys to navigate</span>
            {template && <span>Click "Smart Add" for suggested values</span>}
          </div>
        </div>
      )}
    </div>
  );
};