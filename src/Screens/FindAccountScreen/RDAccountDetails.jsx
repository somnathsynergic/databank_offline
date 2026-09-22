import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
  Alert,
  Pressable,
  ToastAndroid,
} from "react-native"
import { useContext, useState, useEffect, useCallback } from "react"
import { COLORS, colors } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import { getDBConnection, getLatestTransactionDateByAccount } from "../../Database/db-service"

import {
  Table,
  TableWrapper,
  Row,
  Rows,
  Col,
} from "react-native-table-component"

import InputComponent from "../../Components/InputComponent"
import ButtonComponent from "../../Components/ButtonComponent"
import mainNavigationRoutes from "../../Routes/NavigationRoutes"
import { AppStore } from "../../Context/AppContext"
import { StackActions, useFocusEffect } from "@react-navigation/native"
import CancelButtonComponent from "../../Components/CancelButtonComponent"
import { address } from "../../Routes/addresses"
import moment from "moment"

const RDAccountDetails = ({ navigation, route }) => {
  const [collectionMoney, setCollectionMoney] = useState(() => 0)
  const {
    modifiedAt,
    todayDateFromServer,
    holidayLock,
    getFlagsRequest,
    collectionFlag,
    endFlag,
    transDt,
    allowCollectionDays,
    userId,
    bankId,
    branchCode,
  } = useContext(AppStore)

  const { item } = route.params
  console.log(item)

  // console.log("*************************************", item?.opening_date)

  const [lastTnxDate, setLastTnxDate] = useState(() => "")

  const tableData = [
    [
      "Account Type",
      item?.product_code[0] == "D"
        ? "Daily"
        : item?.product_code[0] == "R"
          ? "RD"
          : item?.product_code[0] == "L"
            ? "Loan"
            : "",
    ],
    ["Account No.", item?.account_number],
    ["Name", item?.customer_name],
    ["Mobile No.", item?.mobile_no],
    [
      "Opening date",
      new Date(item?.opening_date).toLocaleDateString("en-GB"),
      // moment.utc(item?.opening_date).format("DD/MM/YYYY HH:mm"),
    ],
    [
      "Previous Transaction Date",
      lastTnxDate
        ? new Date(lastTnxDate).toLocaleDateString("en-GB")
        : // ? moment.utc(lastTnxDate).format("DD/MM/YYYY HH:mm")
        "No available date",
    ],
    ["Current Balance", item?.current_balance],
  ]

  const getLastTnxDate = async () => {
    const obj = {
      bank_id: bankId,
      branch_code: branchCode,
      agent_code: userId,
      account_number: item?.account_number,
      flag: "R",
    }

    // console.log("OOOOOOOOOOOOOOOOOOOOOOOOOOOO", obj)

    try {
      const db = await getDBConnection();
      const latest = await getLatestTransactionDateByAccount(db, item?.account_number);
      setLastTnxDate(latest);
    } catch (err) {
      console.error('Error fetching last transaction date:', err);
    }
  }

  useEffect(() => {
    getLastTnxDate()
  }, [])

  useEffect(() => {
    getFlagsRequest()
  }, [])

  const handlePreviewData = () => {
    if (!collectionMoney || collectionMoney <= 0) {
      ToastAndroid.showWithGravityAndOffset(
        "Invalid Ammount",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      )
      return
    }
    // setCollectionMoney(0)
    navigation.navigate(mainNavigationRoutes.RDAccountPreview, {
      item: item,
      money: collectionMoney,
    })
  }
  const checkDayLock = () => {
    let currentDate = new Date(todayDateFromServer.toISOString().slice(0, 10))
    // console.log("CURRRRR DATEE", currentDate)
    let trans_dt = new Date(transDt.toISOString().slice(0, 10))
    // console.log("MODDDD DATEsssssss", trans_dt)
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
    // console.log("CURRRRR DATEE", currentDate)
    let modifiedAtDate = new Date(modifiedAt.toISOString().slice(0, 10))
    // console.log("MODDDD DATE", modifiedAtDate)
    let newModifiedDate = new Date()

    // let afterAddingHolidayLockDays = modifiedAtDate.getDate() + 1
    newModifiedDate.setDate(modifiedAtDate.getDate() + holidayLock)
    // console.log("HOLIIIIDDDAAAAYYYYY _+++++++>>>", holidayLock)

    return newModifiedDate >= currentDate
  }

  // console.log("CHECKKK HOLIDAAAY LOCKKK fun()", checkDayLock())

  const checkIsCollectionEnded = () => {
    if (collectionFlag == "Y" && endFlag == "N") return false
    else if (collectionFlag == "N" && endFlag == "Y") return true
  }

  // console.log("CHECKKK COLLL ENDEDDD ========>>>>>", checkIsCollectionEnded())

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
    //       <Text style={styles.info}>RD Account Info</Text>
    //       {/* Table Component */}
    //       <View style={styles.tableConatiner}>
    //         <Table
    //           borderStyle={{
    //             borderWidth: 2,
    //             borderColor: COLORS.lightScheme.primary,
    //           }}
    //           style={{ backgroundColor: COLORS.lightScheme.onPrimary }}>
    //           <Rows data={tableData} textStyle={styles.text} />
    //         </Table>
    //       </View>
    //       {/* Input Field */}
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
    //           {!checkIsCollectionEnded() && checkDayLock() ? (
    //             <ButtonComponent
    //               title={"Preview / Save"}
    //               customStyle={{ marginTop: 10, width: "50%" }}
    //               handleOnpress={handlePreviewData}
    //             />
    //           ) : (
    //             <ButtonComponent
    //               title={"Preview / Save"}
    //               customStyle={{ marginTop: 10, width: "50%" }}
    //               handleOnpress={handlePreviewData}
    //               disabled={true}
    //             />
    //           )}

    //           {/* <ButtonComponent
    //           title={'Preview / Save'}
    //           customStyle={{ marginTop: 10, width: '60%' }}
    //           handleOnpress={handlePreviewData}
    //         /> */}
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
              <Text style={styles.heroSmall}>Recurring Deposit</Text>
              <Text style={styles.heroTitle}>RD Account Info</Text>
              <Text style={styles.heroSub}>Enter amount and preview the collection</Text>
            </View>

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>RD</Text>
            </View>
          </View>

          <View style={styles.tableCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>

            <Table
              borderStyle={styles.tableBorder}
              style={styles.table}
            >
              <Rows data={tableData} textStyle={styles.text} />
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

              {!checkIsCollectionEnded() && checkDayLock() ? (
                <ButtonComponent
                  title={"Preview / Save"}
                  customStyle={styles.saveButton}
                  handleOnpress={handlePreviewData}
                />
              ) : (
                <ButtonComponent
                  title={"Preview / Save"}
                  customStyle={styles.saveButton}
                  handleOnpress={handlePreviewData}
                  disabled={true}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

export default RDAccountDetails

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
  text: {
    margin: 6,
    color: "#334155",
    fontWeight: "500",
    fontSize: 16,
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
