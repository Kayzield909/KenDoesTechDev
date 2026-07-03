# Movement — dev workflow

Two loops. Use Expo Go for almost everything; only touch a build when you need
real audio or a shippable APK.

## Loop A — Expo Go (default, zero builds, no Android toolchain)

The native audio module is optional, so the whole app runs in **Expo Go** — only
the real media-volume fade is simulated (`MEDIA VOLUME · SIM`). Everything else
(dial, motion, timer, haptics, settings, dimming) is live with ~1s hot-reload.

**One-time:** install "Expo Go" from the Play Store on the Pixel.

**Each session (on the Ryzen box):**
```bash
git pull                 # get Claude's latest changes
npm install              # only when dependencies changed
npm run go               # = expo start --tunnel
```
Scan the QR in Expo Go. Then the loop is:

```
Claude pushes  →  `git pull`  →  Metro hot-reloads on the phone
```

No APK, no Gradle, no JDK. This is the fast path for UI/motion/feel work.

## Loop B — Real audio (local dev build)

Needed only to test the actual media fade/pause/restore (Phase B), or any native
change. Requires the Android toolchain set up once (JDK 17 + Android SDK).

```bash
npm install
npm run dev              # = expo start --dev-client --tunnel
# first time / after native changes, build & install the dev client:
npm run android          # = expo run:android  (incremental builds are quick)
```

Rebuild the dev client **only** when native code changes:
- `modules/movement-audio` Kotlin
- adding/removing a native module or config plugin
- `app.json` native fields (package, permissions, icon)

Pure `src/**` changes hot-reload — no rebuild.

## Shippable APK / Play Store (occasional)

- Installable APK to sideload: `eas build --profile preview --platform android`
- Play Store AAB: `eas build --profile production`

EAS free-tier queues can be long; reserve cloud builds for shareable/store
artifacts, not iteration.

## Toolchain gotcha (read once)

Gradle needs **JDK 17**. If another dev environment (e.g. Oculus/Meta) puts a
different Java on PATH, builds grab the wrong one. Fix permanently:

- System env var `JAVA_HOME` → your Temurin 17 folder
  (e.g. `C:\Program Files\Eclipse Adoptium\jdk-17.0.x.y-hotspot`)
- Ensure `%JAVA_HOME%\bin` is **above** any other Java in `Path`
- New terminal → `java -version` must say `17`

Loop A (Expo Go) avoids all of this — no local Java/SDK needed.
