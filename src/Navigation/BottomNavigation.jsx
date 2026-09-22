import { StyleSheet, Image, View } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { NavigationContainer } from "@react-navigation/native"
import Home from "../Screens/Home/Home"
import mainNavigationRoutes from "../Routes/NavigationRoutes"
import HomeTwo from "../Screens/Home/HomeTwo"
import { icon } from "../Resources/Icons"
import { COLORS, colors } from "../Resources/colors"
import FindAccountScreen from "../Screens/FindAccountScreen/FindAccountScreen"
import NotificationScreen from "../Screens/Notification/NotificationScreen"
import AccountFindNavigation from "./AccountFindNavigation"
import SettingsNavigation from "./SettingsNavigation"
import EndWork from "../Screens/SettingsScreens/EndWork"
import EndWorkScreen from "../Screens/EndWorkScreen/EndWorkScreen"
import HomeNavigation from "./HomeNavigation"
import SyncScreen from "../Screens/SyncScreen/SyncScreen"
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "react-native-normalize"

const Tab = createBottomTabNavigator()

const BottomNavigation = () => {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.lightScheme.background }}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: COLORS.lightScheme.onPrimary,
            borderRadius: 50,
            marginBottom: 18,
            height: '7%',
            width: SCREEN_HEIGHT * .43,
            // marginHorizontal: '10%',
            marginHorizontal: SCREEN_WIDTH * .11,
            // optional elevation for Android shadow
            elevation: 8,
          },
          tabBarActiveTintColor: '#009966',
          tabBarInactiveTintColor: COLORS.lightScheme.onSurface,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
        }}>
        <Tab.Screen
          name={"Home_Navigator"}
          options={{
            tabBarIcon: ({ color, size }) => icon.HomeFill(color, 24),
            headerShown: false,
          }}
          component={HomeNavigation}
        />

        {/* <Tab.Screen
          name={"FindAccountScreen"}
          options={{
            tabBarIcon: ({ color, size }) => icon.Find(color, 24),
            headerShown: false,
          }}
          component={AccountFindNavigation}
        /> */}

        <Tab.Screen
          name={"EndWorkScreen"}
          options={{
            tabBarIcon: ({ color, size }) => icon.end(color, 24),
            headerShown: false,
          }}
          component={EndWorkScreen}
        />

        <Tab.Screen
          name="SettingScreens"
          component={SettingsNavigation}
          options={{
            tabBarIcon: ({ color, size }) => icon.settings(color, 24),
            headerShown: false,
          }}
        />
        {/* <Tab.Screen
          name="SyncScreens"
          component={SyncScreen}
          options={{
            tabBarIcon: ({ color, size }) => icon.loop(color, 24),
            headerShown: false,
          }}
        /> */}
      </Tab.Navigator>
    </View>
  )
}

export default BottomNavigation

const styles = StyleSheet.create({
  image: {
    borderRadius: 50,
  },
})
