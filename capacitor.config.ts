import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.neoncronium",
  appName: "NEON CRONIUM",
  webDir: "www",
  backgroundColor: "#050610",
  loggingBehavior: "none",
  ios: {
    contentInset: "never",
    preferredContentMode: "mobile",
    scrollEnabled: false
  },
  server: {
    androidScheme: "https"
  }
};

export default config;
