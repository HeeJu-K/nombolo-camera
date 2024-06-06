import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { Routes } from './Routes'

import * as React from 'react'

import { StyleSheet, Text, View } from 'react-native'

type Props = NativeStackScreenProps<Routes, 'PermissionsPage'>


export function PermissionsPage({ navigation }: Props): React.ReactElement {

    return (
        <View style={[styles.container]}>
            <Text>Permission Page</Text>
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