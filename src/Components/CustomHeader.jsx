import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import React, { useContext, useState } from "react"
import { COLORS, colors } from "../Resources/colors"
import { icon } from "../Resources/Icons"
import { useNavigation } from "@react-navigation/native"
import mainNavigationRoutes from "../Routes/NavigationRoutes"
import { AppStore } from "../Context/AppContext"
import HeaderIcon from "../Resources/Images/logo_cut.png"
import AlertModal from "./AlertModal"

const CustomHeader = () => {
  const [isImageLoad, setIsImageLoad] = useState(true)
  const [alertInfo, setAlertInfo] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  })

  const { isLogin = false, setIsLogin = () => {}, logout = () => {}, isOffline = false } = useContext(AppStore) || {}

  const navigation = useNavigation()

  const handleLogOut = () => {
    setAlertInfo({
      visible: true,
      title: "Logging out",
      message: "Are you sure you want to log out?",
      onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })),
      onConfirm: () => {
        setAlertInfo(prev => ({ ...prev, visible: false }))
        logout()
        console.log(isLogin)
        navigation.navigate(mainNavigationRoutes.login)
      },
    })
  }
  return (
    // <View style={styles.container}>
    //   {/* <View style={{ height: 15, width: 15, borderRadius: 50,backgroundColor: "red"}}></View> */}
    //   {isImageLoad && (
    //     <Image
    //       source={HeaderIcon}
    //       style={styles.image}
    //       resizeMode="contain"
    //       onError={err => setIsImageLoad(false)}
    //     />
    //   )}
    //   {!isImageLoad && (
    //     <Text style={{ color: COLORS.lightScheme.onBackground }}>
    //       Data Bank
    //     </Text>
    //   )}
    //   <Pressable onPress={handleLogOut}>
    //     {icon.logout(COLORS.lightScheme.secondary)}
    //   </Pressable>
    // </View>
    <View style={styles.container}>
      <View style={styles.networkBadge}>
        <View style={[styles.networkDot, { backgroundColor: isOffline ? "#f44336" : "#4caf50" }]} />
        <Text style={styles.networkText}>{isOffline ? "Offline" : "Online"}</Text>
      </View>
      <View style={styles.center}>
        {isImageLoad ? (
          <Image
            source={HeaderIcon}
            style={styles.image}
            resizeMode="contain"
            onError={() => setIsImageLoad(false)}
          />
        ) : (
          <Text style={styles.title}>Data Bank</Text>
        )}
      </View>

      <Pressable onPress={handleLogOut} style={styles.logoutBtn}>
        {icon.logout(COLORS.lightScheme.secondary)}
      </Pressable>
      <AlertModal
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={alertInfo.onConfirm}
        onCancel={alertInfo.onCancel}
        confirmText="Yes"
        cancelText="No"
      />
    </View>
  )
}

export default CustomHeader

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: COLORS.lightScheme.surface,
//     height: 50,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingHorizontal: 10,
//     alignItems: "center",
//     // shadowColor: "#000",
//     // shadowOffset: { width: 5, height: 20 },
//     // shadowOpacity: 1.5,
//     // shadowRadius: 2,
//     // elevation: 21,
//   },
//   image: {
//     height: 80,
//     width: 80,
//     marginLeft: 30,
//   },
// })
const styles = StyleSheet.create({
  container: {
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: COLORS.lightScheme.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 110,
    height: 34,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.lightScheme.onBackground,
  },
  logoutBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  networkBadge: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  networkText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.lightScheme.onBackground,
  },
});