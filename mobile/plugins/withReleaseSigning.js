// Signs Android release builds with the Star Jar upload key instead of the template's
// debug key. The keystore and passwords live outside the repo, in ~/.gradle/gradle.properties:
//   STARJAR_UPLOAD_STORE_FILE=/absolute/path/to/starjar-upload.jks
//   STARJAR_UPLOAD_STORE_PASSWORD=…
//   STARJAR_UPLOAD_KEY_ALIAS=starjar-upload
//   STARJAR_UPLOAD_KEY_PASSWORD=…
// A release build without them fails rather than shipping a debug-signed app.
const { withAppBuildGradle } = require("expo/config-plugins");

const MARK = "// starjar-release-signing";

const RELEASE_CONFIG = `
        release { ${MARK}
            if (findProperty('STARJAR_UPLOAD_STORE_FILE')) {
                storeFile file(findProperty('STARJAR_UPLOAD_STORE_FILE'))
                storePassword findProperty('STARJAR_UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('STARJAR_UPLOAD_KEY_ALIAS')
                keyPassword findProperty('STARJAR_UPLOAD_KEY_PASSWORD')
            }
        }`;

const GUARD = `
${MARK}
gradle.taskGraph.whenReady { graph ->
    def releasing = graph.allTasks.any { it.project == project && it.name ==~ /(assemble|bundle|package)Release/ }
    if (releasing && !findProperty('STARJAR_UPLOAD_STORE_FILE')) {
        throw new GradleException("Release signing is not set up: add the STARJAR_UPLOAD_* properties to ~/.gradle/gradle.properties (see mobile/plugins/withReleaseSigning.js).")
    }
}
`;

function applySigning(gradle) {
  if (gradle.includes(MARK)) return gradle;

  // Add the release signing config right after the debug one.
  const debugConfig = /(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/;
  if (!debugConfig.test(gradle)) throw new Error("withReleaseSigning: signingConfigs.debug not found in app/build.gradle");
  gradle = gradle.replace(debugConfig, `$1${RELEASE_CONFIG}`);

  // Point the release build type at it (the template uses signingConfigs.debug).
  const releaseType = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
  if (!releaseType.test(gradle)) throw new Error("withReleaseSigning: release build type signingConfig not found in app/build.gradle");
  gradle = gradle.replace(releaseType, "$1signingConfig signingConfigs.release");

  return gradle + GUARD;
}

module.exports = (config) =>
  withAppBuildGradle(config, (c) => {
    if (c.modResults.language !== "groovy") throw new Error("withReleaseSigning: expected a Groovy app/build.gradle");
    c.modResults.contents = applySigning(c.modResults.contents);
    return c;
  });
