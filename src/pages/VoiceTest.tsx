
import React, { useState } from 'react';
import { VoiceCommandTest } from '@/components/VoiceCommandTest';
import { VoiceSystemTest } from '@/components/VoiceSystemTest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const VoiceTest = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Voice System Testing</h1>
          <p className="text-muted-foreground">
            Comprehensive test suite for voice recognition accuracy and system diagnostics
          </p>
        </div>
        
        <Tabs defaultValue="diagnostics" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
            <TabsTrigger value="commands">Command Testing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagnostics" className="mt-6">
            <VoiceSystemTest />
          </TabsContent>
          
          <TabsContent value="commands" className="mt-6">
            <VoiceCommandTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VoiceTest;
