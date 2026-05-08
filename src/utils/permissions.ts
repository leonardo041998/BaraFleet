import { PermissionsAndroid, Platform } from 'react-native';

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const grantedForeground = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Izin Lokasi BaraFleet',
          message: 'BaraFleet membutuhkan akses lokasi untuk melacak ritase kendaraan.',
          buttonNeutral: 'Nanti',
          buttonNegative: 'Batal',
          buttonPositive: 'OK',
        }
      );

      if (grantedForeground === PermissionsAndroid.RESULTS.GRANTED) {
        if (Platform.Version >= 29) {
          const grantedBackground = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Izin Lokasi Latar Belakang',
              message: 'BaraFleet perlu melacak lokasi Anda bahkan saat aplikasi ditutup (background) untuk memastikan data ritase tidak hilang.',
              buttonNeutral: 'Nanti',
              buttonNegative: 'Batal',
              buttonPositive: 'Pengaturan',
            }
          );
          
          return grantedBackground === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true; 
};