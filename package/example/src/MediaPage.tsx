import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { Image, StyleSheet, Text, View, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native'
import Video, { LoadError, OnLoadData } from 'react-native-video'
import { SAFE_AREA_PADDING } from './Constants'
import { useIsForeground } from './hooks/useIsForeground'
import { PressableOpacity } from 'react-native-pressable-opacity'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { Alert } from 'react-native'
import { CameraRoll } from '@react-native-camera-roll/camera-roll'
import { StatusBarBlurBackground } from './views/StatusBarBlurBackground'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { Routes } from './Routes'
import { useIsFocused } from '@react-navigation/core'
import FastImage, { OnLoadEvent } from 'react-native-fast-image'

import { RNFFmpeg, RNFFmpegConfig } from "react-native-ffmpeg";
import { getCurrentFrameWithDecimalZeroes, getFrameGaps } from "./utils";
import VideoFramesSrcubber from "./components/index";
import { getVideoDuration } from 'react-native-video-duration';


import RNFS from 'react-native-fs';

const requestSavePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true

  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
  if (permission == null) return false
  let hasPermission = await PermissionsAndroid.check(permission)
  if (!hasPermission) {
    const permissionRequestResult = await PermissionsAndroid.request(permission)
    hasPermission = permissionRequestResult === 'granted'
  }
  return hasPermission
}

const isVideoOnLoadEvent = (event: OnLoadData | OnLoadEvent): event is OnLoadData => 'duration' in event && 'naturalSize' in event

type Props = NativeStackScreenProps<Routes, 'MediaPage'>
export function MediaPage({ navigation, route }: Props): React.ReactElement {
  const { path, type } = route.params
  const [hasMediaLoaded, setHasMediaLoaded] = useState(false)
  const isForeground = useIsForeground()
  const isScreenFocused = useIsFocused()
  const isVideoPaused = !isForeground || !isScreenFocused
  const [savingState, setSavingState] = useState<'none' | 'saving' | 'saved'>('none')

  const [inputVideoPath, setInputVideoPath] = useState("");
  const [framesPath, setFramesPath] = useState("");
  const [totalFrames, setTotalFrames] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(1);

  // const imageFilePrefix = "video-frame-img-";
  const imageFilePrefix = "frame_";
  const imageFileExtension = "jpg";
  const totalDecimalZeroes = 7;

  const backgroundFramesMultiplier = Math.ceil(totalFrames / 7) + 1;
  const backgroundPreviewFrames = totalFrames
    ? getFrameGaps(backgroundFramesMultiplier, backgroundFramesMultiplier * 7)
    : [];

  // useEffect(() => {
  //   const proceed = async () => {

  //     setInputVideoPath(path);
  //   };
  //   proceed();
  // }, []);
  useEffect(() => {

    const extractFrames = async (inputVideoPath: String) => {
      const inputVideoPathArr = inputVideoPath?.split("/");
      inputVideoPathArr?.pop();
      const outputFramesPath = inputVideoPathArr?.join("/");
      const command = `-i ${inputVideoPath} -vf fps=10 ${outputFramesPath}/frame_%07d.jpg`;

      try {
        const result = await RNFFmpeg.execute(command);
        if (result === 0) {
          console.log('Frames extracted successfully');
          try {
            const files = await RNFS.readdir(outputFramesPath);
            console.log("HERE SEE FILES: ", files, files.length)
            setTotalFrames(Math.floor(files.length / 10))
          } catch (error) {
            console.error('Error reading directory:', error);
          }
        } else {
          console.log('Error in extracting frames');
        }
      } catch (error) {
        console.error('Error:', error);
      }
      // getVideoDuration(inputVideoPath).then((duration: any)  => {
      //   setTotalFrames(Math.floor(duration / 10))
      // });
      // setTotalFrames(getVideoDuration(inputVideoPath)/10)
      // const result = await getVideoDuration(inputVideoPath) as number;
      console.log("HERE SEE before getting RNFS", outputFramesPath)
      setInputVideoPath(path);
      setFramesPath(outputFramesPath);
      // setTotalFrames
      // setTotalFrames(files.filter(file => file.endsWith('.jpg')).length);
      setCurrentFrame(1);
      // console.log("JERE SEE result", result)
      // setTotalFrames(Math.floor(result / 10))
    };

    // if (inputVideoPath) {
    //   console.log("Here in input video path", inputVideoPath, "path", path)
    //   const inputVideoPathArr = inputVideoPath?.split("/");
    //   inputVideoPathArr?.pop();
    //   const outputFramesPath = inputVideoPathArr?.join("/");

    //   if (!framesPath) {
    //     RNFFmpeg?.executeAsync(
    //       `-y -i ${path} -r 30 ${outputFramesPath}/${imageFilePrefix}%0${totalDecimalZeroes}d.${imageFileExtension}`,
    //       (execution) => {
    //         console.log("HERE IN execution", execution)
    //         if (execution.returnCode === 0) {
    //           console.log("SUCCESS", execution.executionId);
    //           RNFFmpegConfig.getLastCommandOutput().then((output) => {
    //             setFramesPath(outputFramesPath ?? "");
    //             setTotalFrames((output.match(/frame=/gi)?.length ?? 0) - 1);
    //             setCurrentFrame(1);
    //           });
    //         } else {
    //           console.log("ERROR:", execution.returnCode);
    //         }
    //       }
    //     );
    //   }
    //   console.log("here in see frames path", framesPath)
    // }
    extractFrames(path);
  }, []);

  const onMediaLoad = useCallback((event: OnLoadData | OnLoadEvent) => {
    if (isVideoOnLoadEvent(event)) {
      console.log(
        `Video loaded. Size: ${event.naturalSize.width}x${event.naturalSize.height} (${event.naturalSize.orientation}, ${event.duration} seconds)`,
      )
    } else {
      console.log(`Image loaded. Size: ${event.nativeEvent.width}x${event.nativeEvent.height}`)
    }
  }, [])
  const onMediaLoadEnd = useCallback(() => {
    console.log('media has loaded.')
    setHasMediaLoaded(true)
  }, [])
  const onMediaLoadError = useCallback((error: LoadError) => {
    console.log(`failed to load media: ${JSON.stringify(error)}`)
  }, [])

  const onSavePressed = useCallback(async () => {
    try {
      setSavingState('saving')

      const hasPermission = await requestSavePermission()
      if (!hasPermission) {
        Alert.alert('Permission denied!', 'Vision Camera does not have permission to save the media to your camera roll.')
        return
      }
      await CameraRoll.save(`file://${path}`, {
        type: type,
      })
      setSavingState('saved')
    } catch (e) {
      const message = e instanceof Error ? e.message : JSON.stringify(e)
      setSavingState('none')
      Alert.alert('Failed to save!', `An unexpected error occured while trying to save your ${type}. ${message}`)
    }
  }, [path, type])

  // const source = useMemo(() => ({ uri: `file://${path}` }), [path])
  const source = { uri: `file://${path}` }
  // console.log("HERE SEE IMG PATH", path, source.uri)
  const videoimg = { uri: `file://${framesPath}/frame_0000010.jpg` }
  //   console.log("HERE SEE DECIMALS", `${framesPath}/${imageFilePrefix}${getCurrentFrameWithDecimalZeroes(
  //     currentFrame,
  //     totalDecimalZeroes
  // )}.${imageFileExtension}`)

  const screenStyle = useMemo(() => ({ opacity: hasMediaLoaded ? 1 : 0 }), [hasMediaLoaded])

  return (
    <View style={[styles.container, screenStyle]}>
      {type === 'photo' && (
        <FastImage source={source} style={StyleSheet.absoluteFill} resizeMode="cover" onLoadEnd={onMediaLoadEnd} onLoad={onMediaLoad} />
      )}
      {type === 'video' && (
        <>
          {/* <FastImage source={videoimg} style={StyleSheet.absoluteFill} resizeMode="cover" onLoadEnd={onMediaLoadEnd} onLoad={onMediaLoad} /> */}
          {inputVideoPath && framesPath ? (
            <>
              <View>
                <FastImage source={{
                  uri: `${framesPath}/${imageFilePrefix}${getCurrentFrameWithDecimalZeroes(
                    currentFrame,
                    totalDecimalZeroes
                  )}.${imageFileExtension}`,
                }}
                  style={StyleSheet.absoluteFill} resizeMode="cover" onLoadEnd={onMediaLoadEnd} onLoad={onMediaLoad}
                />
                <Image
                  source={{
                    uri: `${framesPath}/${imageFilePrefix}${getCurrentFrameWithDecimalZeroes(
                      currentFrame,
                      totalDecimalZeroes
                    )}.${imageFileExtension}`,
                  }}
                  style={{ height: 400, width: 250, backgroundColor: "#000" }}
                />
              </View>

              <VideoFramesSrcubber
                currentFrame={currentFrame}
                onFrameChanged={(updatedFrame: number) =>
                  setCurrentFrame(updatedFrame)
                }
                backgroundPreviewFrames={backgroundPreviewFrames}
                framesPath={framesPath}
                totalDecimalZeroes={totalDecimalZeroes}
                imageFileExtension={imageFileExtension}
                imageFilePrefix={imageFilePrefix}
              />
            </>
          ) : (
            <>
              <ActivityIndicator color={"blue"} size={"large"} />
              <Text style={{ marginTop: 10 }}>Processing Video ...</Text>
              <Text style={{ marginTop: 10 }}>
                Generating Scrubber to select your cover frame ...
              </Text>
            </>)}
        </>
      )}



      <PressableOpacity style={styles.closeButton} onPress={navigation.goBack}>
        <IonIcon name="close" size={35} color="white" style={styles.icon} />
      </PressableOpacity>

      <PressableOpacity style={styles.saveButton} onPress={onSavePressed} disabled={savingState !== 'none'}>
        {savingState === 'none' && <IonIcon name="download" size={35} color="white" style={styles.icon} />}
        {savingState === 'saved' && <IonIcon name="checkmark" size={35} color="white" style={styles.icon} />}
        {savingState === 'saving' && <ActivityIndicator color="white" />}
      </PressableOpacity>

      <StatusBarBlurBackground />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: SAFE_AREA_PADDING.paddingTop,
    left: SAFE_AREA_PADDING.paddingLeft,
    width: 40,
    height: 40,
  },
  saveButton: {
    position: 'absolute',
    bottom: SAFE_AREA_PADDING.paddingBottom,
    left: SAFE_AREA_PADDING.paddingLeft,
    width: 40,
    height: 40,
  },
  icon: {
    textShadowColor: 'black',
    textShadowOffset: {
      height: 0,
      width: 0,
    },
    textShadowRadius: 1,
  },
})