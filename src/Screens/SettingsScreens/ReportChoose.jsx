import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native"
import { icon } from "../../Resources/Icons"
import { COLORS } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import mainNavigationRoutes from "../../Routes/NavigationRoutes"

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

export default function ReportChoose({ navigation }) {
  return (
    <View style={styles.root}>
      <CustomHeader />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroSmall}>Reports</Text>
          <Text style={styles.heroTitle}>Select Report Type</Text>
          <Text style={styles.heroSub}>Choose a report to continue</Text>
        </View>

        <View style={styles.menuList}>
          <MenuItem
            label="Day Scroll Report"
            iconName="calendar"
            onPress={() => navigation.navigate(mainNavigationRoutes.reportDayScreen)}
          />
          <MenuItem
            label="A/c Type Wise Report"
            iconName="layers"
            onPress={() => navigation.navigate(mainNavigationRoutes.reportTypeScreen)}
          />
          <MenuItem
            label="A/c No. Wise Report"
            iconName="creditCard"
            onPress={() => navigation.navigate(mainNavigationRoutes.reportNoScreen)}
          />
          <MenuItem
            label="Non Collection Report"
            iconName="alertCircle"
            onPress={() => navigation.navigate(mainNavigationRoutes.nonCollectionReport)}
          />
          <MenuItem
            label="Mini Statement"
            iconName="fileText"
            onPress={() => navigation.navigate(mainNavigationRoutes.miniStatement)}
          />
          <MenuItem
            label="Date Wise Coll Summary"
            iconName="trendingUp"
            onPress={() => navigation.navigate(mainNavigationRoutes.dateWiseCollSummary)}
          />
          <MenuItem
            label="Last Five Tnx"
            iconName="activity"
            onPress={() => navigation.navigate(mainNavigationRoutes.lastFiveTnxScreen)}
          />
          <MenuItem
            label="Day Total Report"
            iconName="pieChart"
            onPress={() => navigation.navigate(mainNavigationRoutes.dayTotalReportScreen)}
          />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(217,184,92,0.02)",
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  hero: {
    backgroundColor: "#0B1F2A",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginBottom: 14,
  },
  heroSmall: {
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroSub: {
    marginTop: 6,
    fontSize: 14,
    color: "#009966",
    fontWeight: "600",
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
    marginBottom: 20,
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
    fontSize: 15,
    fontWeight: "700",
    color: "#0B1F2A",
  },
  chevronWrap: {
    opacity: 0.6,
  },
})