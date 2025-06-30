

import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DataEntryForm } from "@/components/DataEntryForm";
import { Sidebar } from "@/components/Sidebar";
import { StatsCards } from "@/components/StatsCards";
import { RecentEntries } from "@/components/RecentEntries";
import { CategoriesPanel } from "@/components/CategoriesPanel";
import { NewQuickActions } from "@/components/NewQuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Bell, Moon, User as UserIcon, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";

export interface FieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea';
}

export interface SavedEntry {
  id: string;
  title: string;
  fields: Record<string, any>;
  fieldDefinitions?: FieldDefinition[]; // Add this to store form structure
  createdAt: Date;
  updatedAt: Date;
}

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    savedEntries,
    showAddEntry,
    editingEntry,
    fillingEntry,
    saveEntry,
    deleteEntry,
    bulkDeleteEntries,
    editEntry,
    fillEntry,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    filteredEntries,
    handleVoiceCommand,
    handleAddEntry,
    handleVoiceResult,
  } = useDashboard();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        savedEntriesCount={savedEntries.length} 
        onAddEntry={handleAddEntry}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search your entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Mic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Moon className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600">Here's what's happening with your information today.</p>
          </div>

          {/* Stats Cards */}
          <StatsCards totalEntries={savedEntries.length} />

          {/* Add/Edit Entry Form */}
          {showAddEntry && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>{getFormTitle()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataEntryForm 
                    onSave={saveEntry}
                    onCancel={handleCancelEdit}
                    editEntry={editingEntry}
                    templateEntry={fillingEntry}
                    mode={getFormMode()}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Entries */}
            <div className="lg:col-span-2">
              <RecentEntries entries={savedEntries} />
            </div>

            {/* Categories Panel */}
            <div>
              <CategoriesPanel />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <NewQuickActions 
              onAddEntry={handleAddEntry}
              onVoiceInput={() => handleVoiceResult("")}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
