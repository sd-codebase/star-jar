import { Linking, Pressable, View } from "react-native";
import { API_URL } from "@/lib/api";
import { fs, tw } from "@/theme";
import { T } from "./ui";

const LINKS = [
  ["Privacy policy", "/privacy"],
  ["Terms of use", "/terms"],
] as const;

/** Links to the policies on the website (the Play Store asks for them in the app too). */
export default function LegalLinks({ color = tw.purple700, prefix }: { color?: string; prefix?: string }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", columnGap: 6 }}>
      {prefix && <T style={{ fontSize: fs.sm, color }}>{prefix}</T>}
      {LINKS.map(([label, path], i) => (
        <View key={path} style={{ flexDirection: "row", columnGap: 6 }}>
          {i > 0 && <T style={{ fontSize: fs.sm, color }}>·</T>}
          <Pressable onPress={() => void Linking.openURL(API_URL + path)} hitSlop={8}>
            <T w={700} style={{ fontSize: fs.sm, color, textDecorationLine: "underline" }}>
              {label}
            </T>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
