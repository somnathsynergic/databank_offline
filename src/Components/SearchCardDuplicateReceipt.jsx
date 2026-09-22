import { StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native"
import React, { useRef } from "react"
import { COLORS } from "../Resources/colors"
import mainNavigationRoutes from "../Routes/NavigationRoutes"
import { icon } from "../Resources/Icons"

const SearchCardDuplicateReceipt = ({ item, index, navigation }) => {
  const scaleValue = useRef(new Animated.Value(1)).current
  const flag = item?.product_code[0] || "D"
  console.log(item)
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1.0,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start()
  }

  // Determine styles and icons based on account type flag
  const typeDetails = {
    D: { label: "Daily", icon: icon.daily, color: "#10B981", bg: "rgba(16, 185, 129, 0.08)" },
    R: { label: "RD", icon: icon.loop, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.08)" },
    L: { label: "Loan", icon: icon.giver, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.08)" }
  }[flag] || { label: "Account", icon: icon.profile, color: "#94A3B8", bg: "rgba(148, 163, 184, 0.08)" }

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() =>
          navigation.navigate(mainNavigationRoutes.duplicateReceiptInner, {
            item: item,
          })
        }
        style={styles.card}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: typeDetails.bg }]}>
            {typeDetails.icon(typeDetails.color, 20)}
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {item?.customer_name || item?.accountName || "Account Name"}
            </Text>
            <View style={styles.row}>
              <Text style={styles.accountLabel}>A/C:</Text>
              <Text style={styles.accountValue}>
                {item?.account_number || item?.accountNumber || "-"}
              </Text>
            </View>
            {item?.product_code && (
              <View style={styles.row}>
                <Text style={styles.productLabel}>Product:</Text>
                <Text style={styles.productValue}>{item?.product_code}</Text>
              </View>
            )}
          </View>

          <View style={styles.rightContainer}>
            <View style={[styles.badge, { backgroundColor: typeDetails.bg, borderColor: typeDetails.color + "33" }]}>
              <Text style={[styles.badgeText, { color: typeDetails.color }]}>{typeDetails.label}</Text>
            </View>
            <View style={styles.chevronCircle}>
              {icon.right("#94A3B8", 14)}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default SearchCardDuplicateReceipt

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0B1F2A",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  accountLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginRight: 4,
  },
  accountValue: {
    fontSize: 13,
    color: "#1E293B",
    fontWeight: "700",
  },
  productLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    marginRight: 4,
  },
  productValue: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "700",
  },
  rightContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  chevronCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
})
