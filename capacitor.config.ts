import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.0ab65dfd577c4ab1a380c58bd6ff5762',
  appName: 'ÆTH Observatory',
  webDir: 'dist',
  server: {
    url: 'https://0ab65dfd-577c-4ab1-a380-c58bd6ff5762.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#06060c',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#06060c',
      overlaysWebView: false,
    },
  },
};

export default config;
