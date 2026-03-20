import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MisSolicitudesScreen from '../screens/MisSolicitudesScreen';
import SolicitudDetailScreen from '../screens/SolicitudDetailScreen';
import DebugApiScreen from '../screens/DebugApiScreen';
import ServiciosScreen from '../screens/ServiciosScreen';
import NuevaSolicitudScreen from '../screens/NuevaSolicitudScreen';
import PerfilScreen from '../screens/PerfilScreen';
import ChatScreen from '../screens/ChatScreen';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <MainStack.Screen name="Home" component={HomeScreen} options={{ title: 'FixArg' }} />
      <MainStack.Screen
        name="MisSolicitudes"
        component={MisSolicitudesScreen}
        options={{ title: 'Mis solicitudes' }}
      />
      <MainStack.Screen
        name="SolicitudDetail"
        component={SolicitudDetailScreen}
        options={{ title: 'Detalle' }}
      />
      <MainStack.Screen name="Servicios" component={ServiciosScreen} options={{ title: 'Servicios' }} />
      <MainStack.Screen
        name="NuevaSolicitud"
        component={NuevaSolicitudScreen}
        options={{ title: 'Nueva solicitud' }}
      />
      <MainStack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Mi perfil' }} />
      <MainStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <MainStack.Screen name="DebugApi" component={DebugApiScreen} options={{ title: 'API health' }} />
    </MainStack.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
});
