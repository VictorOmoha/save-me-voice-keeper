
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { CategoryView } from "@/components/CategoryView";
import { AllEntriesView } from "@/components/AllEntriesView";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardNavigation } from "@/hooks/useDashboardNavigation";
import { useDashboardEntryHandlers } from "@/hooks/useDashboardEntryHandlers";
import { DashboardMainContent } from "@/components/DashboardMainContent";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    savedEntries,
    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,
    saveEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    handleAddEntry,
    handleVoiceResult,
    handleVoiceCommand,
    handleEnhancedVoiceInput,
    isVoiceProcessing,
    lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    cancelCurrentOperation,
    isLoading,
  } = useDashboard();

  const {
    selectedCategory,
    showDocumentCreator,
    showAllEntries,
    setShowDocumentCreator,
    handleCategorySelect,
    handleAllEntriesSelect,
    handleBackToMain,
    handleCreateDocument,
  } = useDashboardNavigation();

  const {
    handleDocumentSave,
    handleDocumentCancel,
    handleCreateEntryForCategory,
    handleAddEntryWithCategory,
  } = useDashboardEntryHandlers(
    saveEntry,
    setShowDocumentCreator,
    setShowAddEntry,
    setEditingEntry,
    setFillingEntry
  );

  console.log('Dashboard state:', {
    selectedCategory,
    showDocumentCreator,
    showAddEntry,
    showAllEntries,
    editingEntry: editingEntry?.title,
    fillingEntry: fillingEntry?.title,
    totalEntries: savedEntries.length,
    isLoading,
    isVoiceProcessing,
    conversationState,
    hasPendingConfirmation
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state while entries are being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your entries...</p>
        </div>
      </div>
    );
  }

  const wrappedCategorySelect = (categoryName: string) => {
    handleCategorySelect(categoryName, setShowAddEntry, setEditingEntry, setFillingEntry);
  };

  const wrappedAllEntriesSelect = () => {
    handleAllEntriesSelect(setShowAddEntry, setEditingEntry, setFillingEntry);
  };

  const wrappedBackToMain = () => {
    handleBackToMain(setShowAddEntry, setEditingEntry, setFillingEntry);
  };

  return (
    <DashboardLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      userName={user?.full_name || user?.email}
      savedEntries={savedEntries}
      onAddEntry={handleAddEntryWithCategory}
      onCategorySelect={wrappedCategorySelect}
      onAllEntriesSelect={wrappedAllEntriesSelect}
    >
      {showAllEntries ? (
        <AllEntriesView
          entries={savedEntries}
          onBack={wrappedBackToMain}
          onEdit={editEntry}
          onDelete={deleteEntry}
          onFill={fillEntry}
          showAddEntry={showAddEntry}
          editingEntry={editingEntry}
          fillingEntry={fillingEntry}
          onSaveEntry={saveEntry}
          onCancelEdit={handleCancelEdit}
          getFormTitle={getFormTitle}
          getFormMode={getFormMode}
        />
      ) : selectedCategory ? (
        <CategoryView
          categoryName={selectedCategory}
          entries={savedEntries}
          onBack={wrappedBackToMain}
          onEdit={editEntry}
          onDelete={deleteEntry}
          onFill={fillEntry}
          onCreateEntry={handleCreateEntryForCategory}
          showDocumentCreator={showDocumentCreator}  
          showAddEntry={showAddEntry}
          editingEntry={editingEntry}
          fillingEntry={fillingEntry}
          onDocumentSave={handleDocumentSave}
          onDocumentCancel={handleDocumentCancel}
          onSaveEntry={saveEntry}
          onCancelEdit={handleCancelEdit}
          getFormTitle={getFormTitle}
          getFormMode={getFormMode}
        />
      ) : (
        <DashboardMainContent
          userName={user?.full_name || user?.email}
          userTier={user?.subscriptionTier}
          savedEntries={savedEntries}
          showDocumentCreator={showDocumentCreator}
          showAddEntry={showAddEntry}
          editingEntry={editingEntry}
          fillingEntry={fillingEntry}
          getFormTitle={getFormTitle}
          getFormMode={getFormMode}
          onDocumentSave={handleDocumentSave}
          onDocumentCancel={handleDocumentCancel}
          onSaveEntry={saveEntry}
          onCancelEdit={handleCancelEdit}
          onCategorySelect={wrappedCategorySelect}
          onAddEntry={handleAddEntryWithCategory}
          onCreateDocument={handleCreateDocument}
          onVoiceResult={handleVoiceResult}
          onVoiceCommand={handleVoiceCommand}
          onEditEntry={editEntry}
          onFillEntry={fillEntry}
          onEnhancedVoiceInput={handleEnhancedVoiceInput}
          isVoiceProcessing={isVoiceProcessing}
          lastVoiceCommand={lastVoiceCommand}
          conversationState={conversationState}
          hasPendingConfirmation={hasPendingConfirmation}
          onCancelVoiceOperation={cancelCurrentOperation}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
