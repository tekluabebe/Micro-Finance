# Micro-Finance Mobile

Cross-platform Android and iPhone starter app built with Expo and React Native.
It includes role-selectable sign-in, secure session storage, role-aware member
and staff navigation, a fixed header and bottom navigation bar, and a slide-out
menu for the full set of web-app sections.

The mobile screens cover the dashboard, member directory, savings/deposits,
loans and approvals, loan payments, withdrawals and approvals, financial
reports, dividends, profit, income and expenses, balance sheets, cash flow,
check and balance, terminated-member restoration, profiles, password-reset
requests, shared activity history, help, and local preferences. Staff can create members, record savings
and loan payments, and submit loan and withdrawal decisions. Members can submit
loan and withdrawal requests and view their own account data.

Report and financial screens use the existing server API where available.
Balance sheets are stored in the shared backend and synchronized between web
and mobile. App-specific preferences remain stored securely on the device.

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

## Create an Android APK to share

The app's Android display name is `Micro-Finance` and its application ID is
`com.microfinance.mobile` in `app.json`. To change the label shown under the
icon, change `expo.name` there before building.

1. Install the EAS command-line tool with `npm install -g eas-cli` and sign in
   with `eas login`.
2. From this directory, run `eas build --platform android --profile preview`.
   If prompted, configure the project and let EAS create the Android signing
   key. EAS will provide a link to download the APK when the build completes.
3. Send that `.apk` file to the Android phone using Bluetooth, Xender, or USB.
   On the receiving phone, open the APK and allow installation from that
   file-transfer app if Android asks. Only install APKs from a source you trust.

EAS Build uploads the app source to Expo's build service. To keep the source
and signing process entirely local, use a local Android build setup instead.
Phones need internet access to use the app's hosted API and database.
