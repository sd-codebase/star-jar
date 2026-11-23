// Play Console flags `android.hardware.screen.portrait` as a *required* hardware feature, because the app
// locks to portrait. Declare it optional so it doesn't restrict which devices can install the app.
const { withAndroidManifest } = require("expo/config-plugins");

module.exports = (config) =>
  withAndroidManifest(config, (c) => {
    const manifest = c.modResults.manifest;
    const features = (manifest["uses-feature"] ??= []);
    const name = "android.hardware.screen.portrait";
    const existing = features.find((f) => f.$["android:name"] === name);
    if (existing) existing.$["android:required"] = "false";
    else features.push({ $: { "android:name": name, "android:required": "false" } });
    return c;
  });
