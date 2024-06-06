import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { Routes } from './Routes'

import * as React from 'react'

import { StyleSheet, Text, View } from 'react-native'

type Props = NativeStackScreenProps<Routes, 'MediaPage'>


export function MediaPage({ navigation, route }: Props): React.ReactElement {
    const { path, type, duration } = route.params

    return (
        <View style={[styles.container]}>
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
})