import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Bell, Clock, LogOut, Trash2, User, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getMuted, setMuted } from "@/lib/sounds";

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: `${String(i).padStart(2, "0")}:00:00`, label: `${h}:00 ${ampm}` };
});

const AVATARS = [
  { id: "owl", emoji: "🦉" },
  { id: "fox", emoji: "🦊" },
  { id: "panda", emoji: "🐼" },
  { id: "rabbit", emoji: "🐰" },
  { id: "dolphin", emoji: "🐬" },
  { id: "lion", emoji: "🦁" },
];

interface ChildData {
  id: string;
  name: string;
  age: number;
  avatar_url: string | null;
}

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00:00");
  const [soundMuted, setSoundMuted] = useState(getMuted());
  const [children, setChildren] = useState<ChildData[]>([]);
  const [profileEmail, setProfileEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileEmail(user.email || "");
    loadSettings();
    loadChildren();
  }, [user]);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("reminder_enabled, reminder_time")
      .eq("id", user!.id)
      .single();
    if (data) {
      setReminderEnabled(data.reminder_enabled || false);
      if (data.reminder_time) setReminderTime(data.reminder_time);
    }
  };

  const loadChildren = async () => {
    const { data } = await supabase
      .from("children")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at");
    setChildren(data || []);
  };

  const handleSaveReminders = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ reminder_enabled: reminderEnabled, reminder_time: reminderTime })
      .eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Settings updated." });
    }
  };

  const handleUpdateChild = async (child: ChildData) => {
    const { error } = await supabase
      .from("children")
      .update({ name: child.name, age: child.age, avatar_url: child.avatar_url })
      .eq("id", child.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${child.name}'s profile updated.` });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f4ed]">
        <p className="text-[#87867f]">Loading...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      <header className="border-b border-[#e5e4de] bg-[#faf9f5]">
        <div className="container flex h-14 items-center gap-3">
          <button onClick={() => navigate("/app")} className="text-[#87867f] hover:text-[#141413] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-serif text-lg text-[#141413]">Settings</h1>
        </div>
      </header>

      <div className="container max-w-lg py-8 space-y-6">
        {/* Profile */}
        <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="h-5 w-5 text-[#c96442]" />
            <h2 className="font-serif text-lg text-[#141413]">Profile</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-[#87867f]">Email</Label>
              <Input value={profileEmail} disabled className="h-11 rounded-xl bg-[#e5e4de]/50 mt-1" />
            </div>
          </div>
        </div>

        {/* Children */}
        <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
          <h2 className="font-serif text-lg text-[#141413] mb-5">Children</h2>
          <div className="space-y-5">
            {children.map((child) => (
              <div key={child.id} className="rounded-xl bg-white border border-[#e5e4de] p-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-[#87867f]">Name</Label>
                  <Input
                    value={child.name}
                    onChange={(e) => setChildren((prev) => prev.map((c) => c.id === child.id ? { ...c, name: e.target.value } : c))}
                    className="h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#87867f]">Age</Label>
                  <Select
                    value={String(child.age)}
                    onValueChange={(v) => setChildren((prev) => prev.map((c) => c.id === child.id ? { ...c, age: parseInt(v) } : c))}
                  >
                    <SelectTrigger className="h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 14 }, (_, j) => j + 3).map((age) => (
                        <SelectItem key={age} value={String(age)}>{age} years old</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#87867f]">Avatar</Label>
                  <div className="flex gap-2">
                    {AVATARS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setChildren((prev) => prev.map((c) => c.id === child.id ? { ...c, avatar_url: a.id } : c))}
                        className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                          child.avatar_url === a.id
                            ? "ring-2 ring-[#c96442] bg-[#c96442]/10"
                            : "bg-[#f5f4ed] hover:bg-[#e5e4de]"
                        }`}
                      >
                        {a.emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleUpdateChild(child)}
                  className="bg-[#c96442] hover:bg-[#b5593a] text-white rounded-lg text-xs h-9"
                >
                  Save Changes
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="h-5 w-5 text-[#c96442]" />
            <h2 className="font-serif text-lg text-[#141413]">Daily Reminders</h2>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#141413] font-medium">Enable reminders</p>
                <p className="text-xs text-[#87867f]">Get a daily email when it's time to learn</p>
              </div>
              <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
            </div>
            {reminderEnabled && (
              <div>
                <label className="text-xs font-medium text-[#87867f] uppercase tracking-wide mb-2 block">Reminder time</label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#87867f]" />
                  <select
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="flex-1 rounded-xl border border-[#e5e4de] bg-white px-3 py-2.5 text-sm text-[#141413] focus:border-[#c96442] focus:outline-none"
                  >
                    {HOURS.map((h) => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <Button
              onClick={handleSaveReminders}
              disabled={saving}
              className="w-full h-11 rounded-xl bg-[#c96442] hover:bg-[#b5593a] text-white"
            >
              {saving ? "Saving..." : "Save Reminder Settings"}
            </Button>
          </div>
        </div>

        {/* Sound effects */}
        <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundMuted ? <VolumeX className="h-5 w-5 text-[#87867f]" /> : <Volume2 className="h-5 w-5 text-[#c96442]" />}
              <div>
                <p className="text-sm text-[#141413] font-medium">Sound effects</p>
                <p className="text-xs text-[#87867f]">Celebration sounds and feedback</p>
              </div>
            </div>
            <Switch
              checked={!soundMuted}
              onCheckedChange={(checked) => {
                setSoundMuted(!checked);
                setMuted(!checked);
              }}
            />
          </div>
        </div>

        {/* Sign out */}
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full h-12 rounded-xl border-[#e5e4de] text-[#5e5d59]"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>

        {/* Delete account */}
        <Button
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full h-10 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl text-sm"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-[#faf9f5] border-[#e5e4de] rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#141413]">Delete your account?</DialogTitle>
            <DialogDescription className="text-sm text-[#5e5d59]">
              This will permanently delete all your data, including your children's progress, lessons, and badges. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                // Delete children cascade handles rest
                await supabase.from("children").delete().eq("user_id", user!.id);
                await supabase.from("profiles").delete().eq("id", user!.id);
                await signOut();
                navigate("/");
              }}
              className="flex-1 rounded-xl"
            >
              {deleting ? "Deleting..." : "Delete Everything"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
