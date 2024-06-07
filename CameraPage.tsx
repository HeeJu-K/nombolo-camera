import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { Routes } from './Routes'

// import * as React from 'react'
import React, { useRef, useState, useCallback, useMemo } from 'react'

import { Camera, CameraRuntimeError, PhotoFile, DeviceFilter, PhysicalCameraDeviceType, useCameraDevice, useCameraDevices, useCameraFormat, useFrameProcessor, VideoFile } from 'react-native-vision-camera'
import Animated, { Extrapolate, interpolate, useAnimatedGestureHandler, useAnimatedProps, runOnJS, useSharedValue, useDerivedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Reanimated from 'react-native-reanimated'
import { useIsFocused } from '@react-navigation/core'


import { Pressable, StyleSheet, Text, View, TouchableOpacity, Dimensions, ScrollView } from 'react-native'
import { PinchGestureHandler, PinchGestureHandlerGestureEvent, TapGestureHandler } from 'react-native-gesture-handler'

import { useIsForeground } from './hooks/useIsForeground.ts'
// import { examplePlugin } from './frame-processors/ExamplePlugin'
// import { exampleKotlinSwiftPlugin } from './frame-processors/ExampleKotlinSwiftPlugin'
import { usePreferredCameraDevice } from './hooks/usePreferredCameraDevice'
import { CONTENT_SPACING, CONTROL_BUTTON_SIZE, FINISH_BUTTON_SIZE, MAX_ZOOM_FACTOR, SAFE_AREA_PADDING, SCREEN_HEIGHT, SCREEN_WIDTH, CAPTURE_BUTTON_SIZE } from './Constants'

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)
Reanimated.addWhitelistedNativeProps({
  zoom: true,
  exposure: true,
})

const SCALE_FULL_ZOOM = 3
const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<Routes, 'CameraPage'>

export function CameraPage({ navigation }: Props): React.ReactElement {

  const camera = useRef<Camera>(null)
  const [isCameraInitialized, setIsCameraInitialized] = useState(false)
  const hasMicrophonePermission = useMemo(() => Camera.getMicrophonePermissionStatus() === 'granted', [])

  // check if camera page is active
  const isFocussed = useIsFocused()
  const isForeground = useIsForeground()
  const isActive = isFocussed && isForeground

  const [deviceConfig, setDeviceConfig] = useState<DeviceFilter>({
    physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera'],
  });
  const device = useCameraDevice('back', deviceConfig);
  const devices = useCameraDevices()

  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back')

  // region Camera Config
  // const frameProcessor = useFrameProcessor((frame) => {
  //   'worklet'

  //   // console.log(`${frame.timestamp}: ${frame.width}x${frame.height} ${frame.pixelFormat} Frame (${frame.orientation})`)
  //   examplePlugin(frame)
  //   exampleKotlinSwiftPlugin(frame)
  // }, [])

  // end region Camera Config

  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === 'back' ? 'front' : 'back'))
  }, [])
  //#region Tap Gesture
  const onDoubleTap = useCallback(() => {
    onFlipCameraPressed()
  }, [onFlipCameraPressed])
  //#endregion

    // Camera callbacks
    const onError = useCallback((error: CameraRuntimeError) => {
      console.error(error)
    }, [])
    const onInitialized = useCallback(() => {
      console.log('Camera initialized!')
      setIsCameraInitialized(true)
    }, [])

  //#region Pinch to Zoom Gesture
  // The gesture handler maps the linear pinch gesture (0 - 1) to an exponential curve since a camera's zoom
  // function does not appear linear to the user. (aka zoom 0.1 -> 0.2 does not look equal in difference as 0.8 -> 0.9)
  const onPinchGesture = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent, { startZoom?: number }>({

    // onStart: (_, context) => {
    //     runOnJS(setDeviceConfig)({
    //         ...deviceConfig,
    //         physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera'],
    //     });
    //     // console.log("start zoom value", zoom.value)
    //     context.startZoom = zoom.value
    //     isPinching.value = true;
    // },
    // onActive: (event, context) => {
    //     // we're trying to map the scale gesture to a linear zoom here

    //     const startZoom = context.startZoom ?? 0
    //     const scale = interpolate(event.scale, [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM], [-1, 0, 1], Extrapolate.CLAMP)
    //     zoom.value = interpolate(scale, [-1, 0, 1], [minZoom, startZoom, maxZoom], Extrapolate.CLAMP)
    //     // console.log("here pinch", zoom.value)
    //     runOnJS(setZoomValue)(zoom.value);
    // },
    // onEnd: () => {
    //     isPinching.value = false;
    // }
  })
  //#endregion

  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
      // console.log(`Media captured! ${JSON.stringify(media)}`)
      navigation.navigate('MediaPage', {
        path: media.path,
        type: type,
        duration: (media as VideoFile).duration || 0,
      })
    },
    [navigation],
  )


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
                isActive={isActive}
                onInitialized={onInitialized}
                onError={onError}
                enableZoomGesture={false}
                orientation="portrait"
                photo={true}
                video={false}
                audio={hasMicrophonePermission}
                // frameProcessor={frameProcessor}
              />
              {/* <ReanimatedCamera
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
                exposure={exposureValue}
                enableFpsGraph={true}
                orientation="portrait"
                photo={true}
                video={false}
                audio={hasMicrophonePermission}
                frameProcessor={frameProcessor}
              /> */}
            </TapGestureHandler>

          </Reanimated.View>
        </PinchGestureHandler>
      )}
      {/* <View style={styles.topBanner}>
        <View style={styles.mediaTabContainer}>
          <Animated.View style={[styles.mediaTab, mediaSwitch]}>
          </Animated.View>
          <TouchableOpacity style={styles.mediaIcon} onPress={() => setCaptureMode('photo')}>
            <CameraIcon />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaIcon} onPress={() => setCaptureMode('video')}>
            <VideoIcon />
          </TouchableOpacity>
        </View>

      </View> */}
      {/* {!isSettingsVisible && (
        <Animated.View style={styles.zoomContainer}>
          {hasUltra && (
            <PressableOpacity
              style={[styles.zoomButton, isUltra && styles.zoomButtonActive]}
              onPress={() => onZoomPressed(1)}
            >
              <Text style={[styles.zoomText, isUltra && styles.zoomTextActive]}>{isUltra ? zoomValue.toFixed(1) + 'x' : '.5x'}</Text>
            </PressableOpacity>
          )}
          {hasWide && (
            <PressableOpacity
              style={[styles.zoomButton, isWide && styles.zoomButtonActive]}
              onPress={() => onZoomPressed(neutralZoom)}
            >
              <Text style={[styles.zoomText, isWide && styles.zoomTextActive]}>{isWide ? zoomValue.toFixed(1) + 'x' : '1x'}</Text>
            </PressableOpacity>)}

          <Reanimated.Text>{cameraAnimatedProps.zoom}</Reanimated.Text>
          {(hasTele &&
            <PressableOpacity
              style={[styles.zoomButton, isTele && styles.zoomButtonActive]}
              onPress={() => onZoomPressed(neutralZoom * 2)}
            >
              <Text style={[styles.zoomText, isTele && styles.zoomTextActive]}>{isTele ? zoomValue.toFixed(1) + 'x' : '2x'}</Text>
            </PressableOpacity>
          )}
        </Animated.View>
      )} */}
      {/* {isSettingsVisible && (
        <View style={styles.settingsContainer}>
          <ScrollView contentContainerStyle={styles.scrollableSetting} horizontal={true} showsHorizontalScrollIndicator={false}>
            {supportsHdr && (
              <PressableOpacity style={styles.functionButton} onPress={() => setEnableHdr((h) => !h)}>
                <MaterialIcon name={enableHdr ? 'hdr' : 'hdr-off'} color="white" size={24} />
              </PressableOpacity>
            )}
            {supports60Fps && (
              <PressableOpacity style={styles.functionButton} onPress={() => setTargetFps((t) => (t === 30 ? 60 : 30))}>
                <Text style={styles.functionText}>{`${targetFps} FPS`}</Text>
              </PressableOpacity>
            )}
            <PressableOpacity style={[styles.functionButton, isExposureSliderVisible && styles.functionButtonActive]} onPress={onExposurePressed} >
              <Text style={[styles.functionText, isExposureSliderVisible && styles.functionTextActive]}>Exposure</Text>
            </PressableOpacity>
            {supportsFlash && (
              <PressableOpacity style={styles.functionButton} onPress={onFlashPressed} >
                <IonIcon name={flash === 'on' ? 'flash' : 'flash-off'} color="white" size={12} />
                {flash === 'on' ? <Text style={styles.functionText}> Flash On</Text> : <Text style={styles.functionText}> Flash Off</Text>}
              </PressableOpacity>
            )}
          </ScrollView>
        </View>
      )} */}
      {/* {isExposureSliderVisible &&
        <View style={styles.sliderContainer}>
          <RulerSlider
            minVal={-3}
            maxVal={3}
            curVal={exposureValue}
            onValueChange={handleSliderChange}
          />
        </View>
      } */}
      {/* {captureMode == 'video' &&
          <View style={styles.timerContainer}>
            <Text style={styles.zoomTextActive}>{formattedTime}</Text>
          </View>
        } */}
      <View style={styles.captureButtonContainer}>

        <View style={styles.buttonsContainer}>
          {/* <PressableOpacity style={styles.settingsButton} onPress={onSettingVisible}>
            <MaterialIcon name={'tune'} color="white" size={30} />
          </PressableOpacity> */}

          {/* <CaptureButton
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
          /> */}
          {/* <PressableOpacity style={styles.deleteButton} >
            <Text>x</Text>
          </PressableOpacity> */}
          {/* <PressableOpacity
            style={styles.finishButton}
            onPress={() => setIsRecordingFinished(true)}
          >
            <Text style={styles.finishText}>Done</Text>
          </PressableOpacity> */}
        </View>
      </View>

      {/* <StatusBarBlurBackground /> */}

      {/* <View style={styles.rightButtonRow}>
        <PressableOpacity style={styles.button} onPress={onFlipCameraPressed} disabledOpacity={0.4}>
          <IonIcon name="camera-reverse" color="white" size={24} />
        </PressableOpacity>
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
      </View> */}
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    fontFamily: 'Inter',
    fontWeight: '700',
    color: 'white',
  },
  topBanner: {
    height: '15%',
    backgroundColor: '#352B4460',
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    alignSelf: 'center',
    top: 0,
    zIndex: 1,
    // display:'flex',
  },
  timerContainer: {
    width: 62,
    height: 30,
    position: 'absolute',
    bottom: '27%',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6A6A',
    borderRadius: 15,
    zIndex: 2,
  },
  zoomContainer: {
    position: 'absolute',
    flex: 1,
    flexDirection: 'row',
    height: '7%',
    bottom: '20%',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 5,
  },
  zoomButton: {
    width: 40,
    height: 24,
    borderRadius: 12,
    flexDirection: 'row',
    // paddingX: 4,
    // paddingY: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#352B4460',
    gap: 10,
  },
  zoomButtonActive: {
    width: 46,
    height: 32,
    borderRadius: 23,
    // paddingY: 6,
    // paddingX: 3,
    backgroundColor: '#352B44',
  },
  zoomText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
  },
  zoomTextActive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF'
  },
  settingsContainer: {
    position: 'absolute',
    width: '100%',
    height: '7%',
    backgroundColor: '#352B4460',
    bottom: '20%',
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    padding: '2%',
  },
  sliderContainer: {
    position: 'absolute',
    bottom: '27%',
    left: 0,
    right: 0,
    backgroundColor: '#352B4460',
  },
  captureButtonContainer: {
    position: 'absolute',
    height: '20%',
    width: '100%',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
    bottom: 0,
  },
  mediaTabContainer: {
    position: 'absolute',
    top: 50,
    flexDirection: 'row',
    width: 100,
    height: 44,
    backgroundColor: '#9C99A3',
    borderRadius: 50,
  },
  mediaTab: {
    position: 'absolute',
    width: 50,
    height: 44,
    padding: 10,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5C24C9',
  },
  mediaIcon: {
    width: 50,
    height: 44,
    padding: 10,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
    color: '#FFF',
  },
  activeMode: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  buttonsContainer: {
    // width: (SCREEN_WIDTH + CAPTURE_BUTTON_SIZE) / 2,
    width: '100%',
    height: '80%',
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    // justifyContent: 'center',
    bottom: '10%',
    right: 0,
    flex: 1,
    zIndex: 1,
  },

  scrollableSetting: {
    // flexDirection: 'row', 
  },
  functionButton: {
    width: width * 0.28,
    // borderWidth: 1,
    // borderRadius: 40,
    flexDirection: 'row',
    marginHorizontal: width * 0.02,
    // paddingX: width*0.02,
    alignItems: 'center',
    justifyContent: 'center',
    // gap: '3%',
    backgroundColor: '#352B4400',
  },
  functionButtonActive: {
    borderRadius: 40,
    backgroundColor: '#FAFAFA',
  },
  functionText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
  },
  functionTextActive: {
    color: 'rgba(92, 36, 201, 1)',
  },
  settingsButton: {
    left: SCREEN_WIDTH * 0.2 - CONTROL_BUTTON_SIZE / 2,
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    // backgroundColor: 'rgba(140, 140, 140, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: CONTROL_BUTTON_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  settingsIcon: {
    // borderWidth: 1.5,
  },
  captureButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: SCREEN_WIDTH * 0.5 - CAPTURE_BUTTON_SIZE / 2,
    // alignContent:'center',
    // bottom: SAFE_AREA_PADDING.paddingBottom,
    // zIndex: 99,
  },
  deleteButton: {
    left: SCREEN_WIDTH * 0.65 - CONTROL_BUTTON_SIZE / 2 - FINISH_BUTTON_SIZE / 2, // TODO subtract delete button size
  },
  finishButton: {
    backgroundColor: '#5C24C9',
    width: 90,
    height: 44,
    // paddingX: 24,
    // paddigY: 10,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    left: SCREEN_WIDTH * 0.8 - CONTROL_BUTTON_SIZE / 2 - FINISH_BUTTON_SIZE / 2, // TODO subtract finish button size
  },
  finishText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
