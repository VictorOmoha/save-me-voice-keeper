
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Video, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface DemoVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const VideoUpload = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videos, setVideos] = useState<DemoVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch videos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile || !user) {
      toast({
        title: "Error",
        description: "Please select a video file and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload video file
      const videoPath = `${Date.now()}-${videoFile.name}`;
      const videoUrl = await uploadFile(videoFile, 'demo-videos', videoPath);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailPath = `thumbnails/${Date.now()}-${thumbnailFile.name}`;
        thumbnailUrl = await uploadFile(thumbnailFile, 'demo-videos', thumbnailPath);
      }

      // Save video metadata to database
      const { error } = await supabase
        .from('demo_videos')
        .insert({
          title,
          description: description || null,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          is_active: isActive,
          uploaded_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbnailFile(null);
      setIsActive(false);
      
      // Refresh videos list
      fetchVideos();

    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const toggleVideoStatus = async (videoId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('demo_videos')
        .update({ is_active: !currentStatus })
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video status updated successfully!",
      });

      fetchVideos();
    } catch (error) {
      console.error('Error updating video status:', error);
      toast({
        title: "Error",
        description: "Failed to update video status",
        variant: "destructive",
      });
    }
  };

  const deleteVideo = async (videoId: string, videoUrl: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('demo_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      // Extract file path from URL and delete from storage
      const urlParts = videoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      await supabase.storage
        .from('demo-videos')
        .remove([fileName]);

      toast({
        title: "Success",
        description: "Video deleted successfully!",
      });

      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Demo Video
          </CardTitle>
          <CardDescription>
            Upload MP4 videos for the landing page demo section
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Video Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="video">Video File (MP4)</Label>
              <Input
                id="video"
                type="file"
                accept="video/mp4"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <div>
              <Label htmlFor="thumbnail">Thumbnail Image (Optional)</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="active">Make this video active</Label>
            </div>

            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? "Uploading..." : "Upload Video"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Manage Demo Videos
          </CardTitle>
          <CardDescription>
            View and manage uploaded demo videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No videos uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mt-1">{video.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        video.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {video.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={video.is_active}
                      onCheckedChange={() => toggleVideoStatus(video.id, video.is_active)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteVideo(video.id, video.video_url)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
