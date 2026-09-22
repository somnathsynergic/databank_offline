import { StyleSheet, Text, View, PixelRatio, TouchableOpacity, Image, ToastAndroid, Linking, ActivityIndicator } from "react-native";
import AlertModal from "../Components/AlertModal";
import { useState, useEffect, useContext, useCallback } from "react"
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

const LogInScreen = ({ navigation }) => {
  const [alertInfo, setAlertInfo] = useState({ visible: false, title: "", message: "", onConfirm: () => { }, onCancel: () => { } });
  const {
    isLogin,
    login,
    userId,
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
  // useEffect(() => {
  //   console.log(passcode)
  // }, [passcode])

  const handlePressOnFirstScreen = () => {
    if (userId) {
      setNext(true)
    } else {
      setNext(false)
      ToastAndroid.showWithGravityAndOffset(
        "We encountered some error on server.",
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
        // console.log(
        //   "fsdadgtreyhgtdhyrfujfyudx",
        //   res.data.data.app_download_link,
        // )
        // console.log("fsdadgtreyhgtdhysdfsdfsdrfujfyudx", res.data)
        setUpdateStatus(res.data.update_status)

        if (res.data.update_status == "Y") {
          showAlertUpdate(res.data.data.app_download_link)
        }
      })
  }

  useEffect(() => {
    getUserId()
    if (!isOffline) {
      getVersionFromWeb()
    }
  }, [isOffline])

  // console.log("skahlrcnsfytkuwhnf ", version)
  // console.log("skahlrcnsfytkuwhnf ", latestAppVersion)
  // console.log("skahlrcnsfytkuwhnf ", updateStatus)

  function showAlertUpdate(link) {
    setAlertInfo({
      visible: true,
      title: "Found Update!",
      message: "Please update your app.",
      onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })),
      onConfirm: () => Linking.openURL(link),
    })
  }

  // 1 3 0 ========= 1 1 0

  return (
    <View style={styles.root}>
      {/* <CustomHeader /> */}

      <View style={styles.hero}>
        <Image source={HeaderLogo} style={styles.image} resizeMode="contain" />
        <View style={styles.heroTextWrap}>
          <View style={styles.statusRow}>
            <Text style={styles.grettingText}>Welcome to Data Bank</Text>
            <View style={[styles.statusBadge, { backgroundColor: isOffline ? "#FF5252" : "#4CAF50" }]}>
              <Text style={styles.statusText}>{isOffline ? "Offline" : "Online"}</Text>
            </View>
          </View>
          <Text style={styles.manual}>Login with your pin</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.loginContainer}>
          {/* <Text style={styles.title}>LOGIN</Text> */}

          {!next && (
            <View>
              {!userId && (
                <InputComponent
                  value={deviceId ? deviceId : "Fetching ID..."}
                  placeholder={Strings.loginPlaceHolder}
                  label={"Device ID"}
                  readOnly={true}
                />
              )}

              <InputComponent
                value={userId ? userId : "Fetching ID..."}
                placeholder={`${userId}`}
                label={"Agent ID"}
                readOnly={true}
              />

              <View style={styles.buttonContainer}>
                <ButtonComponent
                  disabled={updateStatus === "Y" || !userId}
                  title={"Next"}
                  handleOnpress={() => handlePressOnFirstScreen()}
                  customStyle={styles.nextButton}
                />
              </View>
            </View>
          )}

          {next && (
            <View>
              <View style={styles.pinWrap}>
                <SmoothPinCodeInput
                  autoFocus={true}
                  placeholder="*"
                  mask={
                    <View style={styles.pinMask} />
                  }
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
                <CancelButtonComponent
                  title={"Back"}
                  handleOnpress={() => {
                    setNext(!next);
                    setDisable(false);
                  }}
                  customStyle={styles.backButton}
                />

                <ButtonComponent
                  disabled={isDisable || passcode.length !== 4 || isOffline}
                  title={
                    !isDisable ? (
                      "Submit"
                    ) : (
                      <ActivityIndicator color={COLORS.lightScheme.primary} />
                    )
                  }
                  handleOnpress={async () => {
                    setDisable(true);
                    await login();
                    setDisable(false);
                  }}
                  customStyle={styles.submitButton}
                />
              </View>
            </View>
          )}
        </View>
      </View>
      <AlertModal
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={alertInfo.onConfirm}
        onCancel={alertInfo.onCancel}
      />
    </View>
  )
}

export default LogInScreen

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // backgroundColor: COLORS.lightScheme.background,
    backgroundColor: "#dde0e2ff",
  },
  hero: {
    backgroundColor: "#0B1F2A",
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  image: {
    width: 92,
    height: 92,
  },
  heroTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  grettingText: {
    fontSize: 18,
    color: "#FFFFFF",
    letterSpacing: 0.4,
    fontWeight: "800",
  },
  manual: {
    marginTop: 6,
    fontSize: 14,
    color: "#009966",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,

  },
  loginContainer: {
    // flex: 1,
    height: 'auto',
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
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
    marginTop: 16,
  },
  nextButton: {
    flex: 1,
    marginTop: 10,
    borderRadius: 14,
  },
  backButton: {
    flex: 1,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,129,129,0.15)",
    borderRadius: 14,
  },
  submitButton: {
    flex: 1,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#0B1F2A",

  },
  pinWrap: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FBFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
  },
  pinMask: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.lightScheme.primary,
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
    borderColor: COLORS.lightScheme.primary,
    backgroundColor: "#EEF9F9",
  },
  resetText: {
    textAlign: "right",
    color: COLORS.lightScheme.primary,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginTop: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
});
