import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
  Alert,
  Pressable,
  ToastAndroid,
  TouchableOpacity,
  Image,
} from "react-native"
import { useContext, useState, useEffect, useMemo, useCallback } from "react"
import axios from "axios"
import { COLORS, colors } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import {
  Table,
  TableWrapper,
  Row,
  Rows,
  Col,
} from "react-native-table-component"
// import RadioGroup from "react-native-radio-buttons-group"
import InputComponent from "../../Components/InputComponent"
import ButtonComponent from "../../Components/ButtonComponent"
import mainNavigationRoutes from "../../Routes/NavigationRoutes"
import { AppStore } from "../../Context/AppContext"
import { StackActions, useFocusEffect } from "@react-navigation/native"
import CancelButtonComponent from "../../Components/CancelButtonComponent"
import { getDBConnection, getAccountByNumber, getLatestTransactionDateByAccount } from "../../Database/db-service"
import { address } from "../../Routes/addresses"
import moment from "moment"

const AccountDetails = ({ navigation, route }) => {
  const [collectionMoney, setCollectionMoney] = useState(() => 0)
  const {
    modifiedAt,
    transDt,
    todayDateFromServer,
    holidayLock,
    getFlagsRequest,
    collectionFlag,
    endFlag,
    allowCollectionDays,
    userId,
    bankId,
    branchCode,
  } = useContext(AppStore)

  const { item: initialItem } = route.params;
  const [account, setAccount] = useState(initialItem);
  const [lastTnxDate, setLastTnxDate] = useState(() => "");

  // const radioButtons = useMemo(
  //   () => [
  //     {
  //       id: "1", // acts as primary key, should be unique and non-empty string
  //       label: "Receive Cash",
  //       value: "C",
  //     },
  //     {
  //       id: "2",
  //       label: "Pay Online",
  //       value: "O",
  //     },
  //   ],
  //   [],
  // )

  // const [selectedId, setSelectedId] = useState(() => "1")

  // console.log("RRRRTTTTTTTTTTTTTTT", selectedId)

  const tableData = [
    [
      "Account Type",
      account?.product_code[0] == "D"
        ? "Daily"
        : account?.product_code[0] == "R"
          ? "RD"
          : account?.product_code[0] == "L"
            ? "Loan"
            : "",
    ],
    ["Account No.", account?.account_number],
    ["Name", account?.customer_name],
    ["Mobile No.", account?.mobile_no],
    // ["Opening date", moment.utc(account?.opening_date).format("DD/MM/YYYY HH:mm")],
    ["Opening date", new Date(account?.opening_date).toLocaleDateString("en-GB")],

    [
      "Previous Transaction Date",
      lastTnxDate
        ? new Date(lastTnxDate).toLocaleDateString("en-GB")
        : "No available date",
    ],
    ["Current Balance", account?.current_balance],
  ];

  const getLastTnxDate = async () => {
    const obj = {
      bank_id: bankId,
      branch_code: branchCode,
      agent_code: userId,
      account_number: account?.account_number,
      flag: "D",
    }

    // console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOO", obj)

    try {
      const db = await getDBConnection();
      const latest = await getLatestTransactionDateByAccount(db, account?.account_number);
      setLastTnxDate(latest);
    } catch (err) {
      console.error('Error fetching last transaction date:', err);
    }
  }

  useFocusEffect(
    useCallback(() => {
      // Refresh last transaction date and account data on screen focus
      const fetchData = async () => {
        getLastTnxDate();
        try {
          const db = await getDBConnection();
          const fresh = await getAccountByNumber(db, account?.account_number);
          if (fresh) setAccount(fresh);
        } catch (e) {
          console.error('Failed to refresh account data', e);
        }
      };
      fetchData();
    }, [])
  );

  useEffect(() => {
    getFlagsRequest()
  }, [])

  const handlePreviewData = () => {
    if (!collectionMoney || collectionMoney <= 0) {
      ToastAndroid.showWithGravityAndOffset(
        "Invalid Amount",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      )
      return
    }
    // setCollectionMoney(0)
    navigation.navigate(mainNavigationRoutes.accountPreview, {
      item: account,
      money: collectionMoney,
    })
  }

  const checkDayLock = () => {
    let currentDate = new Date(todayDateFromServer.toISOString().slice(0, 10))
    //console.log("CURRRRR DATEE", currentDate)
    let trans_dt = new Date(transDt.toISOString().slice(0, 10))
    //console.log("MODDDD DATEsssssss", trans_dt)
    let newTrans_dt = trans_dt.setDate(
      trans_dt.getDate() + parseInt(allowCollectionDays),
    )
    newTrans_dt = new Date(newTrans_dt).toISOString().slice(0, 10)
    // console.log('NNNNEEEWWWWW TRANCE DT', new Date(newTrans_dt).toISOString().slice(0, 10), trans_dt);

    var date_dif = Math.abs(new Date() - new Date(transDt))
    date_dif = date_dif / (1000 * 60 * 60 * 24)
    // console.log('Police case kore6ile', date_dif, 'llala', allowCollectionDays);

    // let afterAddingHolidayLockDays = modifiedAtDate.getDate() + 1
    // newModifiedDate.setDate(modifiedAtDate.getDate() + holidayLock)
    // console.log("HOLIIIIDDDAAAAYYYYY _+++++++>>>", holidayLock)

    // return newTrans_dt >= currentDate
    return date_dif < allowCollectionDays
  }

  const checkHolidayLock = () => {
    let currentDate = new Date(todayDateFromServer.toISOString().slice(0, 10))
    //("CURRRRR DATEE", currentDate)
    let modifiedAtDate = new Date(modifiedAt.toISOString().slice(0, 10))
    //console.log("MODDDD DATE", modifiedAtDate)
    let newModifiedDate = new Date()

    // let afterAddingHolidayLockDays = modifiedAtDate.getDate() + 1
    newModifiedDate.setDate(modifiedAtDate.getDate() + holidayLock)
    //console.log("HOLIIIIDDDAAAAYYYYY _+++++++>>>", holidayLock)

    return newModifiedDate >= currentDate
  }

  // console.log("CHECKKK HOLIDAAAY LOCKKK fun()", checkHolidayLock())

  const checkIsCollectionEnded = () => {
    console.log(collectionFlag, endFlag)
    if (collectionFlag == "Y" && endFlag == "N") return false
    else if (collectionFlag == "N" && endFlag == "Y") return true
  }

  //console.log("CHECKKK COLLL ENDEDDD ========>>>>>", checkIsCollectionEnded())

  return (
    // <View>
    //   <CustomHeader />
    //   <View
    //     style={{
    //       backgroundColor: COLORS.lightScheme.background,
    //       height: "100%",
    //       padding: 10,
    //     }}>
    //     <ScrollView keyboardShouldPersistTaps={"handled"}>
    //       <Text style={styles.info}>Daily Account Info</Text>
    //       {/* Table Component */}
    //       <View style={styles.tableConatiner}>
    //         <Table
    //           borderStyle={{
    //             borderWidth: 5,
    //             borderColor: COLORS.lightScheme.primary,
    //             fontSize: 16,
    //           }}
    //           style={{ backgroundColor: COLORS.lightScheme.onPrimary }}>
    //           <Rows data={tableData} textStyle={styles.text} />
    //         </Table>
    //       </View>
    //       {/* Input Field */}

    //       {/* <View
    //         style={{
    //           // alignSelf: "center",
    //           marginVertical: 15,
    //         }}>
    //         <RadioGroup
    //           radioButtons={radioButtons}
    //           onPress={setSelectedId}
    //           selectedId={selectedId}
    //           layout="row"
    //           labelStyle={{
    //             fontWeight: "800",
    //             fontSize: 20,
    //           }}
    //         />
    //       </View> */}
    //       <View style={styles.inputContainer}>
    //         <InputComponent
    //           keyboardType={"numeric"}
    //           placeholder={"Enter Valid Amount"}
    //           label={"Collection Amount"}
    //           value={collectionMoney}
    //           handleChange={money => {
    //             if (/^\d*\.?\d*$/.test(money)) {
    //               setCollectionMoney(money)
    //             }
    //           }}
    //           autoFocus={true}
    //         />
    //         <View style={styles.buttonContainer}>
    //           <CancelButtonComponent
    //             title={"Back"}
    //             customStyle={{
    //               marginTop: 10,
    //               marginRight: 10,
    //               backgroundColor: "white",
    //               colors: "red",
    //               width: "40%",
    //             }}
    //             handleOnpress={() => {
    //               setCollectionMoney(0)
    //               navigation.goBack()
    //             }}
    //           />

    //           <ButtonComponent
    //             title={"Preview / Save"}
    //             customStyle={{ marginTop: 10, width: "50%" }}
    //             handleOnpress={handlePreviewData}
    //             disabled={!(!checkIsCollectionEnded() && checkDayLock())}
    //           />
    //         </View>
    //       </View>
    //     </ScrollView>
    //   </View>
    // </View>
    <View style={styles.root}>
      <CustomHeader />

      <View style={styles.container}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View>
              <Text style={styles.heroSmall}>Account Overview</Text>
              <Text style={styles.heroTitle}>Daily Account Info</Text>
              <Text style={styles.heroSub}>Enter amount and preview the collection</Text>
            </View>

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Daily</Text>
            </View>
          </View>

          <View style={styles.tableCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>

            <Table
              borderStyle={styles.tableBorder}
              style={styles.table}
            >
              <Rows data={tableData} textStyle={styles.tableText} />
            </Table>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Collection Entry</Text>

            <InputComponent
              keyboardType={"numeric"}
              placeholder={"Enter Valid Amount"}
              label={"Collection Amount"}
              value={collectionMoney}
              handleChange={money => {
                if (/^\d*\.?\d*$/.test(money)) {
                  setCollectionMoney(money)
                }
              }}
              autoFocus={true}
            />

            <View style={styles.buttonContainer}>
              <CancelButtonComponent
                title={"Back"}
                customStyle={styles.backButton}
                handleOnpress={() => {
                  setCollectionMoney(0)
                  navigation.goBack()
                }}
              />

              <ButtonComponent
                title={"Preview / Save"}
                customStyle={styles.saveButton}
                handleOnpress={handlePreviewData}
                disabled={!(!checkIsCollectionEnded() && checkDayLock())}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

export default AccountDetails

// const styles = StyleSheet.create({
//   // text: {
//   //   margin: 6,
//   //   color: COLORS.lightScheme.onBackground,
//   //   fontWeight: '400',
//   //   fontSize: 18,
//   // },
//   text: {
//     margin: 6,
//     color: COLORS.lightScheme.onBackground,
//     fontWeight: "400",
//     fontSize: 18,
//   },
//   head: {
//     margin: 6,
//     color: COLORS.lightScheme.onBackground,
//     fontWeight: "900",
//     fontSize: 12,
//   },
//   info: {
//     color: COLORS.lightScheme.onPrimary,
//     textAlign: "center",
//     fontSize: 22,
//     letterSpacing: 5,
//     backgroundColor: COLORS.lightScheme.primary,
//     borderRadius: 5,
//     marginBottom: 5,
//     paddingVertical: 5,
//     fontWeight: "600",
//     borderBottomLeftRadius: 12,
//     borderBottomRightRadius: 12,
//   },
//   inputContainer: {
//     padding: 20,
//     marginVertical: 10,
//     // padding: 10,
//     backgroundColor: COLORS.lightScheme.onPrimary,
//     borderRadius: 20,
//     borderColor: COLORS.lightScheme.primary,
//     borderWidth: 0.8,
//     elevation: 10,
//   },
//   buttonContainer: {
//     flexDirection: "row",
//     justifyContent: "space-evenly",
//   },
//   tableConatiner: {
//     padding: 10,
//     backgroundColor: COLORS.lightScheme.onPrimary,
//     borderRadius: 5,
//   },
//   // image: {
//   //   height: 100,
//   //   width: "100%",
//   //   alignSelf: "center",
//   // },
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
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(217,184,92,0.12)",
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.35)",
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#009966",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B1F2A",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  tableBorder: {
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
  },
  table: {
    backgroundColor: "#FFFFFF",
  },
  tableText: {
    margin: 0,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: "#334155",
    fontWeight: "500",
    fontSize: 15,
    backgroundColor: "#FFFFFF",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,129,129,0.15)",
    borderRadius: 14,
  },
  saveButton: {
    flex: 1,
    marginTop: 10,
    borderRadius: 14,
  },
});
