import { StyleSheet, Text, ToastAndroid, View, ScrollView } from "react-native"
import { useContext, useState } from "react"
import MpinComponent from "../../Components/MpinComponent"
import ButtonComponent from "../../Components/ButtonComponent"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS, colors } from "../../Resources/colors"
import { AppStore } from "../../Context/AppContext"
import axios from "axios"
import { REACT_APP_BASE_URL } from "../../Config/config"
import { address } from "../../Routes/addresses"

const ChangePin = () => {
  const { userId, deviceId, bankId, branchCode, logout } = useContext(AppStore)

  const [passCode, changePasscode] = useState(() => "")
  const [newPassCode, setNewPassCode] = useState(() => "")
  const [confirmNewPasscode, setConfirmNewPasscode] = useState(() => "")

  const handleChangePassword = async () => {
    if (newPassCode !== confirmNewPasscode) {
      ToastAndroid.showWithGravityAndOffset(
        "Confirm Password must be same as New Passowrd.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      )
      changePasscode("")
      setNewPassCode("")
      setConfirmNewPasscode("")
    } else if (
      passCode == "" ||
      newPassCode == "" ||
      confirmNewPasscode == "" ||
      passCode.length !== 4 ||
      newPassCode.length !== 4 ||
      confirmNewPasscode.length !== 4
    ) {
      ToastAndroid.showWithGravityAndOffset(
        "Fill Pin Numbers properly.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      )
      changePasscode("")
      setNewPassCode("")
      setConfirmNewPasscode("")
    } else {
      const obj = {
        device_id: deviceId,
        user_id: userId,
        password: newPassCode,
        confirm_password: confirmNewPasscode,
        old_password: passCode,
        bank_id: bankId,
        branch_code: branchCode,
      }

      await axios
        .post(address.CHANGE_PIN, obj, {
          headers: {
            Accept: "application/json",
          },
        })
        .then(res => {
          if (res.data.status) {
            ToastAndroid.showWithGravityAndOffset(
              res.data.success,
              ToastAndroid.SHORT,
              ToastAndroid.CENTER,
              25,
              50,
            )
            changePasscode("")
            setNewPassCode("")
            setConfirmNewPasscode("")
            logout()
          } else {
            ToastAndroid.showWithGravityAndOffset(
              "Wrong Credentials...",
              ToastAndroid.SHORT,
              ToastAndroid.CENTER,
              25,
              50,
            )
            changePasscode("")
            setNewPassCode("")
            setConfirmNewPasscode("")
          }
        })
        .catch(err => {
          // console.log("CHANGE PINNN SCREENNNN", err)
          ToastAndroid.showWithGravityAndOffset(
            err.response.data,
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
            25,
            50,
          )
          changePasscode("")
          setNewPassCode("")
          setConfirmNewPasscode("")
        })
    }
  }

  return (
    // <>
    //   <View style={{ flex: 1 }}>
    //     <CustomHeader />
    //     <View
    //       style={{
    //         flex: 4,
    //         padding: 10,
    //         backgroundColor: COLORS.lightScheme.onPrimary,
    //         margin: 20,
    //         borderRadius: 10,
    //       }}>
    //       <View>
    //         <View style={styles.headerText}>
    //           <Text style={styles.title}>CHANGE YOUR M-PIN</Text>
    //         </View>
    //         <View style={styles.pinContainer}>
    //           <Text
    //             style={{
    //               color: COLORS.lightScheme.primary,
    //               fontWeight: "bold",
    //               fontSize: 18,
    //             }}>
    //             Old Pin
    //           </Text>
    //           <MpinComponent value={passCode} handleChange={changePasscode} />
    //         </View>
    //         <View style={styles.pinContainer}>
    //           <Text
    //             style={{
    //               color: COLORS.lightScheme.primary,
    //               fontWeight: "bold",
    //               fontSize: 18,
    //             }}>
    //             New Pin
    //           </Text>
    //           <MpinComponent
    //             value={newPassCode}
    //             handleChange={setNewPassCode}
    //           />
    //         </View>
    //         <View style={styles.pinContainer}>
    //           <Text
    //             style={{
    //               color: COLORS.lightScheme.primary,
    //               fontWeight: "bold",
    //               fontSize: 18,
    //             }}>
    //             Confirm Pin
    //           </Text>
    //           <MpinComponent
    //             value={confirmNewPasscode}
    //             handleChange={setConfirmNewPasscode}
    //           />
    //         </View>
    //         <ButtonComponent
    //           title={"CHANGE NOW"}
    //           customStyle={{
    //             margin: 10,
    //             marginTop: 20,
    //             marginLeft: 75,
    //             width: 200,
    //           }}
    //           handleOnpress={handleChangePassword}
    //         />
    //       </View>
    //     </View>
    //   </View>
    // </>

    <View style={styles.root}>
      <CustomHeader />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heroSmall}>Security Settings</Text>
          <Text style={styles.heroTitle}>Change Your M-PIN</Text>
          <Text style={styles.heroSub}>Enter old PIN and set a new secure PIN</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.pinSection}>
            <Text style={styles.label}>Old PIN</Text>
            <MpinComponent value={passCode} handleChange={changePasscode} />
          </View>

          <View style={styles.pinSection}>
            <Text style={styles.label}>New PIN</Text>
            <MpinComponent value={newPassCode} handleChange={setNewPassCode} />
          </View>

          <View style={styles.pinSection}>
            <Text style={styles.label}>Confirm PIN</Text>
            <MpinComponent
              value={confirmNewPasscode}
              handleChange={setConfirmNewPasscode}
            />
          </View>

          <ButtonComponent
            title={"CHANGE NOW"}
            customStyle={styles.button}
            handleOnpress={handleChangePassword}
          />
        </View>
      </ScrollView>
    </View>
  )
}

export default ChangePin

// const styles = StyleSheet.create({
//   headerText: {
//     backgroundColor: COLORS.lightScheme.primary,
//     borderBottomLeftRadius: 12,
//     borderBottomRightRadius: 12,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     marginBottom: 20,
//     color: "white",
//   },
//   pinContainer: {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   title: {
//     textAlign: "center",
//     color: COLORS.lightScheme.onPrimary,
//     fontSize: 20,
//     // fontWeight:'bold',
//     fontWeight: "900",
//     paddingHorizontal: 15,
//     paddingVertical: 5,
//   },
// })

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F9FF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F9FF",
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
    marginBottom: 12,
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
    letterSpacing: 0.3,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 14,
    color: "#009966",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 20,
  },
  pinSection: {
    marginBottom: 18,
    alignItems: "center",
  },
  label: {
    color: "#000",
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  button: {
    marginTop: 6,
    alignSelf: "center",
    width: "100%",
    borderRadius: 14,
  },
});
