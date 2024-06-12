import { PhotoFile, VideoFile } from 'react-native-vision-camera'

export type Routes = {
  PermissionsPage: undefined
  CameraPage: undefined
  CodeScannerPage: undefined
  MediaPage: {
    path: string
    type: 'video' | 'photo'
    // duration: number
  }
  Devices: undefined
}
