import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus } from 'lucide-react';
import { TableData, TableColumn } from '../types';
import { toast } from 'sonner';

interface ShoppingListTemplateProps {
  onApplyTemplate: (tableData: TableData) => void;
}

export const ShoppingListTemplate: React.FC<ShoppingListTemplateProps> = ({
  onApplyTemplate
}) => {
  const createShoppingListTemplate = (): TableData => {
    const columns: TableColumn[] = [
      { id: 'item', name: 'Item', type: 'text', required: true },
      { id: 'category', name: 'Category', type: 'text', required: false },
      { id: 'quantity', name: 'Quantity', type: 'number', required: false },
      { id: 'unit', name: 'Unit', type: 'text', required: false },
      { id: 'price', name: 'Price', type: 'number', required: false },
      { id: 'purchased', name: 'Purchased', type: 'checkbox', required: false },
      { id: 'notes', name: 'Notes', type: 'text', required: false }
    ];

    const sampleRows = [
      {
        item: 'Milk',
        category: 'Dairy',
        quantity: 1,
        unit: 'gallon',
        price: 3.99,
        purchased: false,
        notes: 'Organic preferred'
      },
      {
        item: 'Bread',
        category: 'Bakery',
        quantity: 2,
        unit: 'loaves',
        price: 2.50,
        purchased: false,
        notes: 'Whole grain'
      },
      {
        item: 'Bananas',
        category: 'Produce',
        quantity: 6,
        unit: 'pieces',
        price: 1.20,
        purchased: true,
        notes: ''
      }
    ];

    return { columns, rows: sampleRows };
  };

  const createGroceryListTemplate = (): TableData => {
    const columns: TableColumn[] = [
      { id: 'item', name: 'Item', type: 'text', required: true },
      { id: 'aisle', name: 'Aisle', type: 'text', required: false },
      { id: 'quantity', name: 'Qty', type: 'number', required: false },
      { id: 'priority', name: 'Priority', type: 'text', required: false },
      { id: 'got_it', name: 'Got It', type: 'checkbox', required: false }
    ];

    return { columns, rows: [] };
  };

  const createInventoryTemplate = (): TableData => {
    const columns: TableColumn[] = [
      { id: 'item', name: 'Item Name', type: 'text', required: true },
      { id: 'location', name: 'Location', type: 'text', required: false },
      { id: 'quantity', name: 'Quantity', type: 'number', required: false },
      { id: 'expiry_date', name: 'Expiry Date', type: 'date', required: false },
      { id: 'low_stock', name: 'Low Stock Alert', type: 'checkbox', required: false }
    ];

    return { columns, rows: [] };
  };

  const createMealPlanTemplate = (): TableData => {
    const columns: TableColumn[] = [
      { id: 'day', name: 'Day', type: 'text', required: true },
      { id: 'meal', name: 'Meal', type: 'text', required: true },
      { id: 'dish', name: 'Dish', type: 'text', required: false },
      { id: 'prep_time', name: 'Prep Time (min)', type: 'number', required: false },
      { id: 'prepared', name: 'Prepared', type: 'checkbox', required: false }
    ];

    const sampleRows = [
      { day: 'Monday', meal: 'Breakfast', dish: 'Oatmeal with berries', prep_time: 10, prepared: false },
      { day: 'Monday', meal: 'Lunch', dish: 'Chicken salad', prep_time: 15, prepared: false },
      { day: 'Monday', meal: 'Dinner', dish: 'Spaghetti with marinara', prep_time: 30, prepared: false }
    ];

    return { columns, rows: sampleRows };
  };

  const handleApplyTemplate = (templateName: string, templateFunction: () => TableData) => {
    const tableData = templateFunction();
    onApplyTemplate(tableData);
    toast.success(`${templateName} template applied successfully!`);
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Table Templates</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Quick-start templates for common table types. Select one to get started with pre-configured columns.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <h4 className="font-medium text-sm">Shopping List</h4>
          <p className="text-xs text-muted-foreground">
            Complete shopping list with items, categories, quantities, prices, and purchase status.
          </p>
          <Button
            size="sm"
            onClick={() => handleApplyTemplate('Shopping List', createShoppingListTemplate)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Use Template
          </Button>
        </div>

        <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <h4 className="font-medium text-sm">Quick Grocery List</h4>
          <p className="text-xs text-muted-foreground">
            Simple grocery list with items, aisles, quantities, and priority levels.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleApplyTemplate('Grocery List', createGroceryListTemplate)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Use Template
          </Button>
        </div>

        <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <h4 className="font-medium text-sm">Kitchen Inventory</h4>
          <p className="text-xs text-muted-foreground">
            Track pantry items, locations, quantities, expiry dates, and low stock alerts.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleApplyTemplate('Kitchen Inventory', createInventoryTemplate)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Use Template
          </Button>
        </div>

        <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <h4 className="font-medium text-sm">Meal Planner</h4>
          <p className="text-xs text-muted-foreground">
            Weekly meal planning with days, meals, dishes, prep times, and completion status.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleApplyTemplate('Meal Planner', createMealPlanTemplate)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Use Template
          </Button>
        </div>
      </div>
    </div>
  );
};