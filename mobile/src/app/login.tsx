import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Btn3D, BtnText, Card, OutlineText, T } from "@/components/ui";
import { useEnter } from "@/lib/anim";
import { sendOtp, updateMyName, useStore, verifyOtp } from "@/lib/store";
import { font, fs, ink, tw } from "@/theme";

type Step = "phone" | "otp" | "name";

const input = {
  flex: 1,
  borderRadius: 16,
  borderWidth: 4,
  borderColor: tw.purple200,
  backgroundColor: tw.white,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: fs["2xl"],
  fontFamily: font[400],
  color: ink,
} as const;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  // Already logged in but never told us their name (killed the app mid-signup): straight to the name step.
  const needsName = useStore((s) => s.status === "authed" && !s.data?.me.name);
  const [chosenStep, setStep] = useState<Step>("phone");
  const step: Step = needsName ? "name" : chosenStep;
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);
  const otpRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const attempt = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const send = () =>
    attempt(async () => {
      await sendOtp(phone);
      setStep("otp");
      setOtp("");
      setResendIn(30);
      setTimeout(() => otpRef.current?.focus(), 300);
    });

  // Success moves on by itself: the root layout swaps to the app once the family has loaded.
  const verify = () => attempt(async () => void (await verifyOtp(phone, otp)));
  const saveName = () => attempt(async () => void (await updateMyName(name.trim())));

  const logo = useEnter(0.6);
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logo.value }, { rotate: `${(1 - logo.value) * -20}deg` }] }));
  const field = (key: string) => [input, focus === key && { borderColor: tw.purple500 }];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
      >
        <Animated.View style={[{ alignItems: "center" }, logoStyle]}>
          <T style={{ fontSize: fs["7xl"], lineHeight: fs["7xl"] * 1.2 }}>🫙</T>
          <View style={{ marginTop: 4 }}>
            <OutlineText shadow={6} style={{ fontSize: fs["5xl"], lineHeight: fs["5xl"] * 1.15, color: tw.yellow300 }}>
              Star Jar
            </OutlineText>
          </View>
        </Animated.View>

        <Animated.View key={step} entering={FadeInDown.springify()} style={{ marginTop: 24, width: "100%", maxWidth: 384 }}>
          <Card style={{ padding: 24, gap: 16 }}>
            {step === "phone" && (
              <>
                <T w={700} style={{ fontSize: fs["2xl"] }}>
                  Parent login
                </T>
                <T w={600} style={{ color: tw.purple700 }}>
                  We&apos;ll send a code to your WhatsApp.
                </T>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ borderRadius: 16, backgroundColor: tw.purple100, paddingHorizontal: 12, paddingVertical: 12 }}>
                    <T w={700} style={{ fontSize: fs["2xl"], color: tw.purple800 }}>
                      +91
                    </T>
                  </View>
                  <TextInput
                    style={field("phone")}
                    keyboardType="number-pad"
                    autoComplete="tel-national"
                    textContentType="telephoneNumber"
                    placeholder="98765 43210"
                    placeholderTextColor={tw.slate400}
                    maxLength={11}
                    value={phone}
                    onChangeText={(t) => setPhone(t.replace(/[^\d ]/g, ""))}
                    onFocus={() => setFocus("phone")}
                    onBlur={() => setFocus(null)}
                    onSubmitEditing={() => phone.replace(/\D/g, "").length === 10 && void send()}
                    autoFocus
                    allowFontScaling={false}
                  />
                </View>
                <Submit label={busy ? "Sending…" : "Send WhatsApp code"} disabled={busy || phone.replace(/\D/g, "").length !== 10} onPress={() => void send()} />
              </>
            )}

            {step === "otp" && (
              <>
                <T w={700} style={{ fontSize: fs["2xl"] }}>
                  Enter the code
                </T>
                <T w={600} style={{ color: tw.purple700 }}>
                  Sent to WhatsApp +91 {phone}.{" "}
                  <T w={600} style={{ color: tw.purple500, textDecorationLine: "underline" }} onPress={() => setStep("phone")}>
                    Change
                  </T>
                </T>
                <TextInput
                  ref={otpRef}
                  style={[field("otp"), { textAlign: "center", letterSpacing: 12, flex: 0 }]}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  placeholder="••••••"
                  placeholderTextColor={tw.slate400}
                  maxLength={6}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, ""))}
                  onFocus={() => setFocus("otp")}
                  onBlur={() => setFocus(null)}
                  onSubmitEditing={() => otp.length === 6 && void verify()}
                  allowFontScaling={false}
                />
                <Submit label={busy ? "Checking…" : "Log in"} disabled={busy || otp.length !== 6} onPress={() => void verify()} />
                <T
                  w={600}
                  onPress={busy || resendIn > 0 ? undefined : () => void send()}
                  style={{ textAlign: "center", color: tw.purple600, textDecorationLine: resendIn > 0 ? "none" : "underline", opacity: busy || resendIn > 0 ? 0.5 : 1 }}
                >
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                </T>
              </>
            )}

            {step === "name" && (
              <>
                <T w={700} style={{ fontSize: fs["2xl"] }}>
                  Welcome! 👋
                </T>
                <T w={600} style={{ color: tw.purple700 }}>
                  What should we call you?
                </T>
                <TextInput
                  style={[field("name"), { flex: 0 }]}
                  placeholder="e.g. Mom, Papa, Riya"
                  placeholderTextColor={tw.slate400}
                  maxLength={40}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocus("name")}
                  onBlur={() => setFocus(null)}
                  onSubmitEditing={() => name.trim() && void saveName()}
                  autoFocus
                  allowFontScaling={false}
                />
                <Submit label={busy ? "Saving…" : "Continue"} disabled={busy || !name.trim()} onPress={() => void saveName()} />
              </>
            )}

            {!!error && (
              <T w={600} style={{ color: tw.red600 }}>
                {error}
              </T>
            )}
          </Card>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Submit({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Btn3D bg={tw.green500} disabled={disabled} onPress={onPress} style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
      <BtnText style={{ fontSize: fs.xl }}>{label}</BtnText>
    </Btn3D>
  );
}
