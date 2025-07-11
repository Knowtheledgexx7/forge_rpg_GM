import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Locations() {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadDescription, setNewThreadDescription] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [isIcAction, setIsIcAction] = useState(true);

  const { data: character } = useQuery({
    queryKey: ["/api/character"],
    retry: false,
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
    retry: false,
  });

  const { data: threads } = useQuery({
    queryKey: ["/api/locations", selectedLocation, "threads"],
    enabled: !!selectedLocation,
    retry: false,
  });

  const { data: posts } = useQuery({
    queryKey: ["/api/threads", selectedThread, "posts"],
    enabled: !!selectedThread,
    retry: false,
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data: { locationId: number; title: string; description: string }) => {
      const response = await apiRequest("POST", `/api/locations/${data.locationId}/threads`, {
        title: data.title,
        description: data.description,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", selectedLocation, "threads"] });
      setNewThreadTitle("");
      setNewThreadDescription("");
      toast({
        title: "Thread Created",
        description: "Your roleplay thread has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { threadId: number; content: string; isIcAction: boolean }) => {
      const response = await apiRequest("POST", `/api/threads/${data.threadId}/posts`, {
        content: data.content,
        isIcAction: data.isIcAction,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads", selectedThread, "posts"] });
      setNewPostContent("");
      toast({
        title: "Post Added",
        description: "Your roleplay post has been added to the thread.",
      });
    },
    onError: (error) => {
      toast({
        title: "Post Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateThread = () => {
    if (!selectedLocation || !newThreadTitle.trim()) return;
    
    createThreadMutation.mutate({
      locationId: selectedLocation,
      title: newThreadTitle,
      description: newThreadDescription,
    });
  };

  const handleCreatePost = () => {
    if (!selectedThread || !newPostContent.trim()) return;
    
    createPostMutation.mutate({
      threadId: selectedThread,
      content: newPostContent,
      isIcAction,
    });
  };

  if (!character) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navigation character={character} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Locations Sidebar */}
        <div className="w-80 bg-imperial-gray border-r border-corporate-gold/30 flex flex-col">
          <div className="p-4 border-b border-corporate-gold/30">
            <h2 className="text-lg font-orbitron text-corporate-gold glow-text">
              <i className="fas fa-map-marker-alt mr-2"></i>Locations
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto scroll-custom p-4 space-y-3">
            {locations?.map((location: any) => (
              <Card 
                key={location.id} 
                className={`cursor-pointer transition-all ${
                  selectedLocation === location.id 
                    ? 'bg-corporate-gold/20 border-corporate-gold' 
                    : 'bg-panel-gray border-corporate-gold/30 hover:border-corporate-gold/60'
                }`}
                onClick={() => setSelectedLocation(location.id)}
              >
                <CardContent className="p-3">
                  <h3 className="font-orbitron text-corporate-gold text-sm mb-1">{location.name}</h3>
                  <p className="text-xs text-gray-300 mb-2">{location.planet} • {location.system}</p>
                  <Badge variant="outline" className="text-xs">
                    {location.locationType}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            
            {(!locations || locations.length === 0) && (
              <p className="text-gray-400 text-sm text-center">No locations available</p>
            )}
          </div>
        </div>

        {/* Threads View */}
        <div className="w-96 bg-space-blue border-r border-corporate-gold/30 flex flex-col">
          <div className="p-4 border-b border-corporate-gold/30">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-orbitron text-corporate-gold glow-text">
                <i className="fas fa-comments mr-2"></i>Roleplay Threads
              </h2>
              {selectedLocation && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-corporate-gold text-space-dark">
                      <i className="fas fa-plus mr-1"></i>New
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-imperial-gray border-corporate-gold/50">
                    <DialogHeader>
                      <DialogTitle className="text-corporate-gold font-orbitron">Create New Thread</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Thread title"
                        value={newThreadTitle}
                        onChange={(e) => setNewThreadTitle(e.target.value)}
                        className="bg-panel-gray border-corporate-gold/50 text-gray-200"
                      />
                      <Textarea
                        placeholder="Thread description"
                        value={newThreadDescription}
                        onChange={(e) => setNewThreadDescription(e.target.value)}
                        className="bg-panel-gray border-corporate-gold/50 text-gray-200"
                        rows={3}
                      />
                      <Button
                        onClick={handleCreateThread}
                        disabled={createThreadMutation.isPending || !newThreadTitle.trim()}
                        className="w-full bg-corporate-gold text-space-dark"
                      >
                        {createThreadMutation.isPending ? "Creating..." : "Create Thread"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scroll-custom p-4 space-y-3">
            {selectedLocation ? (
              threads?.map((thread: any) => (
                <Card 
                  key={thread.id} 
                  className={`cursor-pointer transition-all ${
                    selectedThread === thread.id 
                      ? 'bg-corporate-gold/20 border-corporate-gold' 
                      : 'bg-panel-gray border-corporate-gold/30 hover:border-corporate-gold/60'
                  }`}
                  onClick={() => setSelectedThread(thread.id)}
                >
                  <CardContent className="p-3">
                    <h3 className="font-orbitron text-corporate-gold text-sm mb-1">{thread.title}</h3>
                    <p className="text-xs text-gray-300 mb-2">{thread.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>by {thread.creator.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {thread.postCount} posts
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center">Select a location to view threads</p>
            )}
            
            {selectedLocation && threads?.length === 0 && (
              <p className="text-gray-400 text-sm text-center">No threads in this location</p>
            )}
          </div>
        </div>

        {/* Posts View */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-corporate-gold/30 bg-imperial-gray">
            <h2 className="text-lg font-orbitron text-corporate-gold glow-text">
              <i className="fas fa-scroll mr-2"></i>
              {selectedThread ? "Thread Posts" : "Select a Thread"}
            </h2>
          </div>
          
          {selectedThread ? (
            <>
              <div className="flex-1 overflow-y-auto scroll-custom p-4 space-y-4">
                {posts?.map((post: any) => (
                  <Card key={post.id} className="bg-panel-gray border-corporate-gold/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-corporate-gold rounded-full flex items-center justify-center">
                            <i className={`${post.character.avatar || "fas fa-user"} text-space-dark text-sm`}></i>
                          </div>
                          <div>
                            <span className="font-orbitron text-corporate-gold">{post.character.name}</span>
                            <div className="text-xs text-gray-400">
                              {new Date(post.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant={post.isIcAction ? "default" : "secondary"} className="text-xs">
                          {post.isIcAction ? "IC" : "OOC"}
                        </Badge>
                      </div>
                      <div className="text-gray-200 whitespace-pre-wrap">{post.content}</div>
                    </CardContent>
                  </Card>
                ))}
                
                {posts?.length === 0 && (
                  <p className="text-gray-400 text-center">No posts in this thread yet</p>
                )}
              </div>
              
              {/* New Post Form */}
              <div className="p-4 border-t border-corporate-gold/30 bg-imperial-gray">
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <Select value={isIcAction ? "ic" : "ooc"} onValueChange={(value) => setIsIcAction(value === "ic")}>
                      <SelectTrigger className="w-24 bg-panel-gray border-corporate-gold/50 text-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-panel-gray border-corporate-gold/50">
                        <SelectItem value="ic" className="text-gray-200">IC</SelectItem>
                        <SelectItem value="ooc" className="text-gray-200">OOC</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-400">
                      {isIcAction ? "In Character" : "Out of Character"}
                    </span>
                  </div>
                  <Textarea
                    placeholder="Write your roleplay post..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="bg-panel-gray border-corporate-gold/50 text-gray-200"
                    rows={3}
                  />
                  <Button
                    onClick={handleCreatePost}
                    disabled={createPostMutation.isPending || !newPostContent.trim()}
                    className="bg-corporate-gold text-space-dark"
                  >
                    {createPostMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Posting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400">Select a thread to view and participate in roleplay</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
