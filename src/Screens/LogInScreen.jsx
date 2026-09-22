import {
  StyleSheet,
  Text,
  View,
  PixelRatio,
  TouchableOpacity,
  Image,
  ToastAndroid,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native'
import AlertModal from "../Components/AlertModal"
import { useState, useEffect, useContext, useCallback, useRef } from "react"
import { COLORS, colors } from "../Resources/colors"
import InputComponent from "../Components/InputComponent"
import { Strings } from "../Resources/Strings"
import ButtonComponent from "../Components/ButtonComponent"
// Duplicate import removed
import mainNavigationRoutes from "../Routes/NavigationRoutes"
import { AppStore } from "../Context/AppContext"
import SmoothPinCodeInput from "react-native-smooth-pincode-input"
import HeaderLogo from "../Resources/Images/headerlogo.png"
import DeviceInfo from "react-native-device-info"
import axios from "axios"
import { address } from "../Routes/addresses"
import CancelButtonComponent from "../Components/CancelButtonComponent"
import LinearGradient from "react-native-linear-gradient"
import Feather from "react-native-vector-icons/Feather"
import { useFocusEffect } from "@react-navigation/native"
import { getDBConnection, getAllAgents } from "../Database/db-service"
import { getAgentCodeLocally, clearAgentCodeLocally } from "../Utils/cryptoHelper"

const LogInScreen = ({ navigation, route }) => {
  const [alertInfo, setAlertInfo] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => { },
    onCancel: () => { },
  });
  const {
    isLogin,
    login,
    userId,
    setUserId,
    agentName,
    getUserId,
    deviceId,
    setDeviceId,
    passcode,
    setPasscode,
    next,
    setNext,
    isOffline,
  } = useContext(AppStore)

  const [latestAppVersion, setLatestAppVersion] = useState("")
  const [appDownloadLink, setAppDownloadLink] = useState("")
  const [updateStatus, setUpdateStatus] = useState("")
  const [isDisable, setDisable] = useState(false)
  const [isRegisteredDevice, setIsRegisteredDevice] = useState(false)
  const [checkingLocalAgent, setCheckingLocalAgent] = useState(true)

  const [dots, setDots] = useState(".")
  // Animation refs
   const welcomeAnim = useRef(new Animated.Value(0)).current;
   const welcomeTranslateAnim = useRef(new Animated.Value(-20)).current;
   const statusAnim = useRef(new Animated.Value(0)).current;
   const fadeAnim = useRef(new Animated.Value(1)).current;
   const agentIdAnim = useRef(new Animated.Value(-20)).current; // start 20px above
   const loginCardAnim = useRef(new Animated.Value(20)).current; // start 20px down for card

  useFocusEffect(
    useCallback(() => {
      const checkLocalAgentData = async () => {
        setCheckingLocalAgent(true);
        try {
          const registeredParam = route?.params?.registeredAgentCode;
          if (registeredParam) {
            setUserId(registeredParam);
            setIsRegisteredDevice(true);
            setCheckingLocalAgent(false);
            return;
          }

          const db = await getDBConnection();
          const agents = await getAllAgents(db);
          if (agents && agents.length > 0 && agents[0].agent_code) {
            setUserId(agents[0].agent_code);
            setIsRegisteredDevice(true);
          } else {
            const savedCode = await getAgentCodeLocally();
            if (savedCode) {
              setUserId(savedCode);
              setIsRegisteredDevice(true);
            } else if (!isOffline) {
              // Server Check: If local DB is empty but server already has device assignment
              await getUserId();
            }
          }
        } catch (e) {
          console.error("Error checking md_agent table:", e);
        } finally {
          setCheckingLocalAgent(false);
        }
      };
      checkLocalAgentData();
    }, [route?.params?.registeredAgentCode, isOffline])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev === "..." ? "." : prev + "."))
    }, 500);
    // Animate welcome and status on mount
    Animated.timing(welcomeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    Animated.timing(welcomeTranslateAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
    // Animate login card slide up
    Animated.timing(loginCardAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
    // Animate status badge on mount
    Animated.timing(statusAnim, {
      toValue: 1,
      duration: 600,
      delay: 200,
      useNativeDriver: true,
    }).start();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (userId) {
      Animated.timing(agentIdAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [userId]);

  const animateTransition = toState => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setNext(toState);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handlePressOnFirstScreen = () => {
    if (userId) {
      animateTransition(true)
    } else {
      setNext(false)
      ToastAndroid.showWithGravityAndOffset(
        "Please register device to continue.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      )
    }
  }

  let version = DeviceInfo.getVersion()

  const [latestMajor, latestMinor, latestPatch] = latestAppVersion
    .split(".")
    .map(s => parseInt(s, 10))
  const [currentMajor, currentMinor, currentPatch] = version
    .split(".")
    .map(s => parseInt(s, 10))

  const getVersionFromWeb = async () => {
    await axios
      .post(
        address.GET_VERSION_DETAILS,
        { app_version: version },
        {
          headers: {
            Accept: "application/json",
          },
        },
      )
      .then(res => {
        setLatestAppVersion(res.data.data.app_version)
        setAppDownloadLink(res.data.data.app_download_link)
        setUpdateStatus(res.data.update_status)

        if (res.data.update_status == "Y") {
          showAlertUpdate(res.data.data.app_download_link)
        }
      })
  }

  useEffect(() => {
    if (!userId) {
      getUserId()
    }
    if (!isOffline) {
      getVersionFromWeb()
    }
  }, [isOffline])

  function showAlertUpdate(link) {
    setAlertInfo({
      visible: true,
      title: "Found Update!",
      message: "Please update your app.",
      onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })),
      onConfirm: () => Linking.openURL(link),
    })
  }

  return (
    <LinearGradient colors={["#0B4F37", "#063122"]} style={styles.root}>
      <View style={styles.hero}>
        <Image source={HeaderLogo} style={styles.image} resizeMode="contain" />
        <View style={styles.heroTextWrap}>
          <Animated.Text style={[styles.grettingText, { opacity: welcomeAnim, transform: [{ translateY: welcomeTranslateAnim }] }]}>{"Welcome to Data Bank"}</Animated.Text>
          <Animated.View style={[styles.statusRow, { opacity: statusAnim }]}>
            <Animated.View
              style={[
                styles.statusBadge,
                { backgroundColor: isOffline ? "#FF5252" : "#009966" },
              ]}
            >
              <Text style={styles.statusText}>
                {isOffline ? "Offline" : "Online"}
              </Text>
            </Animated.View>
          </Animated.View>
          <Text style={styles.manual}>Login with your 4-digit PIN</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <Animated.View style={[styles.loginContainer, { opacity: fadeAnim, transform: [{ translateY: loginCardAnim }] }]}>
          <View style={styles.cardHeaderLine} />

          {!next && (
            <View>
              {checkingLocalAgent ? (
                <View style={styles.fetchingContainer}>
                  <ActivityIndicator size="small" color="#009966" style={{ marginBottom: 6 }} />
                  <Text style={styles.fetchingText}>Checking Device Registration{dots}</Text>
                </View>
              ) : userId ? (
                <>
                  <Animated.View style={[styles.agentIdContainer, { transform: [{ translateY: agentIdAnim }] }]}>
                    <Text style={styles.agentIdLabel}>Agent ID</Text>
                    <Text style={styles.agentIdValue}>{userId}</Text>
                  </Animated.View>

                  <View style={styles.singleButtonContainer}>
                    <ButtonComponent
                      disabled={updateStatus === "Y" || !userId}
                      title={"Next"}
                      handleOnpress={() => handlePressOnFirstScreen()}
                      customStyle={[
                        styles.nextButton,
                        {
                          backgroundColor:
                            updateStatus === "Y" || !userId ? "#9E9E9E" : "#009966",
                        },
                      ]}
                    />

                    <TouchableOpacity
                      onPress={async () => {
                        await clearAgentCodeLocally();
                        setUserId("");
                        setIsRegisteredDevice(false);
                        setNext(false);
                        setPasscode("");
                        if (route?.params?.registeredAgentCode) {
                          navigation.setParams({ registeredAgentCode: null });
                        }
                        navigation.navigate(mainNavigationRoutes.register);
                      }}
                      style={{ marginTop: 14, alignItems: "center" }}>
                      <Text style={{ color: "#009966", fontWeight: "700", fontSize: 14 }}>
                        Register New Device Key
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.notRegisteredContainer}>
                    <Feather name="shield-off" size={36} color="#009966" style={{ marginBottom: 8 }} />
                    <Text style={styles.notRegisteredTitle}>Device Not Registered</Text>
                    <Text style={styles.notRegisteredSub}>
                      No bound agent account found on this device. Please register to continue.
                    </Text>
                  </View>

                  <View style={styles.singleButtonContainer}>
                    <ButtonComponent
                      title={"Register Now"}
                      handleOnpress={() => navigation.navigate(mainNavigationRoutes.register)}
                      customStyle={[
                        styles.nextButton,
                        {
                          backgroundColor: "#009966",
                        },
                      ]}
                    />
                  </View>
                </>
              )}
            </View>
          )}

          {next && (
            <View>
              <View style={styles.pinWrap}>
                <SmoothPinCodeInput
                  autoFocus={true}
                  placeholder="*"
                  mask={<View style={styles.pinMask} />}
                  maskDelay={1000}
                  password={true}
                  cellStyle={styles.pinCell}
                  cellStyleFocused={styles.pinCellFocused}
                  value={passcode}
                  onTextChange={code => setPasscode(code)}
                />
              </View>

              {/* <TouchableOpacity
                onPress={() =>
                  navigation.navigate(mainNavigationRoutes.forgotPasscode)
                }
              >
                <Text style={styles.resetText}>Forgot Pin?</Text>
              </TouchableOpacity> */}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={() => {
                    animateTransition(false);
                    setDisable(false);
                  }}
                  style={styles.chevronButton}>
                  <Feather name="chevron-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={isDisable || passcode.length !== 4 || isOffline}
                  onPress={async () => {
                    setDisable(true);
                    await login();
                    setDisable(false);
                  }}
                  style={[
                    styles.chevronButton,
                    {
                      backgroundColor:
                        isDisable || passcode.length !== 4 || isOffline
                          ? "#9E9E9E"
                          : "#009966",
                    },
                  ]}>
                  {!isDisable ? (
                    <Feather name="chevron-right" size={24} color="#FFFFFF" />
                  ) : (
                    <ActivityIndicator color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
      <AlertModal
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={alertInfo.onConfirm}
        onCancel={alertInfo.onCancel}
      />
    </LinearGradient>
  )
}

export default LogInScreen

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  image: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  heroTextWrap: {
    alignItems: "center",
  },
  grettingText: {
    fontSize: 22,
    color: "#FFFFFF",
    letterSpacing: 0.4,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  manual: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)", // Premium soft white text
    letterSpacing: 0.5,
    fontWeight: "500",
    textAlign: "center",
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: "flex-end", // Align container to the bottom
  },
  loginContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32, // More rounded at the top
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeaderLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 3,
    backgroundColor: "#0B1F2A",
    paddingVertical: 10,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 18,
  },
  singleButtonContainer: {
    width: "100%",
    marginTop: 18,
  },
  nextButton: {
    width: "100%",
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 12,
  },
  chevronButton: {
    flex: 1,
    marginTop: 10,
    backgroundColor: "#009966",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pinWrap: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FAF6", // Soft green background tint
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0, 153, 102, 0.15)",
  },
  pinMask: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#009966",
  },
  pinCell: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderRadius: 14,
    borderColor: "#009966",
    backgroundColor: "#FFFFFF",
  },
  pinCellFocused: {
    borderColor: "#004D40",
    backgroundColor: "#E0F2F1",
  },
  resetText: {
    textAlign: "right",
    color: "#009966",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginTop: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  fetchingContainer: {
    backgroundColor: "#F0FAF6",
    borderColor: "rgba(0, 153, 102, 0.15)",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  fetchingText: {
    color: "#009966",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  deviceIdContainer: {
    backgroundColor: "#F0FAF6",
    borderColor: "rgba(0, 153, 102, 0.15)",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  deviceIdLabel: {
    color: "#009966",
    fontSize: 14,
    fontWeight: "500",
  },
  deviceIdValue: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
  agentIdContainer: {
    backgroundColor: "#F0FAF6",
    borderColor: "rgba(0, 153, 102, 0.15)",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  agentIdLabel: {
    color: "#009966",
    fontSize: 14,
    fontWeight: "500",
  },
  agentIdValue: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
  notRegisteredContainer: {
    backgroundColor: "#F0FAF6",
    borderColor: "rgba(0, 153, 102, 0.2)",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  notRegisteredTitle: {
    color: "#009966",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 4,
  },
  notRegisteredSub: {
    color: "#555555",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 10,
  },
})
