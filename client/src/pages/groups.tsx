import { useState } from "react";
import { Link } from "wouter";
import { useGroups, useCreateGroup, useJoinGroup } from "@/hooks/use-groups";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Key, Trophy, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Groups() {
  const { data: groups, isLoading } = useGroups();
  const { mutateAsync: createGroup, isPending: isCreating } = useCreateGroup();
  const { mutateAsync: joinGroup, isPending: isJoining } = useJoinGroup();
  
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGroup({ name: createName });
      toast({ title: "Group Created", description: `${createName} is ready!` });
      setCreateOpen(false);
      setCreateName("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinGroup({ inviteCode: joinCode });
      toast({ title: "Joined Group", description: "You've been added to the leaderboard." });
      setJoinOpen(false);
      setJoinCode("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-card rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Card key={i} className="h-48 bg-card border-border/50" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Your Groups</h1>
          <p className="text-muted-foreground mt-1">Compete with friends and track the best bettors.</p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border/50 hover:bg-white/5">
                <Key className="w-4 h-4 mr-2" /> Join
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Join a Group</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleJoin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Invite Code</Label>
                  <Input 
                    id="code" 
                    value={joinCode} 
                    onChange={e => setJoinCode(e.target.value)}
                    placeholder="Enter code (e.g. ABC123XYZ)"
                    className="bg-background border-border"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isJoining}>
                  {isJoining ? "Joining..." : "Join Group"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Create
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Create New Group</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input 
                    id="name" 
                    value={createName} 
                    onChange={e => setCreateName(e.target.value)}
                    placeholder="e.g. Office Pool"
                    className="bg-background border-border"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Group"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {groups?.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border/50 border-dashed">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-2">No groups yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Create a new group to invite friends, or join an existing one using an invite code.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground">
            Create your first group
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups?.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="p-6 bg-card border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer group shadow-lg shadow-black/10 hover:-translate-y-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="font-mono text-xs bg-white/5 border-border no-default-active-elevate">
                    {group.inviteCode}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold font-display text-foreground mb-2">{group.name}</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 border-t border-border/50 pt-4">
                  <span>View Leaderboard</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Dummy badge component since it wasn't requested explicitly but used above for layout
function Badge({ children, className, variant }: any) {
  return <span className={`px-2.5 py-0.5 rounded-full font-medium ${className}`}>{children}</span>;
}
