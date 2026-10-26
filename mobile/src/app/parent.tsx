import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { FamilySnapshot, MeResponse } from "@shared/api-types";
import { AVATARS, COLORS } from "@shared/defaults";
import { isToday, pinFor, totalStars } from "@shared/rules";
import type { Activity, Entry, Kid, Milestone } from "@shared/types";
import PinPad from "@/components/PinPad";
import { Btn, Btn3D, BtnText, Card, Checkbox, Input, OutlineText, T } from "@/components/ui";
import {
  acceptInvite,
  changeParentPin,
  deleteKid,
  exportJson,
  flushFamily,
  getMe,
  giveBonus,
  importJson,
  inviteParent,
  lockParent,
  logActivity,
  logout,
  patchFamily,
  removeEntry,
  removeMember,
  resetFamily,
  revokeInvite,
  saveKid,
  setGiftGiven,
  uid,
  unlockParent,
  updateMyName,
  useData,
  useStore,
} from "@/lib/store";
import { fs, tw } from "@/theme";

type AppData = FamilySnapshot;

const TABS = ["Kids", "Activities", "Milestones", "Log & Gifts", "Family", "Settings"] as const;
type Tab = (typeof TABS)[number];

/** Native stand-in for `confirm()`. */
const confirm = (title: string, message?: string, destructive = true) =>
  new Promise<boolean>((resolve) =>
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "OK", style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );

/** Latest family data, for edit handlers that must not work from a stale render. */
const latest = () => useStore.getState().data!;

const H2 = ({ children, color }: { children: React.ReactNode; color?: string }) => (
  <T w={700} style={{ fontSize: fs["2xl"], color }}>
    {children}
  </T>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <T w={700} style={{ marginTop: 24, fontSize: fs.xl }}>
    {children}
  </T>
);
const Hint = ({ children }: { children: React.ReactNode }) => <T style={{ marginTop: 4, fontSize: fs.sm, color: tw.purple600 }}>{children}</T>;

export default function ParentScreen() {
  const data = useData()!;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Leaving the Parent Zone locks it, so coming back always asks for the PIN again.
  const unlocked = useStore((s) => s.parentUnlocked);
  const [tab, setTab] = useState<Tab>("Kids");
  useEffect(
    () => () => {
      void flushFamily();
      lockParent();
    },
    [],
  );

  if (!unlocked) {
    const creating = !data.settings.hasParentPin;
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
        <Card style={{ alignItems: "center", padding: 24 }}>
          <T style={{ fontSize: fs["5xl"], lineHeight: fs["5xl"] * 1.2 }}>🔐</T>
          <T w={700} style={{ marginTop: 8, fontSize: fs["3xl"] }}>
            {creating ? "Create a Parent PIN" : "Parents Only"}
          </T>
          <View style={{ marginTop: 16 }}>
            <PinPad
              hint={creating ? "Pick 4 digits the kids don't know" : "Enter parent PIN"}
              onSubmit={async (pin) => {
                return unlockParent(pin);
              }}
            />
          </View>
          <T w={600} onPress={() => router.back()} style={{ marginTop: 16, color: tw.purple600, textDecorationLine: "underline" }}>
            ← Back
          </T>
        </Card>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ width: "100%", maxWidth: 896, alignSelf: "center", paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <OutlineText style={{ fontSize: fs["3xl"], lineHeight: fs["3xl"] * 1.3, color: tw.white }}>Parent Zone</OutlineText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Btn bg={tw.purple600} label="🏠 Home" onPress={() => router.back()} />
            <Btn
              bg={tw.slate500}
              label="🔒 Lock"
              onPress={() => {
                void flushFamily();
                lockParent();
              }}
            />
          </View>
        </View>

        <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 8 }}>
          {TABS.map((t) => (
            <Btn3D key={t} bg={tab === t ? tw.yellow300 : "rgba(255,255,255,0.9)"} onPress={() => setTab(t)} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              <BtnText color={tab === t ? tw.purple900 : tw.purple700} style={{ fontSize: fs.sm }}>
                {t}
              </BtnText>
            </Btn3D>
          ))}
        </View>

        <Card style={{ marginTop: 16, padding: 12 }}>
          {tab === "Kids" && <KidsTab data={data} />}
          {tab === "Activities" && <ActivitiesTab data={data} />}
          {tab === "Milestones" && <MilestonesTab data={data} />}
          {tab === "Log & Gifts" && <LogTab data={data} />}
          {tab === "Family" && <FamilyTab data={data} />}
          {tab === "Settings" && <SettingsTab data={data} />}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------- Kids ---------------- */

function KidsTab({ data }: { data: AppData }) {
  const [editing, setEditing] = useState<{ kid: Kid; isNew: boolean } | null>(null);
  const blank = (): Kid => ({
    id: uid(),
    name: "",
    avatar: AVATARS[data.kids.length % AVATARS.length],
    color: COLORS[data.kids.length % COLORS.length],
    birthdate: "",
    unlocked: {},
    giftsGiven: {},
    createdAt: Date.now(),
  });

  const save = async (k: Kid) => {
    if (await saveKid(k, editing!.isNew)) setEditing(null);
  };

  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <H2>Players</H2>
        <Btn bg={tw.green500} label="+ Add child" onPress={() => setEditing({ kid: blank(), isNew: true })} />
      </View>
      <View style={{ marginTop: 16, gap: 12 }}>
        {data.kids.map((k) => (
          <View key={k.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 12, backgroundColor: `${k.color}22` }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: k.color }}>
              <T style={{ fontSize: fs["4xl"], lineHeight: fs["4xl"] * 1.2 }}>{k.avatar}</T>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w={700} numberOfLines={1} style={{ fontSize: fs.xl }}>
                {k.name}
              </T>
              <T style={{ fontSize: fs.sm, color: tw.purple700 }}>
                PIN <T w={700} style={{ fontSize: fs.sm, color: tw.purple700 }}>{pinFor(k.birthdate)}</T> · ⭐ {totalStars(data.entries.filter((e) => e.kidId === k.id))}
              </T>
            </View>
            <Btn bg={tw.blue500} label="Edit" onPress={() => setEditing({ kid: k, isNew: false })} />
            <Btn
              bg={tw.red500}
              label="✕"
              onPress={async () => {
                if (await confirm(`Delete ${k.name} and all their stars?`)) void deleteKid(k.id);
              }}
            />
          </View>
        ))}
        {data.kids.length === 0 && <T style={{ color: tw.purple500 }}>No players yet. Add your children!</T>}
      </View>

      {editing && <KidForm key={editing.kid.id} kid={editing.kid} onSave={save} onCancel={() => setEditing(null)} />}
    </View>
  );
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return y ? new Date(y, m - 1, d) : new Date(new Date().getFullYear() - 5, 0, 1);
};

/** Native date input (web: `<input type="date">`). */
function BirthdateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [iosOpen, setIosOpen] = useState(false);
  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({ value: parseIso(value), mode: "date", maximumDate: new Date(), onValueChange: (_, d) => onChange(iso(d)) });
    } else setIosOpen((o) => !o);
  };
  return (
    <View>
      <Pressable onPress={open} style={{ borderRadius: 12, borderWidth: 2, borderColor: tw.purple200, backgroundColor: tw.white, paddingHorizontal: 12, paddingVertical: 8 }}>
        <T style={{ color: value ? undefined : tw.slate400 }}>{value ? parseIso(value).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "Pick a date"}</T>
      </Pressable>
      {iosOpen && Platform.OS === "ios" && (
        <DateTimePicker value={parseIso(value)} mode="date" display="inline" maximumDate={new Date()} onValueChange={(_, d) => onChange(iso(d))} />
      )}
    </View>
  );
}

function KidForm({ kid, onSave, onCancel }: { kid: Kid; onSave: (k: Kid) => Promise<void>; onCancel: () => void }) {
  const [k, setK] = useState(kid);
  const [saving, setSaving] = useState(false);
  const valid = !!k.name.trim() && /^\d{4}-\d{2}-\d{2}$/.test(k.birthdate);
  return (
    <View style={{ marginTop: 24, borderRadius: 16, borderWidth: 4, borderStyle: "dashed", borderColor: tw.purple300, padding: 16 }}>
      <View style={{ gap: 12 }}>
        <View>
          <T w={600}>Name</T>
          <Input value={k.name} onChangeText={(name) => setK({ ...k, name })} maxLength={40} />
        </View>
        <View>
          <T w={600}>Birthdate (PIN = DDMM)</T>
          <BirthdateField value={k.birthdate} onChange={(birthdate) => setK({ ...k, birthdate })} />
        </View>
      </View>
      {!!k.birthdate && (
        <T style={{ marginTop: 8, color: tw.purple700 }}>
          Login PIN: <T w={700} style={{ fontSize: fs.xl, color: tw.purple700 }}>{pinFor(k.birthdate)}</T>
        </T>
      )}
      <T w={600} style={{ marginTop: 12 }}>
        Avatar
      </T>
      <View style={{ marginTop: 4, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {AVATARS.map((a) => (
          <Pressable
            key={a}
            onPress={() => setK({ ...k, avatar: a })}
            style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: k.avatar === a ? tw.yellow300 : tw.purple50, borderWidth: k.avatar === a ? 4 : 0, borderColor: tw.purple500 }}
          >
            <T style={{ fontSize: fs["3xl"], lineHeight: fs["3xl"] * 1.2 }}>{a}</T>
          </Pressable>
        ))}
      </View>
      <T w={600} style={{ marginTop: 12 }}>
        Color
      </T>
      <View style={{ marginTop: 4, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {COLORS.map((c) => (
          <Pressable key={c} onPress={() => setK({ ...k, color: c })} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c, borderWidth: k.color === c ? 4 : 0, borderColor: tw.purple900 }} />
        ))}
      </View>
      <View style={{ marginTop: 16, flexDirection: "row", gap: 8 }}>
        <Btn
          bg={tw.green500}
          label={saving ? "Saving…" : "Save"}
          disabled={!valid || saving}
          onPress={async () => {
            setSaving(true);
            await onSave({ ...k, name: k.name.trim() });
            setSaving(false);
          }}
        />
        <Btn bg={tw.slate400} label="Cancel" onPress={onCancel} />
      </View>
    </View>
  );
}

/* ---------------- Activities ---------------- */

function ActivitiesTab({ data }: { data: AppData }) {
  const update = (id: string, patch: Partial<Activity>) => patchFamily({ activities: latest().activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) });

  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <H2>Activities</H2>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Btn bg={tw.green500} label="+ Good" onPress={() => patchFamily({ activities: [...latest().activities, { id: uid(), name: "New activity", emoji: "🌟", points: 5, kind: "good" }] })} />
          <Btn bg={tw.red500} label="+ Oops" onPress={() => patchFamily({ activities: [...latest().activities, { id: uid(), name: "New oops", emoji: "😕", points: -5, kind: "bad" }] })} />
        </View>
      </View>
      <Hint>Changes save automatically. Past history keeps its old name & points. 🔒 Parents only = hidden from kids (give it from Log & Gifts).</Hint>
      <View style={{ marginTop: 16, gap: 8 }}>
        {data.activities.map((a) => (
          <View key={a.id} style={{ gap: 8, borderRadius: 16, padding: 8, backgroundColor: a.kind === "good" ? tw.green50 : tw.red50 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Input style={{ width: 64, textAlign: "center", fontSize: fs["2xl"] }} value={a.emoji} onChangeText={(emoji) => update(a.id, { emoji })} />
              <Input style={{ flex: 1 }} value={a.name} maxLength={60} onChangeText={(name) => update(a.id, { name })} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <PointsInput width={64} value={a.points} min={-100} max={100} onChange={(n) => update(a.id, { points: n, kind: n < 0 ? "bad" : "good" })} />
              <T w={700} style={{ fontSize: fs.sm }}>
                {a.kind === "good" ? "😊 good" : "😟 oops"}
              </T>
              <View style={{ flex: 1 }}>
                <Checkbox checked={!!a.parentOnly} onChange={(v) => update(a.id, { parentOnly: v || undefined })} label={<T w={600} style={{ fontSize: fs.sm }}>🔒 Parents only</T>} />
              </View>
              <Btn bg={tw.red400} label="✕" style={{ paddingHorizontal: 12 }} onPress={() => patchFamily({ activities: latest().activities.filter((x) => x.id !== a.id) })} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Number field that lets the parent type freely (including "-") and reports clamped integers. */
function PointsInput({ value, min, max, onChange, width = 80 }: { value: number; min: number; max: number; onChange: (n: number) => void; width?: number }) {
  const [text, setText] = useState(String(value));
  // Follow outside changes (e.g. a co-parent's edit or a reset) without fighting the parent's typing.
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    if (Number(text) !== value) setText(String(value));
  }
  return (
    <Input
      style={{ width }}
      value={text}
      keyboardType={min < 0 ? "numbers-and-punctuation" : "number-pad"}
      onChangeText={(t) => {
        const clean = t.replace(min < 0 ? /[^\d-]/g : /\D/g, "");
        setText(clean);
        const n = Math.trunc(Number(clean));
        if (clean !== "" && clean !== "-" && Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
      }}
      onBlur={() => setText(String(value))}
    />
  );
}

/* ---------------- Milestones ---------------- */

function MilestonesTab({ data }: { data: AppData }) {
  const update = (id: string, patch: Partial<Milestone>) => patchFamily({ milestones: latest().milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const sorted = [...data.milestones].sort((a, b) => a.points - b.points);

  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <H2>Milestones & Gifts</H2>
        <Btn
          bg={tw.green500}
          label="+ Add"
          onPress={() => patchFamily({ milestones: [...latest().milestones, { id: uid(), points: (sorted.at(-1)?.points ?? 0) + 100, title: "New treasure", badge: "💎", gift: "" }] })}
        />
      </View>
      <Hint>Badge (virtual) · title · stars needed · real gift (optional)</Hint>
      <View style={{ marginTop: 16, gap: 8 }}>
        {sorted.map((m) => (
          <View key={m.id} style={{ gap: 8, borderRadius: 16, padding: 8, backgroundColor: tw.yellow50 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Input style={{ width: 64, textAlign: "center", fontSize: fs["2xl"] }} value={m.badge} onChangeText={(badge) => update(m.id, { badge })} />
              <Input style={{ flex: 1 }} placeholder="Title" maxLength={60} value={m.title} onChangeText={(title) => update(m.id, { title })} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PointsInput width={72} value={m.points} min={1} max={100_000} onChange={(points) => update(m.id, { points })} />
                <T w={700}>⭐</T>
              </View>
              <Input style={{ flex: 1 }} placeholder="Real gift…" maxLength={100} value={m.gift} onChangeText={(gift) => update(m.id, { gift })} />
              <Btn bg={tw.red400} label="✕" style={{ paddingHorizontal: 12 }} onPress={() => patchFamily({ milestones: latest().milestones.filter((x) => x.id !== m.id) })} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ---------------- Log & Gifts ---------------- */

function ActivitySelect({ data, value, onChange }: { data: AppData; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const current = data.activities.find((a) => a.id === value);
  const groups = [
    ["🔒 Parents only", data.activities.filter((a) => a.parentOnly)],
    ["😊 Good", data.activities.filter((a) => !a.parentOnly && a.kind === "good")],
    ["😟 Oops", data.activities.filter((a) => !a.parentOnly && a.kind === "bad")],
  ] as const;
  const label = (a: Activity) => `${a.emoji} ${a.name} (${a.points > 0 ? "+" : ""}${a.points})`;
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={{ flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 2, borderColor: tw.purple200, backgroundColor: tw.white, paddingHorizontal: 12, paddingVertical: 8 }}>
        <T numberOfLines={1} style={{ flex: 1 }}>
          {current ? label(current) : "Pick an activity"}
        </T>
        <T style={{ color: tw.purple500 }}>▾</T>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent navigationBarTranslucent>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: "rgba(59,7,100,0.5)", justifyContent: "flex-end" }}>
          <Pressable onPress={() => {}} style={{ maxHeight: "70%", borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: tw.white, paddingBottom: insets.bottom + 8 }}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {groups.map(([g, list]) =>
                list.length ? (
                  <View key={g} style={{ marginBottom: 12 }}>
                    <T w={700} style={{ color: tw.purple700, marginBottom: 4 }}>
                      {g}
                    </T>
                    {list.map((a) => (
                      <Pressable
                        key={a.id}
                        onPress={() => {
                          onChange(a.id);
                          setOpen(false);
                        }}
                        style={{ borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: a.id === value ? tw.purple100 : "transparent" }}
                      >
                        <T style={{ fontSize: fs.lg }}>{label(a)}</T>
                      </Pressable>
                    ))}
                  </View>
                ) : null,
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function LogTab({ data }: { data: AppData }) {
  const [kidId, setKidId] = useState(data.kids[0]?.id ?? "");
  const [activityId, setActivityId] = useState(data.activities[0]?.id ?? "");
  const [bonusMsg, setBonusMsg] = useState("");
  const kid = data.kids.find((k) => k.id === kidId);
  if (!kid) return <T>Add a child first.</T>;

  const entries = data.entries.filter((e) => e.kidId === kid.id).sort((a, b) => b.at - a.at);
  const byDay = Object.entries(
    entries.reduce<Record<string, Entry[]>>((acc, e) => {
      const day = isToday(e.at) ? "Today" : new Date(e.at).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
      (acc[day] ??= []).push(e);
      return acc;
    }, {}),
  );
  const gifts = data.milestones.filter((m) => kid.unlocked[m.id] && m.gift).sort((a, b) => a.points - b.points);

  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {data.kids.map((k) => (
          <Btn3D
            key={k.id}
            bg={k.color}
            onPress={() => {
              setKidId(k.id);
              setBonusMsg("");
            }}
            style={[{ paddingHorizontal: 16, paddingVertical: 8 }, k.id === kidId ? { borderWidth: 4, borderColor: tw.purple900 } : { opacity: 0.7 }]}
          >
            <BtnText>
              {k.avatar} {k.name}
            </BtnText>
          </Btn3D>
        ))}
      </View>

      <H3>🎉 Give a Bonus</H3>
      <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[5, 10, 20, 50].map((n) => (
          <Btn3D
            key={n}
            bg={tw.orange500}
            onPress={async () => {
              if (await giveBonus(kid.id, n)) setBonusMsg(`✅ +${n} bonus stars for ${kid.name}!`);
            }}
            style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundImage: "linear-gradient(to bottom right, #facc15, #f97316)" }}
          >
            <BtnText style={{ fontSize: fs.lg }}>+{n} ⭐</BtnText>
          </Btn3D>
        ))}
      </View>
      {!!bonusMsg && (
        <T w={600} style={{ marginTop: 8, color: tw.green700 }}>
          {bonusMsg}
        </T>
      )}

      <H3>Add an entry (no time limits)</H3>
      <View style={{ marginTop: 8, flexDirection: "row", gap: 8 }}>
        <ActivitySelect data={data} value={activityId} onChange={setActivityId} />
        <Btn bg={tw.purple600} label="Add" onPress={() => void logActivity(kid.id, activityId, true)} />
      </View>

      <H3>Gifts to hand over 🎁</H3>
      {gifts.length === 0 && <T style={{ color: tw.purple500 }}>No real gifts unlocked yet.</T>}
      <View style={{ marginTop: 8, gap: 8 }}>
        {gifts.map((m) => {
          const given = kid.giftsGiven[m.id];
          return (
            <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 8, backgroundColor: tw.pink50 }}>
              <T style={{ fontSize: fs["3xl"], lineHeight: fs["3xl"] * 1.2 }}>{m.badge}</T>
              <T style={{ flex: 1 }}>
                <T w={700}>{m.gift}</T> <T style={{ fontSize: fs.sm, color: tw.purple600 }}>({m.points}⭐)</T>
              </T>
              <Btn bg={given ? tw.green500 : tw.pink500} label={given ? "✓ Given" : "Mark given"} onPress={() => void setGiftGiven(kid.id, m.id, !given)} />
            </View>
          );
        })}
      </View>

      <H3>History ({entries.length})</H3>
      <T style={{ fontSize: fs.sm, color: tw.purple600 }}>Tapped something by accident? Remove it here. Stars update instantly.</T>
      <View style={{ marginTop: 8, gap: 12 }}>
        {byDay.map(([day, list]) => (
          <View key={day}>
            <T w={700} style={{ paddingVertical: 4, fontSize: fs.sm, color: tw.purple700 }}>
              {day} · {list.reduce((s, e) => s + e.points, 0)} ⭐
            </T>
            <View style={{ gap: 4 }}>
              {list.map((e) => (
                <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, backgroundColor: tw.purple50, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <T style={{ fontSize: fs.xl }}>{e.emoji}</T>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w={600} style={{ lineHeight: 20 }}>
                      {e.name} {e.byParent && <T style={{ fontSize: fs.xs, color: tw.purple500 }}>(parent)</T>}
                    </T>
                    <T style={{ fontSize: fs.xs, color: tw.purple600 }}>{new Date(e.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</T>
                  </View>
                  <T w={700} style={{ width: 36, textAlign: "right", color: e.points > 0 ? tw.green600 : tw.red600 }}>
                    {e.points > 0 ? `+${e.points}` : e.points}
                  </T>
                  <Btn
                    bg={tw.red500}
                    label="🗑 Remove"
                    style={{ paddingHorizontal: 12, paddingVertical: 4 }}
                    textStyle={{ fontSize: fs.sm }}
                    onPress={async () => {
                      if (await confirm(`Remove "${e.name}" (${e.points > 0 ? "+" : ""}${e.points}) from ${kid.name}?`)) void removeEntry(e.id);
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ---------------- Family ---------------- */

function FamilyTab({ data }: { data: AppData }) {
  const [phone, setPhone] = useState("");
  const [myName, setMyName] = useState(data.me.name);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getMe().then(setMe, () => {});
  }, []);

  return (
    <View style={{ gap: 24 }}>
      <View>
        <H2>Family</H2>
        <T w={600} style={{ marginTop: 8 }}>
          Family name
        </T>
        <Input maxLength={60} value={data.family.name} onChangeText={(name) => patchFamily({ name })} />
        <T w={600} style={{ marginTop: 12 }}>
          Your name
        </T>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Input style={{ flex: 1 }} maxLength={40} value={myName} onChangeText={setMyName} />
          <Btn bg={tw.green500} label="Save" disabled={!myName.trim() || myName.trim() === data.me.name} onPress={() => void updateMyName(myName.trim())} />
        </View>
      </View>

      <View>
        <H2>Parents</H2>
        <T style={{ fontSize: fs.sm, color: tw.purple700 }}>Everyone here sees the same kids and stars, and shares the parent PIN.</T>
        <View style={{ marginTop: 8, gap: 8 }}>
          {data.members.map((m) => (
            <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, backgroundColor: tw.purple50, padding: 8 }}>
              <T style={{ fontSize: fs["2xl"] }}>🧑</T>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T>
                  <T w={700}>{m.name || "Parent"}</T> {m.id === data.me.id && <T style={{ fontSize: fs.sm, color: tw.purple500 }}>(you)</T>}
                </T>
                <T style={{ fontSize: fs.sm, color: tw.purple600 }}>+91 {m.phone}</T>
              </View>
              {m.id !== data.me.id && (
                <Btn
                  bg={tw.red400}
                  label="✕"
                  style={{ paddingHorizontal: 12 }}
                  onPress={async () => {
                    if (await confirm(`Remove ${m.name || m.phone} from this family?`)) void removeMember(m.id);
                  }}
                />
              )}
            </View>
          ))}
          {data.invites.map((i) => (
            <View key={i.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 2, borderStyle: "dashed", borderColor: tw.purple200, padding: 8 }}>
              <T style={{ fontSize: fs["2xl"] }}>✉️</T>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T w={700}>+91 {i.phone}</T>
                <T style={{ fontSize: fs.sm, color: tw.purple600 }}>Invited · joins when they log in</T>
              </View>
              <Btn bg={tw.slate400} label="Cancel" style={{ paddingHorizontal: 12 }} onPress={() => void revokeInvite(i.id)} />
            </View>
          ))}
        </View>
        <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ borderRadius: 12, backgroundColor: tw.purple100, paddingHorizontal: 12, paddingVertical: 8 }}>
            <T w={700} style={{ color: tw.purple800 }}>
              +91
            </T>
          </View>
          <Input style={{ flex: 1 }} keyboardType="number-pad" placeholder="Co-parent's WhatsApp" maxLength={11} value={phone} onChangeText={(t) => setPhone(t.replace(/[^\d ]/g, ""))} />
          <Btn
            bg={tw.green500}
            label="Invite"
            disabled={phone.replace(/\D/g, "").length !== 10}
            onPress={async () => {
              if (await inviteParent(phone)) {
                setMsg(`✅ Invited +91 ${phone}. Ask them to log in to Star Jar with that WhatsApp number.`);
                setPhone("");
              }
            }}
          />
        </View>
        {!!msg && (
          <T w={600} style={{ marginTop: 8, color: tw.green700 }}>
            {msg}
          </T>
        )}
      </View>

      {!!me?.pendingInvites.length && (
        <View>
          <H2>Invites for you</H2>
          <View style={{ marginTop: 8, gap: 8 }}>
            {me.pendingInvites.map((i) => (
              <View key={i.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, backgroundColor: tw.yellow50, padding: 8 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T w={700}>{i.familyName}</T>
                  {!!i.invitedBy && <T style={{ fontSize: fs.sm, color: tw.purple600 }}>from {i.invitedBy}</T>}
                </View>
                <Btn
                  bg={tw.green500}
                  label="Join"
                  onPress={async () => {
                    if (!(await confirm(`Join ${i.familyName}?`, "You'll leave your current family.", false))) return;
                    if (await acceptInvite(i.id)) setMe({ ...me, pendingInvites: me.pendingInvites.filter((x) => x.id !== i.id) });
                  }}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      <View>
        <H2>Account</H2>
        <T style={{ fontSize: fs.sm, color: tw.purple700 }}>Logged in as +91 {data.me.phone}. You stay logged in while you use Star Jar; after 30 days away you&apos;ll be asked again.</T>
        <Btn bg={tw.slate500} label="Log out" style={{ marginTop: 8, alignSelf: "flex-start" }} onPress={() => void logout()} />
      </View>
    </View>
  );
}

/* ---------------- Settings ---------------- */

function SettingsTab({ data }: { data: AppData }) {
  const s = data.settings;
  const set = (patch: Partial<Omit<typeof s, "hasParentPin">>) => patchFamily({ settings: patch });
  const [msg, setMsg] = useState("");
  const [changingPin, setChangingPin] = useState(false);

  const download = async () => {
    try {
      const json = await exportJson();
      const file = new File(Paths.cache, `star-jar-backup-${new Date().toISOString().slice(0, 10)}.json`);
      file.create({ overwrite: true });
      file.write(json);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Save Star Jar backup", UTI: "public.json" });
    } catch (err) {
      setMsg(`❌ ${(err as Error).message}`);
    }
  };

  const restore = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ["application/json", "text/plain", "*/*"], copyToCacheDirectory: true });
      if (picked.canceled) return;
      if (!(await confirm("Replace ALL current data with this backup?", "Co-parents will see the change too."))) return;
      setMsg("⏳ Restoring…");
      await importJson(await new File(picked.assets[0].uri).text());
      setMsg("✅ Backup restored!");
    } catch (err) {
      setMsg(`❌ ${(err as Error).message}`);
    }
  };

  return (
    <View style={{ gap: 24 }}>
      <View>
        <H2>Sound & Voice</H2>
        <View style={{ marginTop: 8, gap: 8 }}>
          <Checkbox size={24} checked={s.sound} onChange={(sound) => set({ sound })} label={<T style={{ fontSize: fs.lg }}>Sound effects</T>} />
          <Checkbox size={24} checked={s.voice} onChange={(voice) => set({ voice })} label={<T style={{ fontSize: fs.lg, flexShrink: 1 }}>Talking voice (great for kids who can&apos;t read yet)</T>} />
        </View>
      </View>

      <View>
        <H2>Tap limits (for kids)</H2>
        <View style={{ marginTop: 8, gap: 12 }}>
          {(
            [
              ["maxPerDay", "Max per activity / day", 1, 50],
              ["sameGapMin", "Minutes between same activity", 0, 1440],
              ["anyGapMin", "Minutes between any activity", 0, 1440],
            ] as const
          ).map(([key, label, min, max]) => (
            <View key={key}>
              <T w={600}>{label}</T>
              <PointsInput width={120} value={s[key]} min={min} max={max} onChange={(n) => set({ [key]: n })} />
            </View>
          ))}
        </View>
      </View>

      <View>
        <H2>Parent PIN</H2>
        {changingPin ? (
          <View style={{ marginTop: 8, alignItems: "flex-start", gap: 8 }}>
            <PinPad
              hint="Pick a new 4-digit PIN"
              onSubmit={async (pin) => {
                const ok = await changeParentPin(pin);
                if (ok) {
                  setChangingPin(false);
                  setMsg("✅ Parent PIN changed for everyone in the family.");
                }
                return ok;
              }}
            />
            <Btn bg={tw.slate400} label="Cancel" onPress={() => setChangingPin(false)} />
          </View>
        ) : (
          <Btn bg={tw.purple600} label="Change parent PIN" style={{ marginTop: 8, alignSelf: "flex-start" }} onPress={() => setChangingPin(true)} />
        )}
      </View>

      <View>
        <H2>Backup 💾</H2>
        <T style={{ fontSize: fs.sm, color: tw.purple700 }}>
          Your family&apos;s data is saved online and shared with co-parents. Moving from the old Star Jar website? Download a backup there, then restore it here.
        </T>
        <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Btn bg={tw.blue500} label="⬇ Download backup" onPress={() => void download()} />
          <Btn bg={tw.orange500} label="⬆ Restore backup" onPress={() => void restore()} />
        </View>
        {!!msg && (
          <T w={600} style={{ marginTop: 8 }}>
            {msg}
          </T>
        )}
      </View>

      <View>
        <H2 color={tw.red600}>Danger zone</H2>
        <View style={{ marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Btn
            bg={tw.red400}
            label="Reset all stars"
            onPress={async () => {
              if (await confirm("Clear ALL stars & badges for every child?")) void resetFamily("stars");
            }}
          />
          <Btn
            bg={tw.red600}
            label="Factory reset"
            onPress={async () => {
              if (await confirm("Erase EVERYTHING (kids, activities, settings)?")) void resetFamily("everything");
            }}
          />
        </View>
      </View>
    </View>
  );
}
