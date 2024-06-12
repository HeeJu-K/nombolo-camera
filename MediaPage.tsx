import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { Routes } from './Routes'

import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { PressableOpacity } from 'react-native-pressable-opacity'

import IonIcon from 'react-native-vector-icons/Ionicons'
import { SAFE_AREA_PADDING } from './Constants'

type Props = NativeStackScreenProps<Routes, 'MediaPage'>

export function MediaPage({ navigation, route }: Props): React.ReactElement {
    const { path, type } = route.params
    console.log("using", path, type)

    return (
        <View style={[styles.container]}>
            <PressableOpacity style={styles.closeButton} onPress={navigation.goBack}>
                <IonIcon name="close" size={35} color="white" style={styles.icon} />
            </PressableOpacity>
            <Text>Media Page</Text>
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