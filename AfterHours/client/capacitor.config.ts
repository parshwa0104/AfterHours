import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.afterhours.app',
  appName: 'AfterHours',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
};

export default config;
