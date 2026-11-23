import { Redirect, useRouter } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { BackHandler, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { youtubeThumb } from "@shared/youtube";
import { Btn3D, BtnText, Card, OutlineText, T } from "@/components/ui";
import { sounds } from "@/lib/fx";
import { useData, useStore } from "@/lib/store";
import { fs, tw } from "@/theme";

/**
 * Plain page around the YouTube iframe. YouTube's own controls (title link, "Watch on YouTube", share,
 * logo, end-screen suggestions) can open the YouTube app, so they are hidden (`controls=0`) and a
 * transparent shield covers the player: no touch ever reaches YouTube's UI. The app draws its own
 * controls and drives the player through YouTube's postMessage API; player state comes back the same way.
 */
const playerHtml = (id: string) =>
  `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>` +
  `html,body{margin:0;height:100%;background:#000;overflow:hidden}iframe{border:0;width:100%;height:100%}` +
  `#shield{position:absolute;inset:0;z-index:2}</style></head><body>` +
  `<iframe id="p" src="https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&rel=0&playsinline=1&autoplay=1&modestbranding=1&origin=https%3A%2F%2Fstar-jar.app" allow="autoplay; encrypted-media"></iframe>` +
  `<div id="shield"></div><script>` +
  `var f=document.getElementById('p');` +
  `function cmd(func,args){f.contentWindow.postMessage(JSON.stringify({event:'command',func:func,args:args||[]}),'*')}` +
  `f.addEventListener('load',function(){f.contentWindow.postMessage(JSON.stringify({event:'listening',id:1,channel:'widget'}),'*')});` +
  `window.addEventListener('message',function(e){if(e.source!==f.contentWindow)return;try{var d=JSON.parse(e.data);` +
  `if(d.event==='infoDelivery'||d.event==='onStateChange')window.ReactNativeWebView.postMessage(JSON.stringify(d))}catch(x){}});` +
  `</script></body></html>`;

/** Expand / minimize icon drawn with four corner brackets: at the edges to expand, pulled inward to minimize. */
function ScreenIcon({ inward, color }: { inward: boolean; color: string }) {
  const size = 26;
  const arm = inward ? 6 : 9;
  const w = 3;
  const inset = inward ? 6 : 0;
  const corner = (top: boolean, left: boolean) => {
    // Outward icon: borders on the box's outer sides. Inward icon: borders on the inner sides.
    const vertical = inward ? !top : top;
    const horizontal = inward ? !left : left;
    return {
      position: "absolute" as const,
      width: arm,
      height: arm,
      [top ? "top" : "bottom"]: inset,
      [left ? "left" : "right"]: inset,
      [vertical ? "borderTopWidth" : "borderBottomWidth"]: w,
      [horizontal ? "borderLeftWidth" : "borderRightWidth"]: w,
      borderColor: color,
    };
  };
  return (
    <View style={{ width: size, height: size }}>
      <View style={corner(true, true)} />
      <View style={corner(true, false)} />
      <View style={corner(false, true)} />
      <View style={corner(false, false)} />
    </View>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** The player plus the app's own controls. */
function Player({ youtubeId, expanded, onToggle }: { youtubeId: string; expanded: boolean; onToggle: () => void }) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const web = useRef<ComponentRef<typeof WebView>>(null);
  const [state, setState] = useState(-1); // YouTube player state: 0 ended, 1 playing, 2 paused, 3 buffering
  const [time, setTime] = useState({ now: 0, total: 0 });
  const [barW, setBarW] = useState(0);
  const cmd = (func: string, args: unknown[] = []) => web.current?.injectJavaScript(`cmd(${JSON.stringify(func)},${JSON.stringify(args)});true;`);
  const playing = state === 1 || state === 3;

  // "Expanded" is not real fullscreen and the phone does not rotate: the player panel is turned 90° on
  // screen so it looks landscape, and covers ~90% of it. It stays inside the app, behind the shield.
  // The WebView is never remounted, so playback continues.
  useEffect(() => {
    if (!expanded) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => (onToggle(), true));
    return () => sub.remove();
  }, [expanded, onToggle]);

  // Panel size in its own (rotated) frame: its width runs along the screen's height, and vice versa.
  const margin = Math.max(winH * 0.05, insets.top, insets.bottom);
  const panelW = winH - 2 * margin;
  const panelH = winW * 0.9;
  const box = expanded
    ? {
        position: "absolute" as const,
        zIndex: 50,
        left: (winW - panelW) / 2,
        top: (winH - panelH) / 2,
        width: panelW,
        height: panelH,
        transform: [{ rotate: "90deg" }],
        borderRadius: 16,
        overflow: "hidden" as const,
        backgroundColor: "#1b0b3a",
      }
    : { marginTop: 16, marginHorizontal: 16 };

  return (
    <View style={box}>
      <View style={expanded ? { flex: 1, backgroundColor: "#000" } : { aspectRatio: 16 / 9, borderRadius: 16, overflow: "hidden", backgroundColor: "#000" }}>
        <WebView
          ref={web}
          source={{ html: playerHtml(youtubeId), baseUrl: "https://star-jar.app" }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          setSupportMultipleWindows={false}
          onMessage={(e) => {
            try {
              const d = JSON.parse(e.nativeEvent.data) as { event: string; info?: number | { playerState?: number; currentTime?: number; duration?: number } };
              if (d.event === "onStateChange" && typeof d.info === "number") setState(d.info);
              else if (d.event === "infoDelivery" && typeof d.info === "object") {
                const i = d.info;
                if (typeof i.playerState === "number") setState(i.playerState);
                if (typeof i.currentTime === "number" || typeof i.duration === "number") setTime((t) => ({ now: i.currentTime ?? t.now, total: i.duration ?? t.total }));
              }
            } catch {}
          }}
          // Second line of defence: nothing but the player page itself may load.
          originWhitelist={["https://www.youtube-nocookie.com", "about:*", "https://star-jar.app"]}
          onShouldStartLoadWithRequest={(r) => r.url.startsWith("https://www.youtube-nocookie.com/embed/") || r.url.startsWith("about:") || r.url.startsWith("https://star-jar.app")}
          style={{ backgroundColor: "#000" }}
        />
        {state === 0 && (
          // The ended player would show suggestion tiles; hide them behind a replay screen.
          <Pressable
            onPress={() => {
              cmd("seekTo", [0, true]);
              cmd("playVideo");
            }}
            style={{ ...StyleSheet.absoluteFill, backgroundColor: "#1b0b3a", alignItems: "center", justifyContent: "center" }}
          >
            <T style={{ fontSize: fs["5xl"], lineHeight: fs["5xl"] * 1.2 }}>🔁</T>
            <T w={700} style={{ color: tw.white, fontSize: fs.lg }}>
              Watch again
            </T>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: expanded ? 0 : 12, padding: expanded ? 8 : 0, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Btn3D bg={tw.pink500} onPress={() => cmd(playing ? "pauseVideo" : "playVideo")} style={{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" }}>
          <T style={{ fontSize: fs["2xl"], lineHeight: fs["2xl"] * 1.25 }}>{playing ? "⏸️" : "▶️"}</T>
        </Btn3D>
        <Pressable
          onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
          onPress={(e) => time.total > 0 && barW > 0 && cmd("seekTo", [(e.nativeEvent.locationX / barW) * time.total, true])}
          style={{ flex: 1, height: 36, justifyContent: "center" }}
        >
          <View style={{ height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.35)", overflow: "hidden" }}>
            <View style={{ height: 12, width: `${time.total ? Math.min(100, (time.now / time.total) * 100) : 0}%`, backgroundColor: tw.yellow400 }} />
          </View>
        </Pressable>
        <T w={700} style={{ color: tw.white, minWidth: 84, textAlign: "right" }}>
          {fmt(time.now)} / {fmt(time.total)}
        </T>
        <Btn3D
          bg="rgba(255,255,255,0.9)"
          onPress={onToggle}
          accessibilityLabel={expanded ? "Minimize video" : "Big screen"}
          style={{ width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" }}
        >
          <ScreenIcon inward={expanded} color={tw.purple800} />
        </Btn3D>
      </View>
    </View>
  );
}

export default function VideosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const data = useData()!;
  const kidId = useStore((s) => s.activeKidId);
  const [playing, setPlaying] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const toggle = () => {
    sounds.close();
    setExpanded((e) => !e);
  };
  // Only a child who entered their PIN on Home may be here.
  // Also silently bounce away if the family doesn't have the videos feature (no message).
  if (!kidId || data.features?.videos !== true) return <Redirect href="/" />;

  const current = data.videos.find((v) => v.id === playing);
  const back = () => {
    sounds.close();
    if (current) {
      setPlaying(null);
      setExpanded(false);
    }
    else router.back();
  };

  const header = (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <OutlineText shadow={4} style={{ fontSize: fs["3xl"], lineHeight: fs["3xl"] * 1.3, color: tw.white }}>
        Videos 📺
      </OutlineText>
      <Btn3D bg="rgba(255,255,255,0.9)" onPress={back} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <BtnText color={tw.purple800} style={{ fontSize: fs.sm }}>
          {current ? "← All videos" : "← Back"}
        </BtnText>
      </Btn3D>
    </View>
  );

  if (current) {
    // Not a ScrollView: the expanded player is positioned over the whole screen.
    return (
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 16 }}>{header}</View>
        {expanded && <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: "rgba(10,0,30,0.85)" }} />}
        <Player key={current.id} youtubeId={current.youtubeId} expanded={expanded} onToggle={toggle} />
        <T w={700} style={{ marginTop: 12, paddingHorizontal: 16, fontSize: fs.xl, color: tw.white }}>
          {current.title}
        </T>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ width: "100%", maxWidth: 768, alignSelf: "center", paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}>
      {header}
      {data.videos.length === 0 ? (
        <Card style={{ marginTop: 16, padding: 24, alignItems: "center" }}>
          <T w={600} style={{ fontSize: fs.lg, textAlign: "center" }}>
            No videos yet. Ask a parent to add some! 🎬
          </T>
        </Card>
      ) : (
        <View style={{ marginTop: 16, gap: 12 }}>
          {data.videos.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => {
                sounds.close();
                setPlaying(v.id);
              }}
            >
              <Card style={{ padding: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Image source={{ uri: youtubeThumb(v.youtubeId) }} style={{ width: 128, height: 72, borderRadius: 12, backgroundColor: tw.purple200 }} />
                <T w={700} numberOfLines={3} style={{ flex: 1, fontSize: fs.lg }}>
                  {v.title}
                </T>
                <T style={{ fontSize: fs["3xl"] }}>▶️</T>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
