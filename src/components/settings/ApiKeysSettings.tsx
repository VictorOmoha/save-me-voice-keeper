import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export const ApiKeysSettings = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user, fetchApiKeys]);

  const fetchApiKeys = useCallback(async () => {
    if (!user) return;

    try {
      const apiKeysRef = collection(db, 'api_keys');
      const q = query(
        apiKeysRef,
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const keys: ApiKey[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        keys.push({
          id: docSnap.id,
          name: data.name || '',
          key_prefix: data.key_prefix || '',
          permissions: Array.isArray(data.permissions) ? data.permissions : ['read', 'write'],
          is_active: data.is_active ?? true,
          last_used_at: data.last_used_at?.toDate?.()?.toISOString() || null,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });

      setApiKeys(keys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    }
  }, [user]);

  const generateApiKey = () => {
    // Generate a secure API key
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sm_'; // Save Me prefix
    for (let i = 0; i < 32; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  };

  const hashApiKey = async (apiKey: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create API keys');
      return;
    }

    setIsLoading(true);
    try {
      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);
      const keyPrefix = apiKey.substring(0, 7) + '...';

      const apiKeysRef = collection(db, 'api_keys');
      await addDoc(apiKeysRef, {
        user_id: user.uid,
        name: newKeyName.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: ['read', 'write'],
        is_active: true,
        created_at: serverTimestamp()
      });

      setGeneratedKey(apiKey);
      setNewKeyName("");
      fetchApiKeys();
      toast.success('API key created successfully');
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      const keyRef = doc(db, 'api_keys', id);
      await deleteDoc(keyRef);

      fetchApiKeys();
      toast.success('API key deleted successfully');
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Keys
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate API keys to connect Save Me with Make.com and other automation platforms
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-sm">Your API Keys</p>
            <p className="text-xs text-muted-foreground">{apiKeys.length} keys created</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyName">API Key Name</Label>
                  <Input
                    id="keyName"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Make.com Integration"
                  />
                </div>
                <Button 
                  onClick={handleCreateApiKey} 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create API Key'}
                </Button>
                
                {generatedKey && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium text-green-600">API Key Created!</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={showGeneratedKey ? generatedKey : '••••••••••••••••••••••••••••••••••••'}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowGeneratedKey(!showGeneratedKey)}
                      >
                        {showGeneratedKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedKey)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Save this API key securely. You won't be able to see it again.
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{apiKey.name}</span>
                  <Badge 
                    variant={apiKey.is_active ? "secondary" : "outline"}
                    className={apiKey.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : ""}
                  >
                    {apiKey.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Key: {apiKey.key_prefix}</p>
                  <p>Created: {formatDate(apiKey.created_at)}</p>
                  {apiKey.last_used_at && (
                    <p>Last used: {formatDate(apiKey.last_used_at)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`API Key: ${apiKey.key_prefix} (Use the full key from when you created it)`)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteApiKey(apiKey.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {apiKeys.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No API keys created yet</p>
              <p className="text-xs">Create your first API key to start automating with Make.com</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium text-sm mb-2">How to use with Make.com:</h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Create an API key above</li>
            <li>In Make.com, add an HTTP module</li>
            <li>Set the URL to your Firebase Cloud Function endpoint (setup required)</li>
            <li>Add header: <code className="bg-background px-1 rounded">Authorization: Bearer YOUR_API_KEY</code></li>
            <li>Configure your automation triggers and actions</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
