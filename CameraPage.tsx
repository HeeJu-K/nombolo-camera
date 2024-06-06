import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { Routes } from './Routes'

import * as React from 'react'

import { StyleSheet, Text, View } from 'react-native'

type Props = NativeStackScreenProps<Routes, 'CameraPage'>

export function CameraPage({ navigation }: Props): React.ReactElement {

    return (
        <View style={[styles.container]}>
            <Text>Camera Page</Text>
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
})