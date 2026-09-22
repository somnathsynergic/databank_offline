import {
  PixelRatio,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native"
import { icon } from "../../Resources/Icons"
import { COLORS, colors } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import mainNavigationRoutes from "../../Routes/NavigationRoutes"
import { StackActions, useFocusEffect } from "@react-navigation/native"
import { useCallback, useState } from "react"

const SettingScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("profile")
  const popAction = StackActions.popToTop()

  useFocusEffect(
    useCallback(() => {
      navigation.dispatch(popAction)
    }, []),
  )

  const MenuItem = ({ label, iconName, onPress }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconLabel}>
        <View style={styles.iconCircle}>
          {icon[iconName]("#009966", 22)}
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <View style={styles.chevronWrap}>
        {icon.right("#94A3B8", 18)}
      </View>
    </TouchableOpacity>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <View style={styles.menuList}>
            <MenuItem
              label="Profile"
              iconName="man"
              onPress={() => navigation.navigate(mainNavigationRoutes.profileScreen)}
            />
            <MenuItem
              label="Change Pin"
              iconName="password"
              onPress={() => navigation.navigate(mainNavigationRoutes.changePinScreen)}
            />
            <MenuItem
              label="About"
              iconName="info"
              onPress={() => navigation.navigate(mainNavigationRoutes.aboutScreen)}
            />
          </View>
        )
      case "reports":
        return (
          <View style={styles.menuList}>
            <MenuItem
              label="Reports Menu"
              iconName="profile"
              onPress={() => navigation.navigate(mainNavigationRoutes.reportChooseScreen)}
            />
            <MenuItem
              label="Duplicate Receipt"
              iconName="duplicate"
              onPress={() => navigation.navigate(mainNavigationRoutes.duplicateReceipt)}
            />
          </View>
        )
      case "printer":
        return (
          <View style={styles.menuList}>
            <MenuItem
              label="Printer Connect"
              iconName="printer"
              onPress={() => navigation.navigate(mainNavigationRoutes.printerConnectScreen)}
            />
          </View>
        )
      default:
        return null
    }
  }

  return (
    <>
      <CustomHeader />
      <View style={styles.root}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "profile" && styles.activeTab]}
            onPress={() => setActiveTab("profile")}
          >
            <Text style={[styles.tabText, activeTab === "profile" && styles.activeTabText]}>
              Profile & Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "reports" && styles.activeTab]}
            onPress={() => setActiveTab("reports")}
          >
            <Text style={[styles.tabText, activeTab === "reports" && styles.activeTabText]}>
              Reports
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "printer" && styles.activeTab]}
            onPress={() => setActiveTab("printer")}
          >
            <Text style={[styles.tabText, activeTab === "printer" && styles.activeTabText]}>
              Printer
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {renderContent()}
        </ScrollView>
      </View>
    </>
  )
}

export default SettingScreen

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(217,184,92,0.02)",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#009966",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94A3B8",
  },
  activeTabText: {
    color: "#009966",
  },
  menuList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,153,102,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.08)",
  },
  menuIconLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,153,102,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B1F2A",
  },
  chevronWrap: {
    opacity: 0.6,
  },
});