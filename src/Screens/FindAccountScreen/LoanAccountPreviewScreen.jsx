import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
  Pressable,
  ToastAndroid,
  ActivityIndicator,
} from "react-native"
import { useContext, useEffect, useState } from "react"
import { COLORS, colors } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import {
  Table,
  TableWrapper,
  Row,
  Rows,
  Col,
} from "react-native-table-component"
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import InputComponent from "../../Components/InputComponent"
import ButtonComponent from "../../Components/ButtonComponent"
import axios from "axios"
import { AppStore } from "../../Context/AppContext";
import { getDBConnection, getSyncCounts, addToSyncQueue, saveCollection, updateLocalAccountBalance, getLatestTransactionDateByAccount } from "../../Database/db-service";
import { REACT_APP_BASE_URL } from "../../Config/config";
import mainNavigationRoutes from "../../Routes/NavigationRoutes";
import { StackActions } from "@react-navigation/native"
import { address } from "../../Routes/addresses"
import { logo } from "../../Resources/ImageStrings/logo"
import { gle } from "../../Resources/ImageStrings/gle"
import { glej } from "../../Resources/ImageStrings/glej"
import AlertModal from "../../Components/AlertModal"
import CancelButtonComponent from "../../Components/CancelButtonComponent"
// import logoCut from "../../Resources/Images/logo_cut.png"

const LoanAccountPreviewScreen = ({ navigation, route }) => {
  const [receiptNumber, setReceiptNumber] = useState(() => "")
  const [isSaveEnabled, setIsSaveEnabled] = useState(() => false)
  const [isLoading, setLoading] = useState(false)
  const [alertInfo, setAlertInfo] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => { },
    onCancel: () => { },
  })
  var todayDT

  const {
    id,
    userId,
    maximumAmount,
    getTotalDepositAmount,
    totalDepositedAmount,
    todayDateFromServer,
    agentName,
    bankName,
    branchName,
    totalCollection,
    login,
    isOffline,
    secAmtType,
    bankId,
    branchCode,
    printOp,
  } = useContext(AppStore)
  const { item, money } = route.params

  const [lastTnxDate, setLastTnxDate] = useState(() => "")
  // const [addedMoney, setAddedMoney] = useState(() => 0)

  const tableData = [
    [
      "A/c Type",
      item && item.product_code[0] == "D"
        ? "Daily"
        : item && item.product_code[0] == "R"
          ? "RD"
          : item && item.product_code[0] == "L"
            ? "Loan"
            : "",
    ],
    ["A/c No.", item && item.account_number],
    ["Name", item && item.customer_name],
    ["Mobile No.", item && item.mobile_no],
    ["Opening Date", new Date(item && item.opening_date).toLocaleDateString("en-GB")],
    [
      "Previous Transaction Date",
      lastTnxDate
        ? new Date(lastTnxDate).toLocaleDateString("en-GB")
        : "No available date",
    ],
    ["Previous Balance", item?.current_balance],
  ]

  const netTotalSectionTableData = [
    ["Tnx. Date", new Date(todayDateFromServer).toLocaleDateString("en-GB")],
    ["Deposit Amt.", money],
    ["Current Balance", parseFloat(item?.current_balance) - parseFloat(money)],
  ]

  const resetAction = StackActions.popToTop()

  const getLastTnxDate = async () => {
    try {
      const db = await getDBConnection();
      const date = await getLatestTransactionDateByAccount(db, item?.account_number);
      setLastTnxDate(date);
    } catch (error) {
      console.error('Error fetching last transaction date:', error);
      setLastTnxDate('');
    }
  }

  useEffect(() => {
    getLastTnxDate()
  }, [])

  const sendCollectedMoney = async () => {
    setLoading(true)
    todayDT = new Date().toISOString()
    const obj = {
      bank_id: item && item.bank_id,
      branch_code: item && item.branch_code,
      agent_code: userId,
      account_holder_name: item && item.customer_name,
      transaction_date: todayDT,
      account_type: item && item.product_code[0],
      product_code: item && item.product_code,
      account_number: item && item.account_number,
      total_amount: parseFloat(item && item.current_balance) - parseFloat(money),
      deposit_amount: parseFloat(money),
      collection_by: userId,
      sec_amt_type: secAmtType,
      // total_collection_amount: totalCollection,
      // flag:'L'
    }
    // Offline handling
    // if (isOffline) {
    try {
      const db = await getDBConnection()
      // 50-transaction offline limit check
      const syncCounts = await getSyncCounts(db)
      if (syncCounts.pending >= 50) {
        setLoading(false)
        setAlertInfo({
          visible: true,
          title: "Offline Limit Reached",
          message: `You have ${syncCounts.pending} pending transactions. Please sync before more collections.`,
          onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })),
          showCancel: false,
          confirmText: "Okay",
        })
        return
      }
      // Generate local receipt number
      const localReceiptNo = new Date().getTime()
      const payloadWithTxn = { ...obj, receipt_no: localReceiptNo }
      await addToSyncQueue(db, address.TRANSACTION, "POST", payloadWithTxn)
      // Save to local collection history
      await saveCollection(db, {
        txn_no: localReceiptNo,
        acc_no: obj.account_number,
        agent_code: obj.agent_code,
        amount: obj.deposit_amount,
        collected_at: obj.transaction_date,
        current_balance:
          obj.total_amount,
        bank_id: obj.bank_id,
        branch_id: obj.branch_code,
        acc_type: obj.account_type,
        synced: 0,
        receipt_printed: 1,
        prev_coll_dt: lastTnxDate,
      });
      // Update local account balance
      await updateLocalAccountBalance(db, obj.account_number, obj.total_amount)
      setLoading(false)
      setAlertInfo({
        visible: true,
        title: "Receipt No. (Offline)",
        message: `Receipt No is ${localReceiptNo}`,
        onConfirm: () => {
          setAlertInfo(prev => ({ ...prev, visible: false }))
          setReceiptNumber(localReceiptNo)
          setIsSaveEnabled(false)
          printReceipt(localReceiptNo)
          navigation.dispatch(resetAction)
        },
        showCancel: false,
        confirmText: "Okay",
      })
      return
    } catch (err) {
      setLoading(false)
      alert(`Offline DB Error: ${err.message}`)
      return
    }
    // }
    // Online flow (unchanged)
    // await axios
    //   .post(address.TRANSACTION, obj, {
    //     headers: {
    //       Accept: "application/json",
    //     },
    //   })
    //   .then(res => {
    //     if (res.data.status) {
    //       setLoading(false)

    //       // console.log("###### Preview: ", res.data)
    //       // alert(`Receipt No is ${res.data.receipt_no}`)
    //       setAlertInfo({
    //         visible: true,
    //         title: "Receipt No.",
    //         message: `Receipt No is ${res.data.receipt_no}`,
    //         onConfirm: () => {
    //           setAlertInfo(prev => ({ ...prev, visible: false }))
    //           setReceiptNumber(res.data.receipt_no)
    //           setIsSaveEnabled(false)
    //           printReceipt(res.data.receipt_no)
    //           navigation.dispatch(resetAction)
    //         },
    //         showCancel: false,
    //         confirmText: "Okay",
    //       })
    //     } else {
    //       setLoading(false)

    //       alert("Data already submitted. Please upload new dataset.")
    //       ToastAndroid.showWithGravityAndOffset(
    //         "Data already submitted. Please upload new dataset.",
    //         ToastAndroid.SHORT,
    //         ToastAndroid.CENTER,
    //         25,
    //         50,
    //       )
    //     }
    //   })
    //   .catch(err => {
    //     setLoading(false)

    //     alert(`An error occurred! ${err}`)
    //     ToastAndroid.showWithGravityAndOffset(
    //       err,
    //       ToastAndroid.SHORT,
    //       ToastAndroid.CENTER,
    //       25,
    //       50,
    //     )
    //   })
  }

  async function printReceipt(rcptNo) {
    // console.log(rcptNo, 'receipt in print')
    if (printOp == 2) {
      try {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(bankName + '\r\n', { align: "center" })
        await BluetoothEscposPrinter.printText(branchName + '\r\n', { align: "center" })

        await BluetoothEscposPrinter.printText("CUSTOMER RECEIPT\n", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText(
          "-------------------------------\n",
          {},
        )

        let columnWidths = [11, 1, 18]

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["AGENT NAME", ":", agentName.toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "RCPT DATE",
            ":",
            (
              new Date(todayDT).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              }) +
              ", " +
              new Date(todayDT).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            ).toString(),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT NO", ":", rcptNo.toString().slice(-6)],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ACC NO", ":", (item?.account_number).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["NAME", ":", (item?.customer_name).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["PREV BAL", ":", (item?.current_balance).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["PAID AMT", ":", money.toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "CURR BAL",
            ":",
            (parseFloat(item?.current_balance) - parseFloat(money)).toFixed(2).toString(),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "PRV TNX DT",
            ":",
            lastTnxDate
              ? new Date(lastTnxDate)
                .toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })
                .toString()
              : "No date.",
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["AGENT CODE", ":", userId.toString()],
          {},
        )

        await BluetoothEscposPrinter.printText(
          "---------------X---------------\n\n",
          {},
        )

      } catch (e) {
        console.log(e.message || "ERROR")
      }
    } else if (printOp == 3) {
      try {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(bankName, { align: "center" })
        await BluetoothEscposPrinter.printText("\r\n", {})
        await BluetoothEscposPrinter.printText(branchName, { align: "center" })
        await BluetoothEscposPrinter.printText("\r\n", {})

        await BluetoothEscposPrinter.printText("CUSTOMER RECEIPT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\r", {})

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------",
          {},
        )
        await BluetoothEscposPrinter.printText("\r\n", {})

        let columnWidths = [20, 2, 26]

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["AGENT NAME", ":", agentName.toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "RCPT DATE",
            ":",
            (
              new Date(todayDT).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              }) +
              ", " +
              new Date(todayDT).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            ).toString(),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT NO", ":", rcptNo.toString().slice(-6)],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ACC NO", ":", (item?.account_number).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["NAME", ":", (item?.customer_name).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["PREV BAL", ":", (item?.current_balance).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["PAID AMT", ":", money.toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "CURR BAL",
            ":",
            (parseFloat(item?.current_balance) - parseFloat(money)).toFixed(2).toString(),
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "PRV TNX DT",
            ":",
            lastTnxDate
              ? new Date(lastTnxDate)
                .toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })
                .toString()
              : "No date.",
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["AGENT CODE", ":", userId.toString()],
          {},
        )

        await BluetoothEscposPrinter.printText(
          "----------------------X----------------------",
          {},
        )

        await BluetoothEscposPrinter.printText("\r\n", {})
      } catch (e) {
        console.log(e.message || "ERROR")
      }
    } else {
      ToastAndroid.showWithGravityAndOffset(
        "Invalid printer option selected.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      )
    }
  }

  const handleSave = () => {
    getTotalDepositAmount()
    // console.log("##$$$$###$$$", maximumAmount, money, totalDepositedAmount)
    // console.log("##$$$$+++++###$$$", money + totalDepositedAmount)
    // console.log("##$$$$+++++###$$$", typeof money, typeof totalDepositedAmount)
    // console.log("##$$$$+++++###$$$", parseFloat(money) + totalDepositedAmount)
    if (!(maximumAmount < parseFloat(money) + totalDepositedAmount)) {
      setIsSaveEnabled(true)
      sendCollectedMoney()
    } else {
      ToastAndroid.showWithGravityAndOffset(
        "Your collection quota has been exceeded.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      )
    }
  }

  // useEffect(() => {
  //   getTotalDepositAmount()
  // }, [])

  // Duplicate sendCollectedMoney function removed; original implementation retained above

  // const sendFinalCollectedMoney = () => {
  //   getTotalDepositAmount()

  //   console.log("Total Deposited Amount", totalDepositedAmount)
  // }

  return (
    // <View>
    //   <CustomHeader />
    //   <View
    //     style={{
    //       backgroundColor: COLORS.lightScheme.background,
    //       height: "100%",
    //       padding: 10,
    //     }}>
    //     <ScrollView>
    //       <Text style={styles.info}>Preview</Text>
    //       {/* Table Component */}
    //       <View style={styles.tableConatiner}>
    //         <Table
    //           borderStyle={{
    //             borderWidth: 5,
    //             borderColor: COLORS.lightScheme.primary,
    //           }}
    //           style={{ backgroundColor: COLORS.lightScheme.onTertiary }}>
    //           <Rows data={tableData} textStyle={styles.text} />
    //         </Table>
    //       </View>

    //       {/* <View style={styles.netTotalTableContainer}>
    //           <Table
    //             borderStyle={{ borderWidth: 0, borderColor: COLORS.lightScheme.primary,  }}
    //             style={{ backgroundColor: COLORS.lightScheme.onTertiary }}>
    //             <Rows data={netTotalSectionTableData} textStyle={styles.netTotalText} />
    //           </Table>
    //         </View> */}

    //       <View style={styles.inputContainer}>
    //         <View style={styles.netTotalTableContainer}>
    //           <Table
    //             borderStyle={{
    //               borderWidth: 1,
    //               borderColor: COLORS.lightScheme.primary,
    //             }}
    //             style={{
    //               backgroundColor: COLORS.lightScheme.secondaryContainer,
    //             }}>
    //             <Rows
    //               data={netTotalSectionTableData}
    //               textStyle={styles.netTotalText}
    //             />
    //           </Table>
    //         </View>
    //         {/* Input Field */}
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
    //               navigation.goBack()
    //             }}
    //           />
    //           <ButtonComponent
    //             title={
    //               !isLoading ? (
    //                 "Save"
    //               ) : (
    //                 <ActivityIndicator color={COLORS.lightScheme.primary} />
    //               )
    //             }
    //             customStyle={{ marginTop: 10, width: "40%" }}
    //             handleOnpress={() => {
    //               handleSave()
    //             }}
    //             disabled={isLoading}
    //           />
    //         </View>
    //       </View>
    //     </ScrollView>
    //   </View>
    // </View>
    <View style={styles.root}>
      <CustomHeader />

      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View>
              <Text style={styles.heroSmall}>Transaction Review</Text>
              <Text style={styles.heroTitle}>Preview</Text>
              <Text style={styles.heroSub}>Confirm details before saving</Text>
            </View>

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Save Ready</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account Summary</Text>
            <Table
              borderStyle={styles.tableBorder}
              style={styles.table}
            >
              <Rows data={tableData} textStyle={styles.text} />
            </Table>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Net Total</Text>
            <Table
              borderStyle={styles.netBorder}
              style={styles.netTable}
            >
              <Rows data={netTotalSectionTableData} textStyle={styles.netTotalText} />
            </Table>
            {/* </View>

      <View style={styles.actionCard}> */}
            <View style={styles.buttonContainer}>
              <CancelButtonComponent
                title={"Back"}
                customStyle={styles.backButton}
                handleOnpress={() => {
                  navigation.goBack()
                }}
              />
              <ButtonComponent
                title={!isLoading ? "Save" : <ActivityIndicator color={COLORS.lightScheme.primary} />}
                customStyle={styles.saveButton}
                handleOnpress={handleSave}
                disabled={isLoading}
              />
            </View>
          </View>
        </ScrollView>
      </View>
      <AlertModal
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={alertInfo.onConfirm}
        onCancel={alertInfo.onCancel}
        showCancel={alertInfo.showCancel !== undefined ? alertInfo.showCancel : true}
        confirmText={alertInfo.confirmText || "Yes"}
        cancelText={alertInfo.cancelText || "No"}
      />
    </View>
  )
}

export default LoanAccountPreviewScreen

// const styles = StyleSheet.create({
//   text: {
//     margin: 6,
//     color: COLORS.lightScheme.onBackground,
//     fontWeight: "400",
//     fontSize: 18,
//   },
//   netTotalTableContainer: {
//     padding: 10,
//     // backgroundColor: COLORS.lightScheme.primary,
//     borderRadius: 15,
//   },
//   netTotalText: {
//     margin: 6,
//     color: "teal",
//     // fontWeight: 'bold',
//     fontSize: 18,
//   },
//   inputContainer: {
//     marginVertical: 10,
//     padding: 10,
//     backgroundColor: COLORS.lightScheme.secondaryContainer,
//     borderRadius: 5,
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
//   buttonContainer: {
//     marginVertical: 10,
//     // padding: 10,
//     paddingTop: -5,
//     backgroundColor: COLORS.darkScheme.onSecondaryContainer,
//     borderRadius: 5,
//     flexDirection: "row",
//     justifyContent: "space-around",
//   },
//   tableConatiner: {
//     padding: 10,
//     backgroundColor: COLORS.lightScheme.onTertiary,
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
    padding: 12,
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
  card: {
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
  },
  tableBorder: {
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
  },
  netBorder: {
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
  },
  table: {
    backgroundColor: "#FFFFFF",
  },
  netTable: {
    backgroundColor: "#cfcfcf",
    borderRadius: 10
  },
  text: {
    margin: 6,
    color: "#334155",
    fontWeight: "500",
    fontSize: 16,
  },
  netTotalText: {
    margin: 6,
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
  actionCard: {
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
    marginBottom: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginVertical: 10
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
