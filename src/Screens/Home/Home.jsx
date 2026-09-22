import {
  StyleSheet,
  Text,
  View,
  PixelRatio,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native"
import { StackActions, useFocusEffect } from "@react-navigation/native"
import { useState, useEffect, useContext, useCallback, useRef } from "react"
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import { icon } from "../../Resources/Icons"
// Removed react-native-table-component
import { COLORS, colors } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import { AppStore } from "../../Context/AppContext"
import { Button } from "react-native"
import mainNavigationRoutes from "../../Routes/NavigationRoutes"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import FindAccountScreen from "../FindAccountScreen/FindAccountScreen"
import FindLoanAccountScreen from "../FindAccountScreen/FindLoanAccountScreen"
import FindRDAccount from "../FindAccountScreen/FindRDAccount"
import {
  getDBConnection,
  getLatestCollectionDate,
} from "../../Database/db-service"
// import { useIsFocused } from '@react-navigation/native';
const Home = ({ navigation }) => {
  const context = useContext(AppStore) || {};
  const {
    isLogin = false,
    userId = '',
    agentName = '',
    bankName = '',
    branchName = '',
    totalCollection = 0,
    getTotalDepositAmount = () => { },
    login = () => { },
    isLoan = false,
    isRD = false,
    isDaily = false,
    isOffline = false,
    needsLocalReset = false,
    clearNeedsLocalReset = () => { },
    maximumAmount = 0,
    allowCollectionDays = 0,
    lastSyncedDate = '',
    // add lastWorkDate from context
    lastWorkDate = '',
  } = context;


  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [remainingDays, setRemainingDays] = useState(0);
  const [refreshing, setRefreshing] = useState(false)
  const [localTotalCollection, setLocalTotalCollection] = useState(0)
  // Compute remaining allowed days based on lastWorkDate
  useEffect(() => {
    if (lastWorkDate) {
      const now = new Date()
      const target = new Date(lastWorkDate)
      const diffDays = Math.floor((target - now) / (1000 * 60 * 60 * 24))
      setRemainingDays(diffDays > 0 ? diffDays : 0)
    } else {
      setRemainingDays(0)
    }
  }, [lastWorkDate]);
  const [latestCollectionDate, setLatestCollectionDate] = useState("");

  const displayTotal = localTotalCollection;
  const remainingCollection = (maximumAmount || 0) - (displayTotal || 0);

  const { width } = Dimensions.get("window");
  const cardWidth = width - 92; // Optimized for 32px padding, 12px gap, 20px peek
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = event => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (cardWidth + 12));
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const dailyScale = useRef(new Animated.Value(1)).current;
  const loanScale = useRef(new Animated.Value(1)).current;
  const rdScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = scaleVar => {
    Animated.spring(scaleVar, {
      toValue: 0.92,
      useNativeDriver: true,
      tension: 150,
      friction: 5,
    }).start();
  };

  const handlePressOut = scaleVar => {
    Animated.spring(scaleVar, {
      toValue: 1.0,
      useNativeDriver: true,
      tension: 150,
      friction: 5,
    }).start();
  };
  // console.log('three options: '+isLoan,isDaily,isRD)
  // Reset localTotalCollection to 0 when a needsLocalReset is flagged (new agent_trans_no detected)
  useEffect(() => {
    if (needsLocalReset) {
      setLocalTotalCollection(0);
      clearNeedsLocalReset();
    }
  }, [needsLocalReset]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchTotalCollection = async () => {
    var sum = 0
    try {
      const db = await getDBConnection();
      const [colResults] = await db.executeSql('SELECT * FROM td_collection;');
      for (let i = 0; i < colResults.rows.length; i++) {
        sum += colResults.rows.item(i).amount;
      }
      const [dtlsResults] = await db.executeSql(
        'SELECT * FROM td_collection_dtls;',
      );
      for (let i = 0; i < dtlsResults.rows.length; i++) {
        sum += dtlsResults.rows.item(i).amount;
      }
      setLocalTotalCollection(sum);

      const latestDate = await getLatestCollectionDate(db);
      setLatestCollectionDate(latestDate);
    } catch (err) {
      console.error('Failed to fetch total collection locally:', err);
    }
  };

  // Removed old tableData definitions

  useEffect(() => {
    if (isLogin) {
      fetchTotalCollection();
    }
  }, [isLogin]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTotalCollection();
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, [fetchTotalCollection]);

  useFocusEffect(
    useCallback(() => {
      // Refresh data on focus, but defer loading sync counts until after login.
      setRefreshing(true);
      getTotalDepositAmount();
      fetchTotalCollection();

      setTimeout(() => {
        setRefreshing(false);
        fetchTotalCollection();

        if (!isLogin) {
          login();
        }
      }, 2000);

      return () => {
        // alert('Screen was unfocused')
        // // Useful for cleanup functions
      }
    }, [isLogin]),
  )

  async function printAgentInfo() {
    try {
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printText(bankName, { align: "center" })
      await BluetoothEscposPrinter.printText("\r\n", {})
      await BluetoothEscposPrinter.printText(branchName, { align: "center" })
      await BluetoothEscposPrinter.printText("\r\n", {})

      await BluetoothEscposPrinter.printText("AGENT INFORMATION", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\r", {})
      await BluetoothEscposPrinter.printText(
        "-------------------------------",
        {},
      )
      await BluetoothEscposPrinter.printText("\r\n", {})

      await BluetoothEscposPrinter.printColumn(
        [30],
        [BluetoothEscposPrinter.ALIGN.LEFT],
        ["Agent Name: " + agentName],
        {},
      )

      await BluetoothEscposPrinter.printColumn(
        [30],
        [BluetoothEscposPrinter.ALIGN.LEFT],
        ["Agent Code: " + userId],
        {},
      )

      await BluetoothEscposPrinter.printColumn(
        [30],
        [BluetoothEscposPrinter.ALIGN.LEFT],
        ["Date: " + currentDateTime.toLocaleDateString("en-GB")],
        {},
      )

      await BluetoothEscposPrinter.printText("\r\n", {})

      await BluetoothEscposPrinter.printColumn(
        [40],
        [BluetoothEscposPrinter.ALIGN.LEFT],
        [
          "Total Collection: " +
          (isOffline ? localTotalCollection : totalCollection) +
          "/-",
        ],
        {},
      )

      await BluetoothEscposPrinter.printText("\r", {})

      await BluetoothEscposPrinter.printBarCode(
        "My String Decode",
        BluetoothEscposPrinter.BARCODETYPE.JAN13,
        3,
        120,
        0,
        2,
        153,
      )
      await BluetoothEscposPrinter.printText("\r", {})

      // await BluetoothEscposPrinter.printQRCode("My String Decode", 280, BluetoothEscposPrinter.ERROR_CORRECTION.L)

      // await BluetoothEscposPrinter.printText("\r\n", {})
      await BluetoothEscposPrinter.printText(
        "---------------X---------------",
        {},
      )

      await BluetoothEscposPrinter.printText("\r\n\r\n\r\n", {})
      // await BluetoothEscposPrinter.printQRCode("Something", 25, 3)
    } catch (e) {
      // console.log(e.message || "ERROR")
      alert("Printer is not connected. Connect it from Settings.")
    }
  }
  const Stack = createNativeStackNavigator()

  return (
    <>
      {/* <Stack.Navigator screenOptions={{ headerShown: false }}>
     <Stack.Screen
          name={mainNavigationRoutes.home}
          component={}
        />
        <Stack.Screen
          name={mainNavigationRoutes.findAccount}
          component={FindAccountScreen}
        />
        <Stack.Screen
          name={mainNavigationRoutes.findLoanAccount}
          component={FindLoanAccountScreen}
        />
        <Stack.Screen
          name={mainNavigationRoutes.findRDAccount}
          component={FindRDAccount}
        />
      </Stack.Navigator> */}
      <View style={styles.root}>
        <CustomHeader />

        {/* <View style={styles.hero}> */}
        {/* <View style={styles.heroTopRow}> */}
        <View>
          {/* <Text style={styles.welcome}>Welcome to</Text> */}
          {/* <Text style={styles.brand}>Data Bank</Text> */}
          <Text style={styles.greeting}>Hello, {agentName}</Text>
        </View>

        {/* <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Synced</Text>
            </View> */}
        {/* </View> */}
        {/* </View> */}

        <View style={styles.contentCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                colors={[COLORS.lightScheme.primary]}
                onRefresh={onRefresh}
              />
            }>
            {/* <Text style={styles.sectionTitle}>Agent Information</Text> */}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingLeft: 15, paddingRight: 42 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={{ marginBottom: 10 }}>
              {/* Primary Card */}
              <View
                style={[
                  styles.debitCard,
                  { width: cardWidth, marginBottom: 0, marginRight: 12 },
                ]}>
                <View style={styles.dcTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dcBankName}>{bankName}</Text>
                    <Text style={styles.dcDate}>
                      {currentDateTime.toLocaleDateString("en-GB")} •{' '}
                      {currentDateTime.toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.dcStatusBadge,
                      {
                        backgroundColor: !isOffline
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                      },
                    ]}>
                    <View
                      style={[
                        styles.dcStatusDot,
                        { backgroundColor: !isOffline ? '#4ADE80' : '#F87171' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.dcStatusText,
                        { color: !isOffline ? '#4ADE80' : '#F87171' },
                      ]}>
                      {!isOffline ? "ONLINE" : "OFFLINE"}
                    </Text>
                  </View>
                </View>

                <View style={styles.dcMiddleRow}>
                  <Text style={styles.dcLabel}>TOTAL COLLECTION</Text>
                  <Text style={styles.dcAmount}>
                    ₹ {localTotalCollection?.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.dcBottomRow}>
                  <View style={styles.dcFlexWrap}>
                    <Text style={styles.dcLabel}>AGENT CODE</Text>
                    <Text style={styles.dcValue}>{userId}</Text>
                  </View>
                  <View style={[styles.dcFlexWrap, { alignItems: "flex-end" }]}>
                    <Text style={styles.dcLabel}>BRANCH</Text>
                    <Text style={styles.dcValue}>{branchName}</Text>
                  </View>
                </View>
              </View>

              {/* Secondary Card */}
              <View
                style={[
                  styles.debitCard,
                  {
                    width: cardWidth,
                    backgroundColor: '#009966',
                    marginBottom: 0,
                    marginRight: 8,
                  },
                ]}>
                <View style={styles.dcTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dcBankName, { color: '#0B1F2A' }]}>
                      Sync & Collection Info
                    </Text>
                    <Text
                      style={[
                        styles.dcDate,
                        { color: 'rgba(238, 241, 243, 0.7)' },
                      ]}>
                      Swipe for details
                    </Text>
                  </View>
                </View>

                <View style={styles.dcMiddleRow}>
                  <Text
                    style={[
                      styles.dcLabel,
                      { color: 'rgba(238, 241, 243, 0.7)' },
                    ]}>
                    REMAINING COLLECTION AMOUNT
                  </Text>
                  <Text style={[styles.dcAmount, { color: "#0B1F2A", fontSize: 24 }]}>
                    ₹ {remainingCollection?.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.dcBottomRowGrid}>
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text
                        style={[
                          styles.dcLabel,
                          { color: 'rgba(238, 241, 243, 0.7)' },
                        ]}>
                        LAST SYNC DATE & TIME
                      </Text>
                      <Text
                        style={[
                          styles.dcValue,
                          { color: '#0B1F2A', fontSize: 18 },
                        ]}
                      >
                        {lastSyncedDate && !isNaN(new Date(lastSyncedDate).getTime())
                          ? `${new Date(lastSyncedDate).toLocaleDateString('en-GB')} • ${new Date(lastSyncedDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                          : 'Not synced yet'}
                      </Text>
                    </View>
                    <View style={[styles.gridCol, { alignItems: "flex-end" }]}>
                      <Text
                        style={[
                          styles.dcLabel,
                          { color: 'rgba(238, 241, 243, 0.7)' },
                        ]}>
                        REMAINING DAYS
                      </Text>
                      <Text style={[styles.dcValue, { color: "#0B1F2A", fontSize: 18 }]}
                      >
                        {remainingDays} Days
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.gridRow, { marginTop: 12 }]}>
                    <View style={styles.gridCol}>
                      <Text
                        style={[
                          styles.dcLabel,
                          { color: 'rgba(238, 241, 243, 0.7)' },
                        ]}>
                        LAST DATE OF COLLECTION
                      </Text>
                      <Text style={[styles.dcValue, { color: "#0B1F2A", fontSize: 18 }]}>
                        {latestCollectionDate &&
                          !isNaN(new Date(latestCollectionDate).getTime())
                          ? new Date(latestCollectionDate).toLocaleDateString(
                            'en-GB',
                          )
                          : "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              <View
                style={[
                  styles.paginationDot,
                  activeIndex === 0
                    ? styles.paginationDotActive
                    : styles.paginationDotInactive,
                ]}
              />
              <View
                style={[
                  styles.paginationDot,
                  activeIndex === 1
                    ? styles.paginationDotActive
                    : styles.paginationDotInactive,
                ]}
              />
            </View>

            <View style={styles.options}>
              <Animated.View
                style={{ flex: 1, transform: [{ scale: dailyScale }] }}>
                <TouchableOpacity
                  disabled={!isDaily}
                  style={[
                    styles.actionCard,
                    !isDaily && styles.actionCardDisabled,
                  ]}
                  onPressIn={() => handlePressIn(dailyScale)}
                  onPressOut={() => handlePressOut(dailyScale)}
                  onPress={() => navigation.navigate("Daily_Navigation")}
                  activeOpacity={0.9}>
                  <View
                    style={[
                      styles.iconWrap,
                      isDaily ? styles.iconActive : styles.iconMuted,
                    ]}>
                    {icon.daily(isDaily ? "#009966" : "#9AA0A6", 22)}
                  </View>
                  <Text
                    style={[
                      styles.actionLabel,
                      !isDaily && styles.actionLabelDisabled,
                    ]}>
                    Daily
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={{ flex: 1, transform: [{ scale: loanScale }] }}>
                <TouchableOpacity
                  disabled={!isLoan}
                  onPressIn={() => handlePressIn(loanScale)}
                  onPressOut={() => handlePressOut(loanScale)}
                  onPress={() => navigation.navigate("Loan_Navigation")}
                  style={[
                    styles.actionCard,
                    !isLoan && styles.actionCardDisabled,
                  ]}
                  activeOpacity={0.9}>
                  <View
                    style={[
                      styles.iconWrap,
                      isLoan ? styles.iconActive : styles.iconMuted,
                    ]}>
                    {icon.giver(isLoan ? "#009966" : "#9AA0A6", 22)}
                  </View>
                  <Text
                    style={[
                      styles.actionLabel,
                      !isLoan && styles.actionLabelDisabled,
                    ]}>
                    Loan
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={{ flex: 1, transform: [{ scale: rdScale }] }}>
                <TouchableOpacity
                  disabled={!isRD}
                  onPressIn={() => handlePressIn(rdScale)}
                  onPressOut={() => handlePressOut(rdScale)}
                  onPress={() => navigation.navigate("RD_Navigation")}
                  style={[
                    styles.actionCard,
                    !isRD && styles.actionCardDisabled,
                  ]}
                  activeOpacity={0.9}>
                  <View
                    style={[
                      styles.iconWrap,
                      isRD ? styles.iconActive : styles.iconMuted,
                    ]}>
                    {icon.loop(isRD ? "#009966" : "#9AA0A6", 22)}
                  </View>
                  <Text
                    style={[
                      styles.actionLabel,
                      !isRD && styles.actionLabelDisabled,
                    ]}>
                    RD
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </View>
      </View>
    </>
  )
}

export default Home

// const styles = StyleSheet.create({
//   head: { height: 40, backgroundColor: "#f1f8ff" },
//   text: {
//     margin: 6,
//     color: COLORS.lightScheme.onPrimaryContainer,
//     fontWeight: "400",
//     fontSize: 18,
//   },
//   card: {
//     border: COLORS.lightScheme.primary,
//     borderWidth: 1,
//   },
//   bnk: {
//     margin: 6,
//     color: COLORS.lightScheme.primary,
//     fontWeight: "900",
//     fontSize: 18,
//   },
//   logoContainer: {
//     flex: 2,
//     backgroundColor: COLORS.lightScheme.primary,
//     borderBottomLeftRadius: 50,
//     borderBottomRightRadius: 50,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//   },
//   grettingText: {
//     fontSize: 20,
//     color: COLORS.lightScheme.onPrimary,
//     letterSpacing: 1,
//     fontWeight: "900",
//     alignSelf: "center",
//   },
//   manual: {
//     fontSize: 16,
//     color: COLORS.lightScheme.onPrimary,
//     letterSpacing: 1,
//     fontWeight: "900",
//     alignSelf: "center",
//   },
//   todayCollection: {
//     backgroundColor: COLORS.lightScheme.primary,
//     color: COLORS.lightScheme.onPrimary,
//     fontWeight: "600",
//     textAlign: "center",
//     fontSize: PixelRatio.roundToNearestPixel(22),
//     padding: PixelRatio.roundToNearestPixel(5),
//     marginBottom: 10,
//     borderBottomLeftRadius: 10,
//     borderBottomRightRadius: 10,
//   },
//   printAgent: {
//     margin: 5,
//     paddingTop: 3,
//   },
//   cardContainer: {
//     backgroundColor: COLORS.lightScheme.onPrimary,
//     alignItems: "center",
//     width: "25%",
//     height: 70, //
//     padding: 6,
//     paddingTop: 20,
//     margin: 5,
//     paddingBottom: 5,
//     marginTop: 10,
//     paddingHorizontal: 10,
//     borderRadius: 10,
//     justifyContent: "center",
//     borderColor: COLORS.lightScheme.primary,
//     borderWidth: 3,
//     elevation: 30,
//   },
//   label: {
//     color: COLORS.lightScheme.primary,
//     padding: 10,
//     textAlign: "center",
//     fontSize: PixelRatio.roundToNearestPixel(13),
//     fontWeight: "bold",
//   },
//   options: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   title: {
//     textAlign: "center",
//     fontSize: 20,
//     fontWeight: "900",
//     color: COLORS.lightScheme.tertiaryContainer,
//     // alignSelf: 'center',
//     letterSpacing: 4,
//     backgroundColor: COLORS.lightScheme.primary,
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//     borderTopLeftRadius: 100,
//     borderBottomRightRadius: 100,
//   },
//   disabledContainer: {
//     color: "gray",
//   },
// })

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(217,184,92,0.02)",
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    borderRadius: 24,
    // backgroundColor: "#0B1F2A",
    backgroundColor: '#009966',
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  welcome: {
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  brand: {
    marginTop: 4,
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  greeting: {
    marginTop: 6,
    marginHorizontal: 35,
    letterSpacing: 1.2,

    fontSize: 15,
    // color: "#009966",
    color: "#898f92ff",
    fontWeight: "700",
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(36, 35, 33, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.3)",
  },
  heroBadgeText: {
    fontSize: 11,
    // color: "#009966",
    color: "white",
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  contentCard: {
    flex: 1,
    marginTop: 14,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 24,
    // backgroundColor: "#FFFFFF",
    padding: 2,
    // shadowColor: "#000",
    // shadowOpacity: 0.06,
    // shadowRadius: 14,
    // shadowOffset: { width: 0, height: 5 },
    // elevation: 4,
  },
  // sectionTitle: {
  //   fontSize: 16,
  //   fontWeight: "800",
  //   color: "#0B1F2A",
  //   marginBottom: 12,
  //   letterSpacing: 0.2,
  // },
  // table: {
  //   backgroundColor: "#FFFFFF",
  //   borderRadius: 16,
  //   overflow: "hidden",
  //   marginBottom: 18,
  // },
  // tableHeadText: {
  //   margin: 0,
  //   paddingVertical: 12,
  //   paddingHorizontal: 10,
  //   color: "#0B1F2A",
  //   fontWeight: "800",
  //   fontSize: 15,
  //   backgroundColor: "#EAF7F7",
  // },
  // tableText: {
  //   margin: 0,
  //   paddingVertical: 12,
  //   paddingHorizontal: 10,
  //   color: "#334155",
  //   fontWeight: "500",
  //   fontSize: 14,
  //   backgroundColor: "#FFFFFF",
  // },
  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    padding: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#00996659",
    marginBottom: 10,
    // backgroundColor: "#0099661A",
    // backgroundColor: "#636d6a1a",
    backgroundColor: "#0099661c",
    // elevation: 4
  },
  actionCard: {
    flex: 1,
    minHeight: 84,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 153, 102, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  actionCardDisabled: {
    opacity: 0.55,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconActive: {
    backgroundColor: "rgba(0, 153, 102, 0.08)",
    borderWidth: 1.5,
    borderColor: '#009966',
  },
  iconMuted: {
    backgroundColor: "rgba(148, 163, 184, 0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0B1F2A",
  },
  actionLabelDisabled: {
    color: "#94A3B8",
  },
  statusCard: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  onlineCard: {
    backgroundColor: "#ECFDF5",
    borderColor: "#BBF7D0",
  },
  offlineCard: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  statusSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B1F2A",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  debitCard: {
    backgroundColor: "#0B1F2A",
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    shadowColor: "#8b8b8bff",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    // shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.5)",
  },
  dcTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  dcBankName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.2,
    fontStyle: "italic",
    flex: 1,
  },
  dcDate: {
    // color: "#009966",
    color: '#009966',
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  dcStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  dcStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dcStatusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dcMiddleRow: {
    marginBottom: 24,
  },
  dcLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  dcAmount: {
    // color: "#009966",
    color: '#009966',
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  dcBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dcFlexWrap: {
    flex: 1,
  },
  dcValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    backgroundColor: "#009966",
    width: 20,
  },
  paginationDotInactive: {
    backgroundColor: "rgba(0, 153, 102, 0.25)",
    width: 8,
  },
  dcBottomRowGrid: {
    flexDirection: "column",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  gridCol: {
    flex: 1,
  },
});
