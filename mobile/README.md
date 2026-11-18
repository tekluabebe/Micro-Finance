# Micro-Finance Mobile

Cross-platform Android and iPhone starter app built with Expo and React Native.
It currently includes role-selectable sign-in, secure session storage, and
role-specific member or staff dashboards with mobile views for members, savings,
loans, payments, withdrawals, reports, and profiles.

## Run the app

1. Install Node.js and the Expo Go app on your test phone.
2. From this directory, run `npm start`.
3. Scan the QR code with Expo Go (Android) or the iPhone Camera app.

For an Android emulator, run `npm run android`. Local iOS simulator builds
require macOS with Xcode; a physical iPhone can use Expo Go while developing
from Windows.

## API configuration

The app defaults to the deployed Micro-Finance API. To use a local server, copy
`.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to an address reachable
from the phone, such as `http://192.168.1.25:5000/api`. Use your computer's LAN
IP instead of `localhost` when testing from a physical device. Restart Expo
after changing the API URL.

The API server must be running and allow requests from the device's network.
For installed Android builds, use an HTTPS API URL; Android may block local
plain-HTTP traffic outside Expo Go.

The app uses the role-protected `/api/mobile/dashboard` endpoint. Deploy the
updated server before using the hosted API, or run the updated local server.

## Build notes

Expo Go is suitable for development previews. Store-ready Android and iOS
installers require signing credentials and an Expo Application Services build.
