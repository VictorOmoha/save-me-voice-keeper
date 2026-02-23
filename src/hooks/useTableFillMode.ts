import { useState, useRef, useCallback } from 'react';
import { TableData, TableColumn } from '@/components/forms/types';
import { toast } from 'sonner';

interface UseTableFillModeOptions {
  value: TableData;
  onChange: (value: TableData) => void;
  onFocusField?: (rowIndex: number, columnId: string) => void;
}

export const useTableFillMode = ({ value, onChange, onFocusField }: UseTableFillModeOptions) => {
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; columnId: string } | null>(null);
  const [bulkAddCount, setBulkAddCount] = useState(5);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  // Add single row with smart defaults
  const addRow = useCallback((template?: Record<string, unknown>) => {
    const newRow: Record<string, unknown> = {};
    
    value.columns.forEach(col => {
      if (template && template[col.id] !== undefined) {
        newRow[col.id] = template[col.id];
      } else {
        // Smart defaults based on column type
        switch (col.type) {
          case 'checkbox':
            newRow[col.id] = false;
            break;
          case 'number':
            newRow[col.id] = '';
            break;
          case 'date':
            newRow[col.id] = '';
            break;
          default:
            newRow[col.id] = '';
        }
      }
    });

    const updatedValue = {
      ...value,
      rows: [...value.rows, newRow]
    };
    onChange(updatedValue);

    // Auto-focus first empty field in new row
    const newRowIndex = value.rows.length;
    const firstColumn = value.columns[0];
    if (firstColumn) {
      setTimeout(() => {
        const inputKey = `${newRowIndex}_${firstColumn.id}`;
        const input = inputRefs.current[inputKey];
        if (input) {
          input.focus();
          input.select();
        }
        setFocusedCell({ rowIndex: newRowIndex, columnId: firstColumn.id });
        onFocusField?.(newRowIndex, firstColumn.id);
      }, 100);
    }

    return newRowIndex;
  }, [value, onChange, onFocusField]);

  // Add multiple rows at once
  const addBulkRows = useCallback((count: number = bulkAddCount, template?: Record<string, unknown>) => {
    if (count <= 0 || count > 50) {
      toast.error('Please enter a valid number between 1 and 50');
      return;
    }

    const newRows: Record<string, unknown>[] = [];
    for (let i = 0; i < count; i++) {
      const newRow: Record<string, unknown> = {};
      value.columns.forEach(col => {
        if (template && template[col.id] !== undefined) {
          newRow[col.id] = template[col.id];
        } else {
          switch (col.type) {
            case 'checkbox':
              newRow[col.id] = false;
              break;
            case 'number':
              newRow[col.id] = '';
              break;
            case 'date':
              newRow[col.id] = '';
              break;
            default:
              newRow[col.id] = '';
          }
        }
      });
      newRows.push(newRow);
    }

    const updatedValue = {
      ...value,
      rows: [...value.rows, ...newRows]
    };
    onChange(updatedValue);
    
    toast.success(`Added ${count} rows successfully`);

    // Focus first cell of first new row
    const firstNewRowIndex = value.rows.length;
    const firstColumn = value.columns[0];
    if (firstColumn) {
      setTimeout(() => {
        const inputKey = `${firstNewRowIndex}_${firstColumn.id}`;
        const input = inputRefs.current[inputKey];
        if (input) {
          input.focus();
        }
        setFocusedCell({ rowIndex: firstNewRowIndex, columnId: firstColumn.id });
      }, 100);
    }
  }, [value, onChange, bulkAddCount]);

  // Duplicate last row
  const duplicateLastRow = useCallback(() => {
    if (value.rows.length === 0) {
      toast.error('No rows to duplicate');
      return;
    }

    const lastRow = value.rows[value.rows.length - 1];
    const duplicatedRow = { ...lastRow };

    const updatedValue = {
      ...value,
      rows: [...value.rows, duplicatedRow]
    };
    onChange(updatedValue);

    toast.success('Last row duplicated');
    
    // Focus first cell of duplicated row
    const newRowIndex = value.rows.length;
    const firstColumn = value.columns[0];
    if (firstColumn) {
      setTimeout(() => {
        const inputKey = `${newRowIndex}_${firstColumn.id}`;
        const input = inputRefs.current[inputKey];
        if (input) {
          input.focus();
          input.select();
        }
        setFocusedCell({ rowIndex: newRowIndex, columnId: firstColumn.id });
      }, 100);
    }
  }, [value, onChange]);

  // Generate row template based on existing data patterns
  const generateRowTemplate = useCallback((): Record<string, unknown> | null => {
    if (value.rows.length === 0) return null;

    const template: Record<string, unknown> = {};
    
    value.columns.forEach(col => {
      const columnValues = value.rows.map(row => row[col.id]).filter(val => val !== '' && val != null);
      
      if (columnValues.length > 0) {
        switch (col.type) {
          case 'checkbox': {
            // Most common boolean value
            const trueCount = columnValues.filter(val => !!val).length;
            template[col.id] = trueCount > columnValues.length / 2;
            break;
          }
          case 'number': {
            // Average of existing numbers
            const numbers = columnValues.map(val => parseFloat(String(val))).filter(n => !isNaN(n));
            if (numbers.length > 0) {
              template[col.id] = Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
            }
            break;
          }
          case 'date': {
            // Most recent date
            const dates = columnValues.map(val => new Date(String(val))).filter(d => !isNaN(d.getTime()));
            if (dates.length > 0) {
              template[col.id] = dates.sort((a, b) => b.getTime() - a.getTime())[0].toISOString().split('T')[0];
            }
            break;
          }
          default: {
            // Most common text value
            const textValues = columnValues.map(val => String(val).trim()).filter(val => val !== '');
            if (textValues.length > 0) {
              const frequency: Record<string, number> = {};
              textValues.forEach(val => {
                frequency[val] = (frequency[val] || 0) + 1;
              });
              const mostCommon = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0];
              if (mostCommon[1] > 1) { // Only suggest if it appears more than once
                template[col.id] = mostCommon[0];
              }
            }
          }
        }
      }
    });

    return Object.keys(template).length > 0 ? template : null;
  }, [value]);

  // Register input ref for focus management
  const registerInputRef = useCallback((rowIndex: number, columnId: string, element: HTMLInputElement | null) => {
    const key = `${rowIndex}_${columnId}`;
    if (element) {
      inputRefs.current[key] = element;
    } else {
      delete inputRefs.current[key];
    }
  }, []);

  // Navigate between cells with keyboard
  const handleCellNavigation = useCallback((rowIndex: number, columnId: string, direction: 'up' | 'down' | 'left' | 'right' | 'enter') => {
    const currentColumnIndex = value.columns.findIndex(col => col.id === columnId);
    let nextRowIndex = rowIndex;
    let nextColumnIndex = currentColumnIndex;

    switch (direction) {
      case 'up':
        nextRowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'down':
      case 'enter':
        nextRowIndex = Math.min(value.rows.length - 1, rowIndex + 1);
        // If at last row and pressing enter, add new row
        if (direction === 'enter' && rowIndex === value.rows.length - 1) {
          const newRowIndex = addRow();
          nextRowIndex = newRowIndex;
        }
        break;
      case 'left':
        nextColumnIndex = Math.max(0, currentColumnIndex - 1);
        break;
      case 'right':
        nextColumnIndex = Math.min(value.columns.length - 1, currentColumnIndex + 1);
        break;
    }

    const nextColumn = value.columns[nextColumnIndex];
    if (nextColumn && nextRowIndex < value.rows.length) {
      const inputKey = `${nextRowIndex}_${nextColumn.id}`;
      const input = inputRefs.current[inputKey];
      if (input) {
        input.focus();
        setFocusedCell({ rowIndex: nextRowIndex, columnId: nextColumn.id });
      }
    }
  }, [value, addRow]);

  return {
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
  };
};