import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Bell, BellOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: `${String(i).padStart(2, "0")}:00:00`, label: `${h}:00 ${ampm}` };
});

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadSettings();
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

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime,
      })
      .eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Reminder settings updated." });
    }
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

      <div className="container max-w-lg py-8">
        <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-5 w-5 text-[#c96442]" />
            <h2 className="font-serif text-lg text-[#141413]">Daily Reminders</h2>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#141413] font-medium">Enable reminders</p>
                <p className="text-xs text-[#87867f]">Get a daily email when it's time to learn</p>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {reminderEnabled && (
              <div>
                <label className="text-xs font-medium text-[#87867f] uppercase tracking-wide mb-2 block">
                  Reminder time
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#87867f]" />
                  <select
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="flex-1 rounded-xl border border-[#e5e4de] bg-white px-3 py-2.5 text-sm text-[#141413] focus:border-[#c96442] focus:outline-none"
                  >
                    {HOURS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-11 rounded-xl bg-[#c96442] hover:bg-[#b5593a] text-white"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
