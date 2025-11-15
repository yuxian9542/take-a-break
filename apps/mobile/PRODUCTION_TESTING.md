# Production Testing Guide - iOS Development Build

This guide explains how to test the app on a real iOS device using a development build, which supports native modules (required for real voice recording).

## Quick Note on Commands

**All `eas` commands in this guide should be run with:**
- `pnpm exec eas` (recommended - uses project version)
- OR `npx eas` 
- OR install globally: `npm install -g eas-cli` then use `eas` directly

**Examples:**
```bash
# Instead of: eas login
pnpm exec eas login

# Instead of: eas build ...
pnpm exec eas build ...
```

## Prerequisites

1. **Apple Developer Account** (REQUIRED for real device testing)
   - **Free account** (Recommended to start):
     - Sign up: https://developer.apple.com/programs/enroll/
     - Can test on your own iPhone/iPad
     - Certificates expire after 7 days (need to rebuild)
     - Good for initial testing
   - **Paid account** ($99/year):
     - Certificates valid for 1 year
     - Can test on multiple devices
     - Can submit to App Store
     - Required for TestFlight distribution
   - **Note:** You MUST have an Apple Developer account (free or paid) to install apps on real iOS devices

2. **EAS CLI** (already installed in project)
   - Use `pnpm exec eas` or `npx eas` (recommended - uses project version)
   - OR install globally: `npm install -g eas-cli` (optional)

3. **Expo Account** (required for EAS Build)
   ```bash
   cd apps/mobile
   pnpm exec eas login
   # OR: npx eas login
   ```

4. **Apple Developer Setup**
   - Sign in to Apple Developer account: https://developer.apple.com
   - Create App ID (if not exists): https://developer.apple.com/account/resources/identifiers/list
   - Create Distribution Certificate and Provisioning Profile (EAS can auto-generate these)

## Step 1: Configure Apple Developer Credentials

EAS can automatically manage your certificates and provisioning profiles:

```bash
cd apps/mobile
pnpm exec eas build:configure
# OR: npx eas build:configure
```

This will:
- Ask you to sign in with Apple Developer account
- Auto-generate certificates and provisioning profiles
- Store credentials securely in EAS

## Step 2: Build Development Build for iOS

### Option A: Build on EAS (Cloud Build - Recommended)

```bash
cd apps/mobile
eas build --profile development --platform ios
```

This will:
- Upload your code to EAS servers
- Build the app in the cloud (takes ~10-15 minutes)
- Generate an `.ipa` file you can install on your device
- Provide a download link or QR code

### Option B: Build Locally (Faster, but requires Xcode)

```bash
cd apps/mobile
eas build --profile development --platform ios --local
```

**Note:** Local builds require:
- Xcode installed
- iOS Simulator or physical device connected
- More setup, but faster iteration

## Step 3: Install on iOS Device

### Method 1: Install via QR Code (Easiest)

1. After build completes, EAS will provide a QR code
2. Open QR code on your iPhone camera
3. Tap the notification to install
4. Go to Settings → General → VPN & Device Management
5. Trust the developer certificate
6. Open the app

### Method 2: Install via TestFlight (For Multiple Devices)

1. After build completes, submit to TestFlight:
   ```bash
   eas build --profile preview --platform ios
   eas submit --platform ios
   ```
2. Install TestFlight app from App Store
3. Accept invitation to test the app
4. Install and test

### Method 3: Install via Xcode (For Local Builds)

1. Open Xcode
2. Connect your iPhone via USB
3. Select your device in Xcode
4. Build and run (`Cmd+R`)

## Step 4: Run Development Server

After installing the development build:

1. **Start Metro bundler:**
   ```bash
   cd apps/mobile
   pnpm run dev
   ```

2. **Connect to development server:**
   - Open the app on your device
   - Shake device to open Developer Menu
   - Select "Enter URL manually" or scan QR code
   - Enter your computer's IP address: `http://YOUR_IP:8081`

3. **Verify connection:**
   - App should reload with latest code
   - You can now test with real voice recording (if RealPcmGenerator is implemented)

## Step 5: Implement Real Voice Recording (Optional)

**Current Status:** App uses `TestPcmGenerator` (test audio, works in Expo Go)

**For Production:** Implement `RealPcmGenerator` to record real voice.

### Option 1: Use react-native-audio-recorder-player (Recommended)

1. **Install library:**
   ```bash
   cd apps/mobile
   pnpm add react-native-audio-recorder-player
   ```

2. **Update audioRecorder.ts:**
   - Replace `TestPcmGenerator` with `RealPcmGenerator` implementation
   - See implementation example in `audioRecorder.ts` comments

3. **Rebuild development build:**
   ```bash
   eas build --profile development --platform ios
   ```

### Option 2: Use Custom Native Module

- Create native module wrapping `AVAudioRecorder` (iOS)
- Provides real-time PCM16 callbacks
- Requires native iOS/Android development knowledge

### Option 3: Keep Test Audio (For Now)

- App will work with test audio
- Good for testing WebSocket/VAD/playback flow
- Can implement real recording later

## Step 6: Test Voice Chat

1. **Start backend servers:**
   ```bash
   # Terminal 1: Main API server
   cd services/api
   HOST=0.0.0.0 PORT=3333 pnpm run dev

   # Terminal 2: Voice backend
   cd services/voice/web_agent/web_agent
   ./start_backend.sh
   ```

2. **Configure app:**
   - Ensure `.env.local` has correct API URLs:
     ```
     EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_IP:3333
     EXPO_PUBLIC_VOICE_API_BASE_URL=http://YOUR_COMPUTER_IP:8000
     ```

3. **Test in app:**
   - Open app on device
   - Navigate to Break tab
   - Click "Voice Chat" button
   - Test voice recording and playback

## Troubleshooting

### Build Fails

1. **Check Apple Developer credentials:**
   ```bash
   eas credentials
   ```

2. **Regenerate certificates:**
   ```bash
   eas credentials --platform ios
   ```

3. **Check app.json configuration:**
   - Verify `bundleIdentifier` is correct
   - Ensure `expo-dev-client` is in dependencies

### App Won't Install on Device

1. **Trust developer certificate:**
   - Settings → General → VPN & Device Management
   - Trust the developer certificate

2. **Check device UDID:**
   - Ensure device is registered in Apple Developer account
   - EAS should auto-register devices, but check if needed

### Can't Connect to Development Server

1. **Check network:**
   - Ensure device and computer are on same WiFi network
   - Check firewall settings (allow port 8081)

2. **Use tunnel mode:**
   ```bash
   pnpm run dev --tunnel
   ```
   - Slower, but works across networks

3. **Check IP address:**
   - Find your computer's IP: `ifconfig` (Mac) or `ipconfig` (Windows)
   - Use `http://YOUR_IP:8081` in app

### Voice Recording Not Working

1. **Check permissions:**
   - Ensure microphone permission is granted
   - Check `app.json` has `NSMicrophoneUsageDescription`

2. **Check implementation:**
   - Verify `RealPcmGenerator` is implemented (not `TestPcmGenerator`)
   - Check native module is properly installed

3. **Check backend:**
   - Ensure voice backend is running on port 8000
   - Check WebSocket connection is established

## Build Profiles Explained

### Development Build
- **Purpose:** Testing with native modules
- **Command:** `eas build --profile development --platform ios`
- **Features:**
  - Includes `expo-dev-client`
  - Supports custom native modules
  - Can connect to development server
  - Good for testing before production

### Preview Build
- **Purpose:** Testing without development server
- **Command:** `eas build --profile preview --platform ios`
- **Features:**
  - Standalone app (no dev server needed)
  - Good for testing on multiple devices
  - Can distribute via TestFlight

### Production Build
- **Purpose:** App Store submission
- **Command:** `eas build --profile production --platform ios`
- **Features:**
  - Optimized for release
  - Ready for App Store
  - Includes production certificates

## Next Steps

1. **Build development build:**
   ```bash
   eas build --profile development --platform ios
   ```

2. **Install on device** (via QR code or TestFlight)

3. **Test voice chat:**
   - Start backend servers
   - Connect app to development server
   - Test voice recording and playback

4. **Implement real voice recording** (optional):
   - Install `react-native-audio-recorder-player`
   - Implement `RealPcmGenerator`
   - Rebuild development build

5. **When ready for production:**
   - Build production build
   - Submit to App Store via EAS Submit

## References

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Development Builds Guide](https://docs.expo.dev/development/introduction/)
- [Apple Developer Account](https://developer.apple.com)
- [Expo Dev Client](https://docs.expo.dev/clients/introduction/)

