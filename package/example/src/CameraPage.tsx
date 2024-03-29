import * as React from 'react'
import { useRef, useState, useCallback, useMemo } from 'react'
import { Pressable, StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native'
import { PinchGestureHandler, PinchGestureHandlerGestureEvent, TapGestureHandler } from 'react-native-gesture-handler'
import Animated, { Extrapolate, interpolate, useAnimatedGestureHandler, useAnimatedProps, runOnJS, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { CameraRuntimeError, PhotoFile, DeviceFilter, useCameraDevice, useCameraDevices, useCameraFormat, useFrameProcessor, VideoFile } from 'react-native-vision-camera'
import { Camera } from 'react-native-vision-camera'
import { CONTENT_SPACING, CONTROL_BUTTON_SIZE, MAX_ZOOM_FACTOR, SAFE_AREA_PADDING, SCREEN_HEIGHT, SCREEN_WIDTH, CAPTURE_BUTTON_SIZE } from './Constants'
import Reanimated from 'react-native-reanimated'
import { useEffect } from 'react'
import { useIsForeground } from './hooks/useIsForeground'
import { StatusBarBlurBackground } from './views/StatusBarBlurBackground'
import { CaptureButton } from './views/CaptureButton'
import { PressableOpacity } from 'react-native-pressable-opacity'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import IonIcon from 'react-native-vector-icons/Ionicons'
import type { Routes } from './Routes'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useIsFocused } from '@react-navigation/core'
import { examplePlugin } from './frame-processors/ExamplePlugin'
import { exampleKotlinSwiftPlugin } from './frame-processors/ExampleKotlinSwiftPlugin'
import { usePreferredCameraDevice } from './hooks/usePreferredCameraDevice'

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)
Reanimated.addWhitelistedNativeProps({
  zoom: true,
})

const SCALE_FULL_ZOOM = 3
const { width } = Dimensions.get('window');
const tabSpacing = 20;

type Props = NativeStackScreenProps<Routes, 'CameraPage'>
export function CameraPage({ navigation }: Props): React.ReactElement {
  const camera = useRef<Camera>(null)
  const [isCameraInitialized, setIsCameraInitialized] = useState(false)
  const hasMicrophonePermission = useMemo(() => Camera.getMicrophonePermissionStatus() === 'granted', [])
  const zoom = useSharedValue(0)
  const isPressingButton = useSharedValue(false)
  const [isRecording, setIsRecording] = useState(false)
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo')
  const [isRecordingFinished, setIsRecordingFinished] = useState(false)

  const mediaSwitch = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withSpring(captureMode === 'video' ? 0 : width / 5) }],
    };
  });

  // check if camera page is active
  const isFocussed = useIsFocused()
  const isForeground = useIsForeground()
  const isActive = isFocussed && isForeground

  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back')
  const [enableHdr, setEnableHdr] = useState(false)
  const [flash, setFlash] = useState<'off' | 'on'>('off')
  const [enableNightMode, setEnableNightMode] = useState(false)

  // const [preferredDevice] = usePreferredCameraDevice()
  // let device = useCameraDevices(cameraPosition)
  // let device = useCameraDevice('back')
  const [deviceConfig, setDeviceConfig] = useState<DeviceFilter>({
    physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera'],
  });
  const device = useCameraDevice('back', deviceConfig);
  const devices = useCameraDevices()


  const { hasWide, hasUltra, hasTele } = useMemo(() => {
    let hasWide = false;
    let hasUltra = false;
    let hasTele = false;

    devices.forEach(entry => {
      const physicalDevices = entry.physicalDevices;

      if (Array.isArray(physicalDevices)) {
        if (physicalDevices.includes('wide-angle-camera')) {
          hasWide = true;
        }
        if (physicalDevices.includes('ultra-wide-angle-camera')) {
          hasUltra = true;
        }
        if (physicalDevices.includes('telephoto-camera')) {
          hasTele = true;
        }
      }
    });

    return { hasWide, hasUltra, hasTele };
  }, [devices]);

  const [targetFps, setTargetFps] = useState(60)

  const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH
  const format = useCameraFormat(device, [
    { fps: targetFps },
    { videoAspectRatio: screenAspectRatio },
    { videoResolution: 'max' },
    { photoAspectRatio: screenAspectRatio },
    { photoResolution: 'max' },
  ])

  const fps = Math.min(format?.maxFps ?? 1, targetFps)

  const supportsFlash = device?.hasFlash ?? false
  const supportsHdr = format?.supportsPhotoHdr
  const supports60Fps = useMemo(() => device?.formats.some((f) => f.maxFps >= 60), [device?.formats])
  const canToggleNightMode = device?.supportsLowLightBoost ?? false

  //#region Animated Zoom
  // This just maps the zoom factor to a percentage value.
  // so e.g. for [min, neutr., max] values [1, 2, 128] this would result in [0, 0.0081, 1]
  const minZoom = device?.minZoom ?? 1
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR)

  const cameraAnimatedProps = useAnimatedProps(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom)
    return {
      zoom: z,
    }
  }, [maxZoom, minZoom, zoom])
  //#endregion

  //#region Callbacks
  const setIsPressingButton = useCallback(
    (_isPressingButton: boolean) => {
      isPressingButton.value = _isPressingButton
    },
    [isPressingButton],
  )
  // Camera callbacks
  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error)
  }, [])
  const onInitialized = useCallback(() => {
    console.log('Camera initialized!')
    setIsCameraInitialized(true)
  }, [])

  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
      console.log(`Media captured! ${JSON.stringify(media)}`)
      navigation.navigate('MediaPage', {
        path: media.path,
        type: type,
      })
    },
    [navigation],
  )
  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === 'back' ? 'front' : 'back'))
  }, [])
  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === 'off' ? 'on' : 'off'))
  }, [])
  //#endregion

  //#region Tap Gesture
  const onDoubleTap = useCallback(() => {
    onFlipCameraPressed()
  }, [onFlipCameraPressed])
  //#endregion

  //#region Effects
  const neutralZoom = device?.neutralZoom ?? 1
  useEffect(() => {
    // Run everytime the neutralZoomScaled value changes. (reset zoom when device changes)
    zoom.value = neutralZoom
  }, [neutralZoom, zoom])
  //#endregion

  //#region Pinch to Zoom Gesture
  // The gesture handler maps the linear pinch gesture (0 - 1) to an exponential curve since a camera's zoom
  // function does not appear linear to the user. (aka zoom 0.1 -> 0.2 does not look equal in difference as 0.8 -> 0.9)
  const onPinchGesture = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent, { startZoom?: number }>({

    onStart: (_, context) => {
      runOnJS(setDeviceConfig)({
        ...deviceConfig,
        physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera'],
      });
      console.log("start zoom value", zoom.value)
      context.startZoom = zoom.value
    },
    onActive: (event, context) => {
      // we're trying to map the scale gesture to a linear zoom here

      const startZoom = context.startZoom ?? 0
      const scale = interpolate(event.scale, [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM], [-1, 0, 1], Extrapolate.CLAMP)
      zoom.value = interpolate(scale, [-1, 0, 1], [minZoom, startZoom, maxZoom], Extrapolate.CLAMP)
      console.log("here pinch", zoom.value)
    },
  })
  //#endregion

  useEffect(() => {
    const f =
      format != null
        ? `(${format.photoWidth}x${format.photoHeight} photo / ${format.videoWidth}x${format.videoHeight}@${format.maxFps} video @ ${fps}fps)`
        : undefined
    console.log(`Camera: ${device?.name} | Format: ${f}`)
  }, [device?.name, format, fps])

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'

    // console.log(`${frame.timestamp}: ${frame.width}x${frame.height} ${frame.pixelFormat} Frame (${frame.orientation})`)
    examplePlugin(frame)
    exampleKotlinSwiftPlugin(frame)
  }, [])

  return (
    <View style={styles.container}>
      {device != null && (
        <PinchGestureHandler onGestureEvent={onPinchGesture} enabled={isActive}>
          <Reanimated.View style={StyleSheet.absoluteFill}>
            <TapGestureHandler onEnded={onDoubleTap} numberOfTaps={2}>
              <ReanimatedCamera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                format={format}
                fps={fps}
                photoHdr={enableHdr}
                videoHdr={enableHdr}
                lowLightBoost={device.supportsLowLightBoost && enableNightMode}
                isActive={isActive}
                onInitialized={onInitialized}
                onError={onError}
                enableZoomGesture={false}
                animatedProps={cameraAnimatedProps}
                exposure={0}
                enableFpsGraph={true}
                orientation="portrait"
                photo={true}
                video={false}
                audio={hasMicrophonePermission}
                frameProcessor={frameProcessor}
              />
            </TapGestureHandler>
          </Reanimated.View>
        </PinchGestureHandler>
      )}
      <View style={styles.captureButtonContainer}>
        <View style={styles.mediaTabContainer}>
          <Animated.View style={[styles.mediaTab, mediaSwitch]}>
            <TouchableOpacity onPress={() => setCaptureMode('photo')}>
              <Text style={[styles.tabText, captureMode == 'photo' && styles.activeMode]}>Photo</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.mediaTab, mediaSwitch]}>
            <TouchableOpacity onPress={() => setCaptureMode('video')}>
              <Text style={[styles.tabText, captureMode == 'video' && styles.activeMode]}>Video</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <View style={styles.buttonsContainer}>
          <CaptureButton
            style={styles.captureButton}
            camera={camera}
            onMediaCaptured={onMediaCaptured}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            cameraZoom={zoom}
            minZoom={minZoom}
            maxZoom={maxZoom}
            flash={supportsFlash ? flash : 'off'}
            enabled={isCameraInitialized && isActive}
            setIsPressingButton={setIsPressingButton}
            captureMode={captureMode}
            isRecordingFinished={isRecordingFinished}
            setIsRecordingFinished={setIsRecordingFinished}
          />
          <View style={styles.videoControlContainer}>
            <TouchableOpacity >
              <Text>x</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsRecordingFinished(true)}>
              <Text>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <StatusBarBlurBackground />

      <View style={styles.rightButtonRow}>
        <PressableOpacity style={styles.button} onPress={onFlipCameraPressed} disabledOpacity={0.4}>
          <IonIcon name="camera-reverse" color="white" size={24} />
        </PressableOpacity>
        {supportsFlash && (
          <PressableOpacity style={styles.button} onPress={onFlashPressed} disabledOpacity={0.4}>
            <IonIcon name={flash === 'on' ? 'flash' : 'flash-off'} color="white" size={24} />
          </PressableOpacity>
        )}
        {supports60Fps && (
          <PressableOpacity style={styles.button} onPress={() => setTargetFps((t) => (t === 30 ? 60 : 30))}>
            <Text style={styles.text}>{`${targetFps}\nFPS`}</Text>
          </PressableOpacity>
        )}
        {supportsHdr && (
          <PressableOpacity style={styles.button} onPress={() => setEnableHdr((h) => !h)}>
            <MaterialIcon name={enableHdr ? 'hdr' : 'hdr-off'} color="white" size={24} />
          </PressableOpacity>
        )}
        {canToggleNightMode && (
          <PressableOpacity style={styles.button} onPress={() => setEnableNightMode(!enableNightMode)} disabledOpacity={0.4}>
            <IonIcon name={enableNightMode ? 'moon' : 'moon-outline'} color="white" size={24} />
          </PressableOpacity>
        )}
        <PressableOpacity style={styles.button} onPress={() => navigation.navigate('Devices')}>
          <IonIcon name="settings-outline" color="white" size={24} />
        </PressableOpacity>
        <PressableOpacity style={styles.button} onPress={() => navigation.navigate('CodeScannerPage')}>
          <IonIcon name="qr-code-outline" color="white" size={24} />
        </PressableOpacity>
        {hasUltra && (
          // <PressableOpacity style={styles.button} onPress={() => setDeviceType("ultra-wide-angle-camera")}>
          <PressableOpacity style={styles.button} onPress={() => setDeviceConfig({
            ...deviceConfig,
            physicalDevices: ["ultra-wide-angle-camera"],
          })}>
            <Text style={styles.text}>ultra</Text>
          </PressableOpacity>)}
        {hasWide && (
          <PressableOpacity style={styles.button} onPress={() => setDeviceConfig({
            ...deviceConfig,
            physicalDevices: ["wide-angle-camera"],
          })}>
            {/* <PressableOpacity style={styles.button} onPress={() => setDeviceType("wide-angle-camera")}> */}
            <Text style={styles.text}>wide</Text>
          </PressableOpacity>
        )}
        {hasTele && (
          <PressableOpacity style={styles.button} onPress={() => setDeviceConfig({
            ...deviceConfig,
            physicalDevices: ["telephoto-camera"],
          })}>
            <Text style={styles.text}>tele</Text>
          </PressableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  captureButtonContainer: {
    position: 'absolute',
    height: '20%',
    width: '100%',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(140, 140, 140, 0.5)',
    bottom: 0,
  },
  mediaTabContainer: {
    flexDirection: 'row',
    width: '100%',
    top: 5,
    marginLeft: 2 * width / 5
  },
  mediaTab: {
    width: width / 5,
    alignItems: 'center',
    alignSelf: 'center',
  },
  tabText: {
    fontSize: 16,
  },
  activeMode: {
    fontWeight: 'bold'
  },
  buttonsContainer: {
    width: (SCREEN_WIDTH + CAPTURE_BUTTON_SIZE) / 2,
    height: '80%',
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    // justifyContent: 'center',
    bottom: '10%',
    right: 0,
    flex: 1,
  },
  captureButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    // alignContent:'center',
    // bottom: SAFE_AREA_PADDING.paddingBottom,
  },
  videoControlContainer: {
    width: (SCREEN_WIDTH - CAPTURE_BUTTON_SIZE) / 2,
    alignItems: 'center',
    flexDirection: 'row',
    right: 0,
    justifyContent: 'space-evenly',
    marginRight: 0,
    marginLeft: 'auto',
  },
  button: {
    marginBottom: CONTENT_SPACING,
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    borderRadius: CONTROL_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(140, 140, 140, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtonRow: {
    position: 'absolute',
    right: SAFE_AREA_PADDING.paddingRight,
    top: SAFE_AREA_PADDING.paddingTop,
  },
  text: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})
