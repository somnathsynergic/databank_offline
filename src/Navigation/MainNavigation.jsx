import { StyleSheet, View, ActivityIndicator } from "react-native"
import React, { useContext } from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { NavigationContainer } from "@react-navigation/native"
import mainNavigationRoutes from "../Routes/NavigationRoutes"
import LogInScreen from "../Screens/LogInScreen"
import RegisterScreen from "../Screens/RegisterScreen"
import ForgotPasscode from "../Screens/ForgotPasscode"
import BottomNavigation from "./BottomNavigation"
import { AppStore } from "../Context/AppContext"
import NotificationScreen from "../Screens/Notification/NotificationScreen"

const Stack = createNativeStackNavigator()

const MainNavigation = () => {
  const { isLogin, isSessionChecking } = useContext(AppStore)

  if (isSessionChecking) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0B4F37",
        }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLogin ? (
          <>
            <Stack.Screen
              name={mainNavigationRoutes.tab_home}
              component={BottomNavigation}
            />
            <Stack.Screen
              name={mainNavigationRoutes.notificationScreen}
              component={NotificationScreen}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name={mainNavigationRoutes.login}
              component={LogInScreen}
            />
            <Stack.Screen
              name={mainNavigationRoutes.register}
              component={RegisterScreen}
            />
            <Stack.Screen
              name={mainNavigationRoutes.forgotPasscode}
              component={ForgotPasscode}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default MainNavigation

const styles = StyleSheet.create({})
