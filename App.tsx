/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import type { Routes } from './Routes'

import React from 'react';
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Camera } from 'react-native-vision-camera'

import { PermissionsPage } from './PermissionsPage'
import { MediaPage } from './MediaPage'
import { CameraPage } from './CameraPage'

import { StyleSheet, Text, useColorScheme, View, } from 'react-native';


const Stack = createNativeStackNavigator<Routes>()

export function App(): React.ReactElement | null {
  const isDarkMode = useColorScheme() === 'dark';

  // const backgroundStyle = {
  //   backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  // };

  const cameraPermission = Camera.getCameraPermissionStatus()
  const microphonePermission = Camera.getMicrophonePermissionStatus()

  const showPermissionsPage = cameraPermission !== 'granted' || microphonePermission === 'not-determined'

  return (
    <NavigationContainer>
      <GestureHandlerRootView style={styles.root}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            statusBarStyle: 'dark',
            animationTypeForReplace: 'push',
          }}
          initialRouteName={showPermissionsPage ? 'PermissionsPage' : 'CameraPage'}>
          <Stack.Screen name="PermissionsPage" component={PermissionsPage} />
          <Stack.Screen name="CameraPage" component={CameraPage} />
          {/* <Stack.Screen
            name="MediaPage"
            component={MediaPage}
            options={{
              animation: 'none',
              presentation: 'transparentModal',
            }}
          /> */}
        </Stack.Navigator>
      </GestureHandlerRootView>
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})