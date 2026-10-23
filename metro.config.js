const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = process.env.EXPO_PROJECT_ROOT || process.cwd() || __dirname;
const config = getDefaultConfig(projectRoot);

// In Expo Go on Android, ExpoTopicSubscriptionModule (used only for remote push topics)
// is not present in the native binary. Redirect it to the universal JS fallback so local
// notifications work seamlessly without crashing the JS runtime on module load.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === "android" &&
    (moduleName.includes("TopicSubscriptionModule") ||
      (context.originModulePath &&
        context.originModulePath.includes("expo-notifications") &&
        moduleName.includes("TopicSubscriptionModule")))
  ) {
    return {
      filePath: path.resolve(
        __dirname,
        "node_modules/expo-notifications/build/TopicSubscriptionModule.js"
      ),
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
