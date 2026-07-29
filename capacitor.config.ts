import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tuinnov8.aiea',
  appName: 'AIEA',
  webDir: 'public',
  server: {
    // IMPORTANT: set this to your live Vercel deployment URL before building
    // native apps. Example: "https://your-app.vercel.app"
    url: "https://epireg-aiea.vercel.app",
  },
  android: {
    // Use https scheme for deep links / asset loading
    scheme: 'https',
    allowMixedContent: false
  },
  ios: {
    // iOS-specific preferences can go here
  }
};

export default config;
