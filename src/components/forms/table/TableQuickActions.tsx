import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Zap, Layers } from 'lucide-react';
import { TableData } from '../types';

interface TableQuickActionsProps {
  tableData: TableData;
  onAddRow: () => void;
  onAddBulkRows: (count: number) => void;
  onDuplicateLastRow: () => void;
  onAddWithTemplate: (template: Record<string, unknown>) => void;
  bulkAddCount: number;
  setBulkAddCount: (count: number) => void;
  template?: Record<string, unknown> | null;
}

export const TableQuickActions: React.FC<TableQuickActionsProps> = ({
  tableData,
  onAddRow,
  onAddBulkRows,
  onDuplicateLastRow,
  onAddWithTemplate,
  bulkAddCount,
  setBulkAddCount,
  template
}) => {
  const hasRows = tableData.rows.length > 0;
  const hasTemplate = template && Object.keys(template).length > 0;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h4 className="font-medium text-blue-900 dark:text-blue-100">Quick Actions</h4>
        <Badge variant="secondary" className="text-xs">
          Fill Mode
        </Badge>
      </div>

      {/* Primary Actions Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={onAddRow}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Row
        </Button>

        {hasRows && (
          <Button
            type="button"
            onClick={onDuplicateLastRow}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            <Copy className="h-4 w-4 mr-1" />
            Duplicate Last
          </Button>
        )}

        {hasTemplate && (
          <Button
            type="button"
            onClick={() => onAddWithTemplate(template)}
            variant="outline"
            size="sm"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
          >
            <Layers className="h-4 w-4 mr-1" />
            Smart Add
          </Button>
        )}
      </div>

      {/* Bulk Add Section */}
      <div className="flex items-center gap-2 pt-2 border-t border-blue-200 dark:border-blue-800">
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200 min-w-fit">
          Bulk Add:
        </span>
        <Input
          type="number"
          min="1"
          max="50"
          value={bulkAddCount}
          onChange={(e) => setBulkAddCount(parseInt(e.target.value) || 5)}
          className="w-16 h-8 text-center border-blue-300 focus:border-blue-500"
        />
        <span className="text-sm text-blue-600 dark:text-blue-400">rows</span>
        <Button
          type="button"
          onClick={() => onAddBulkRows(bulkAddCount)}
          size="sm"
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
        >
          Add {bulkAddCount}
        </Button>
        {hasTemplate && (
          <Button
            type="button"
            onClick={() => {
              for (let i = 0; i < bulkAddCount; i++) {
                onAddWithTemplate(template);
              }
            }}
            size="sm"
            variant="outline"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
          >
            Add {bulkAddCount} Smart
          </Button>
        )}
      </div>

      {/* Template Preview */}
      {hasTemplate && (
        <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
          <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
            Smart Template Preview:
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(template).map(([key, value]) => {
              const column = tableData.columns.find(col => col.id === key);
              if (!column || !value) return null;
              
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                >
                  {column.name}: {String(value).slice(0, 20)}{String(value).length > 20 ? '...' : ''}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 rounded p-2">
        <strong>Shortcuts:</strong> Tab (next field), Shift+Tab (previous), Enter (next row/add row), Arrow keys (navigate)
      </div>
    </div>
  );
};