

### Features

This project is using [React Native Vision Camera](https://react-native-vision-camera.com/docs) to build a posting photo/video feature on social app.

* 📸 Photo and Video capture
* 📷 Select devices and multi-cameras ("fish-eye" zoom)
* 🔍 Smooth zooming (Reanimated)
* 📱 QR/Barcode scanner
* ⏯️ Pause and resume video
* 👁️ Select video thumbnail
* 📍 Add location and tags to the post
* 🫙 Store video as draft
* 🧩 Compress the video and post

Install VisionCamera from npm:

```sh
yarn add react-native-vision-camera
cd ios && pod install
yarn bootstrap #(in /package directory)
```

..and get started by [setting up permissions](https://react-native-vision-camera.com/docs/guides)!

### Documentation

* [Guides](https://react-native-vision-camera.com/docs/guides)
* [API](https://react-native-vision-camera.com/docs/api)
* [Example](./package/example/)
* [Frame Processor Plugins](https://react-native-vision-camera.com/docs/guides/frame-processor-plugin-list)

### V3

You're looking at the V3 version of VisionCamera, which features a full rewrite on the Android codebase and a huge refactor on the iOS codebase. If you encounter issues on V3, you can also [downgrade to V2](https://github.com/mrousavy/react-native-vision-camera/tree/v2), which is still partially supported.

### Example

```tsx
function App() {
  const device = useCameraDevice('back')

  if (device == null) return <NoCameraErrorView />
  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
    />
  )
}
```

> See the [example](./package/example/) app

### Adopting at scale

<a href="https://github.com/sponsors/mrousavy">
  <img align="right" width="160" alt="This library helped you? Consider sponsoring!" src=".github/funding-octocat.svg">
</a>

VisionCamera is provided _as is_, I work on it in my free time.

If you're integrating VisionCamera in a production app, consider [funding this project](https://github.com/sponsors/mrousavy) and <a href="mailto:me@mrousavy.com?subject=Adopting VisionCamera at scale">contact me</a> to receive premium enterprise support, help with issues, prioritize bugfixes, request features, help at integrating VisionCamera and/or Frame Processors, and more.

### Socials

* 🐦 [**Follow me on Twitter**](https://twitter.com/mrousavy) for updates
* 📝 [**Check out my blog**](https://mrousavy.com/blog) for examples and experiments
* 💬 [**Join the Margelo Community Discord**](https://discord.gg/6CSHz2qAvA) for chatting about VisionCamera
* 💖 [**Sponsor me on GitHub**](https://github.com/sponsors/mrousavy) to support my work
* 🍪 [**Buy me a Ko-Fi**](https://ko-fi.com/mrousavy) to support my work
