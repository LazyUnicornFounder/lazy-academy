import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import AppNav from "@/components/AppNav";
import { BADGE_CONFIG, ACCESSORY_UNLOCKS, calculateLevel, xpForNextLevel, getUnlockedAccessories } from "@/lib/engagement";

const AVATARS: Record<string, string> = {
  owl: "🦉", fox: "🦊", bear: "🐻", rabbit: "🐰", cat: "🐱",
  dog: "🐶", panda: "🐼", unicorn: "🦄",
};

interface ChildData {
  id: string;
  name: string;
  avatar_url: string | null;
}

const MyStuff = () => {
  const { user, loading: authLoading } = useAuth();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [rewards, setRewards] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const activeChild = children[activeIdx];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("children")
        .select("id, name, avatar_url")
        .eq("user_id", user.id)
        .order("created_at");
      if (data && data.length > 0) setChildren(data);
    })();
  }, [user]);

  useEffect(() => {
    if (!activeChild) return;
    setLoading(true);
    Promise.all([
      supabase.from("child_rewards").select("*").eq("child_id", activeChild.id).single(),
      supabase.from("badges").select("*").eq("child_id", activeChild.id).order("earned_at"),
    ]).then(([rRes, bRes]) => {
      setRewards(rRes.data || { xp_total: 0, level: 1 });
      setBadges(bRes.data || []);
      setLoading(false);
    });
  }, [activeChild?.id]);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f5f4ed]"><p className="text-[#87867f]">Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;

  const level = rewards?.level || 1;
  const { current, needed } = xpForNextLevel(rewards?.xp_total || 0);
  const unlocked = getUnlockedAccessories(level);
  const allAccessories = ACCESSORY_UNLOCKS;
  const earnedBadgeTypes = new Set(badges.map((b: any) => b.badge_type));

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      <AppNav />

      <div className="container max-w-2xl py-8 space-y-8">
        {/* Child tabs */}
        {children.length > 1 && (
          <div className="flex gap-2">
            {children.map((child, i) => (
              <button
                key={child.id}
                onClick={() => setActiveIdx(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  i === activeIdx ? "bg-[#c96442] text-white" : "bg-[#faf9f5] text-[#5e5d59] hover:bg-[#e5e4de]"
                }`}
              >
                <span>{AVATARS[child.avatar_url || "owl"] || "🦉"}</span>
                <span>{child.name}</span>
              </button>
            ))}
          </div>
        )}

        {activeChild && !loading && (
          <>
            {/* Avatar & Level */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="text-6xl">{AVATARS[activeChild.avatar_url || "owl"] || "🦉"}</div>
                <div className="absolute -bottom-1 -right-1 bg-[#c96442] text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  Lv.{level}
                </div>
                {unlocked.length > 0 && (
                  <div className="absolute -top-2 -left-2 text-2xl">
                    {unlocked[unlocked.length - 1].emoji}
                  </div>
                )}
              </div>
              <h2 className="font-serif text-xl text-[#141413] mb-2">{activeChild.name}</h2>
              <p className="text-sm text-[#87867f] mb-3">{rewards?.xp_total || 0} XP total</p>
              <div className="max-w-xs mx-auto">
                <div className="flex items-center justify-between text-xs text-[#87867f] mb-1">
                  <span>Level {level}</span>
                  <span>{current}/{needed} XP</span>
                </div>
                <div className="h-3 rounded-full bg-[#e5e4de] overflow-hidden">
                  <div className="h-full bg-[#c96442] rounded-full transition-all" style={{ width: `${(current / needed) * 100}%` }} />
                </div>
              </div>
            </motion.div>

            {/* Accessories */}
            <div>
              <h3 className="font-serif text-lg text-[#141413] mb-4">Accessories</h3>
              <div className="grid grid-cols-5 gap-3">
                {allAccessories.map((acc) => {
                  const isUnlocked = level >= acc.level;
                  return (
                    <motion.div
                      key={acc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`rounded-xl border p-4 text-center transition-all ${
                        isUnlocked
                          ? "bg-[#faf9f5] border-[#c96442]/20"
                          : "bg-[#e5e4de]/50 border-[#e5e4de] opacity-50"
                      }`}
                    >
                      <div className="text-2xl mb-1">{isUnlocked ? acc.emoji : "🔒"}</div>
                      <p className="text-[10px] text-[#5e5d59]">{acc.label}</p>
                      {!isUnlocked && <p className="text-[9px] text-[#87867f]">Lv.{acc.level}</p>}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Badges */}
            <div>
              <h3 className="font-serif text-lg text-[#141413] mb-4">Badges</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(BADGE_CONFIG).map(([type, config]) => {
                  const isEarned = earnedBadgeTypes.has(type);
                  return (
                    <motion.div
                      key={type}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`rounded-xl border p-4 flex items-center gap-3 transition-all ${
                        isEarned
                          ? "bg-[#faf9f5] border-[#c96442]/20"
                          : "bg-[#e5e4de]/50 border-[#e5e4de] opacity-40"
                      }`}
                    >
                      <div className="text-2xl">{isEarned ? config.emoji : "🔒"}</div>
                      <div>
                        <p className="text-sm font-medium text-[#141413]">{config.label}</p>
                        <p className="text-xs text-[#87867f]">{config.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyStuff;
