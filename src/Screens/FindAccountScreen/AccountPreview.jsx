import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ToastAndroid,
  ActivityIndicator,
} from "react-native"
import { useContext, useEffect, useState } from "react"
import { COLORS, colors } from "../../Resources/colors"
import CustomHeader from "../../Components/CustomHeader"
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import ButtonComponent from "../../Components/ButtonComponent"
import axios from "axios"
import { AppStore } from "../../Context/AppContext"
import { StackActions } from "@react-navigation/native"
import { address } from "../../Routes/addresses"
import AlertModal from "../../Components/AlertModal"
import CancelButtonComponent from "../../Components/CancelButtonComponent"
import { getDBConnection, getLatestTransactionDateByAccount, saveCollection, updateLocalAccountBalance, addToSyncQueue, getSyncCounts, getAccountByNumber } from "../../Database/db-service";

const AccountPreview = ({ navigation, route }) => {
  const { item: initialItem, money } = route.params;
  const [account, setAccount] = useState(initialItem);
  const item = account;
  const [isLoading, setLoading] = useState(false)
  const [receiptNumber, setReceiptNumber] = useState(() => "")
  const [isSaveEnabled, setIsSaveEnabled] = useState(() => false)
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
    allowCollectionDays,
    secAmtType,
    bankId,
    branchCode,
    printOp,
    isOffline,
  } = useContext(AppStore)


  const [lastTnxDate, setLastTnxDate] = useState(() => "")

  const tableData = [
    [
      "A/c Type",
      account?.product_code[0] == "D"
        ? "Daily"
        : account?.product_code[0] == "R"
          ? "RD"
          : account?.product_code[0] == "L"
            ? "Loan"
            : "",
    ],
    ["A/c No.", account?.account_number],
    ["Name", account?.customer_name],
    ["Mobile No.", account?.mobile_no],
    ["Opening Date", new Date(account?.opening_date).toLocaleDateString("en-GB")],
    [
      "Previous Transaction Date",
      lastTnxDate
        ? new Date(lastTnxDate).toLocaleDateString("en-GB")
        : "No available date",
    ],
    ["Previous Balance", account?.current_balance],
  ]

  const netTotalSectionTableData = [
    ["Tnx. Date", new Date(todayDateFromServer).toLocaleDateString("en-GB")],
    ["Deposit Amt.", money],
    ["Current Balance", parseFloat(account?.current_balance || 0) + parseFloat(money)],
  ]

  const resetAction = StackActions.popToTop()

  const getLastTnxDate = async () => {
    const obj = {
      bank_id: bankId,
      branch_code: branchCode,
      agent_code: userId,
      account_number: item?.account_number,
      flag: "D",
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
    getLastTnxDate();
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const db = await getDBConnection();
        const fresh = await getAccountByNumber(db, account?.account_number);
        if (fresh) setAccount(fresh);
      } catch (e) {
        console.error('Failed to refresh account data', e);
      }
    });
    return unsubscribe;
  }, [navigation]);

  const sendCollectedMoney = async () => {
    setLoading(true)
    todayDT = new Date().toISOString()
    const obj = {
      bank_id: account?.bank_id,
      branch_code: account?.branch_code,
      agent_code: userId,
      account_holder_name: account?.customer_name,
      transaction_date: todayDT,
      account_type: account?.product_code[0],
      product_code: account?.product_code,
      account_number: account?.account_number,
      total_amount: (parseFloat(account?.current_balance) || 0) + parseFloat(money),
      deposit_amount: parseFloat(money),
      collection_by: userId,
      sec_amt_type: secAmtType,
      // total_collection_amount: totalCollection,
    }
    // console.log("===========", obj)
    console.log(obj)
    // OFFLINE INTERCEPTOR
    // if (isOffline) {
    // console.log("Saving transaction OFFLINE");
    try {
      const db = await getDBConnection();

      // 50-transaction offline limit check
      const syncCounts = await getSyncCounts(db);
      if (syncCounts.pending >= 10000) {
        setLoading(false);
        setAlertInfo({
          visible: true,
          title: "Offline Limit Reached",
          message: `You have ${syncCounts.pending} pending transactions. Please sync your data with the server before making more collections.`,
          onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })),
          showCancel: false,
          confirmText: "Okay",
        });
        return;
      }

      // Generate offline receipt no from timestamp
      const localReceiptNo = new Date().getTime();

      // Push payload to Sync Queue
      const payloadWithTxn = { ...obj, receipt_no: localReceiptNo };
      await addToSyncQueue(db, address.TRANSACTION, "POST", payloadWithTxn);

      // Save to td_collection table for local history
      await saveCollection(db, {
        txn_no: localReceiptNo,
        acc_no: obj.account_number,
        agent_code: obj.agent_code,
        amount: obj.deposit_amount,
        collected_at: obj.transaction_date,
        current_balance: obj.total_amount,
        bank_id: obj.bank_id,
        branch_id: obj.branch_code,
        acc_type: obj.account_type,
        synced: 0,
        receipt_printed: 1, // Will be printed below
        prev_coll_dt: lastTnxDate,
      });

      // Update Account Balance in SQLite so they can see the change immediately offline
      await updateLocalAccountBalance(db, obj.account_number, obj.total_amount);

      setLoading(false);
      setAlertInfo({
        visible: true,
        title: "Receipt No. (Offline)",
        message: `Receipt No is ${localReceiptNo}`,
        onConfirm: () => {
          setAlertInfo(prev => ({ ...prev, visible: false }))
          setReceiptNumber(localReceiptNo);
          setIsSaveEnabled(false);
          printReceipt(localReceiptNo);
          navigation.dispatch(resetAction);
        },
        showCancel: false,
        confirmText: "Okay",
      });
      return;
    } catch (err) {
      setLoading(false);
      alert(`Offline DB Error: ${err.message}`);
      return;
    }
    // }

    // ONLINE FLOW
    // try {
    //   const res = await axios.post(address.TRANSACTION, obj, {
    //     headers: { Accept: "application/json" },
    //   });
    //   //console.log("result " + res.data.status);

    //   if (res.data.status) {
    //     // Also save this successful transaction to SQLite for local history/reporting
    //     try {
    //       const db = await getDBConnection();
    //       await saveCollection(db, {
    //         txn_no: res.data.receipt_no,
    //         acc_no: obj.account_number,
    //         agent_code: obj.agent_code,
    //         amount: obj.deposit_amount,
    //         collected_at: obj.transaction_date,
    //         current_balance: obj.total_amount,
    //         synced: 1,   // Online synced perfectly
    //         receipt_printed: 1,
    //         prev_coll_dt: lastTnxDate,
    //       });
    //       // Update local balance so it remains correct if they search it later offline
    //       await updateLocalAccountBalance(db, obj.account_number, obj.total_amount);
    //     } catch (dbErr) {
    //       console.error("Failed to save online transaction to local history", dbErr);
    //     }

    //     setLoading(false);
    //     setAlertInfo({
    //       visible: true,
    //       title: "Receipt No.",
    //       message: `Receipt No is ${res.data.receipt_no}`,
    //       onConfirm: () => {
    //         setAlertInfo(prev => ({ ...prev, visible: false }))
    //         setReceiptNumber(res.data.receipt_no);
    //         setIsSaveEnabled(false);
    //         printReceipt(res.data.receipt_no);
    //         navigation.dispatch(resetAction);
    //       },
    //       showCancel: false,
    //       confirmText: "Okay",
    //     });
    //   } else {
    //     setLoading(false);
    //     //console.log("result else gggggggggggggggggg", res.data);
    //     alert("Data already submitted. Please upload new dataset.");
    //     ToastAndroid.showWithGravityAndOffset(
    //       res.data,
    //       ToastAndroid.SHORT,
    //       ToastAndroid.CENTER,
    //       25,
    //       50,
    //     );
    //   }
    // } catch (err) {
    //   setLoading(false);
    //   alert(`An error occurred! ${err}`);
    //   ToastAndroid.showWithGravityAndOffset(
    //     err.toString(),
    //     ToastAndroid.SHORT,
    //     ToastAndroid.CENTER,
    //     25,
    //     50,
    //   );
    // }
  }

  async function printReceipt(rcptNo) {
    if (printOp == 2) {
      try {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(bankName + '\r\n', { align: "center" })
        // await BluetoothEscposPrinter.printText("\r", {})
        await BluetoothEscposPrinter.printText(branchName + '\r\n', { align: "center" })
        // await BluetoothEscposPrinter.printText("\r", {})

        await BluetoothEscposPrinter.printText("RECEIPT\n", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\r\n", {})

        // await BluetoothEscposPrinter.printPic(logo, { width: 300, align: "center", left: 30 })

        await BluetoothEscposPrinter.printText(
          "-------------------------------\n",
          {},
        )
        // await BluetoothEscposPrinter.printText("\r\n", {})

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
          // ["RCPT NO", ":", rcptNo.toString().substring(0, 6)],
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
          ["NAME", ":", item?.customer_name.toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["OPEN BAL", ":", (item?.current_balance).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["COLL AMT", ":", money.toString()],
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
            "CLOSE BAL",
            ":",
            (parseFloat(item?.current_balance) + parseFloat(money)).toFixed(2).toString(),
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
            lastTnxDate // this is shit -> to be changed later
              ? new Date(lastTnxDate) // this is shit -> -> to be changed later
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
          [
            "ACC OPN DT",
            ":",
            new Date(item?.opening_date)
              .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
              .toString(),
          ],
          {},
        )

        // await BluetoothEscposPrinter.printText("\r\n", {})

        // await BluetoothEscposPrinter.printText("\r\n", {})
        await BluetoothEscposPrinter.printText(
          "---------------X---------------\n\n",
          {},
        )

        // await BluetoothEscposPrinter.printText("\r", {})
      } catch (e) {
        console.log(e.message || "ERROR")
        // ToastAndroid.showWithGravityAndOffset(
        //   "Printer not connected.",
        //   ToastAndroid.SHORT,
        //   ToastAndroid.CENTER,
        //   25,
        //   50,
        // )
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

        await BluetoothEscposPrinter.printText("RECEIPT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\r", {})

        // await BluetoothEscposPrinter.printPic(logo, { width: 300, align: "center", left: 30 })

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
          // ["RCPT NO", ":", rcptNo.toString().substring(0, 6)],
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
          ["NAME", ":", item?.customer_name.toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["OPEN BAL", ":", (item?.current_balance).toString()],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["COLL AMT", ":", money.toString()],
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
            "CLOSE BAL",
            ":",
            parseFloat(item?.current_balance + parseFloat(money)).toString(),
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
            lastTnxDate // this is shit -> to be changed later
              ? new Date(lastTnxDate) // this is shit -> -> to be changed later
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
          [
            "ACC OPN DT",
            ":",
            new Date(item?.opening_date)
              .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
              .toString(),
          ],
          {},
        )

        // await BluetoothEscposPrinter.printText("\r\n", {})

        // await BluetoothEscposPrinter.printText("\r\n", {})
        await BluetoothEscposPrinter.printText(
          "----------------------X----------------------",
          {},
        )

        await BluetoothEscposPrinter.printText("\r\n", {})
      } catch (e) {
        console.log(e.message || "ERROR")
        // ToastAndroid.showWithGravityAndOffset(
        //   "Printer not connected.",
        //   ToastAndroid.SHORT,
        //   ToastAndroid.CENTER,
        //   25,
        //   50,
        // )
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

  // console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR", secAmtType)

  const handleSave = () => {
    getTotalDepositAmount()
    // console.log("##$$$$###$$$", maximumAmount, money, totalDepositedAmount)
    // console.log("##$$$$+++++###$$$", money + totalDepositedAmount)
    // console.log("##$$$$+++++###$$$", typeof money, typeof totalDepositedAmount)
    // console.log("##$$$$+++++###$$$", parseFloat(money) + totalDepositedAmount)
    // console.log("SEC AMT TYPE===============>>>>>>>>>>>>>", secAmtType)

    if (secAmtType == "M") {
      // console.log("MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM")
      // console.log("TTTTTYYYYYPPPPPEEEEE", maximumAmount)
      // console.log("TTTTTYYYYYPPPPPEEEEE", allowCollectionDays)
      // console.log("##$$$$###$$$", maximumAmount * allowCollectionDays)
      // console.log("##$$$$+++++###$$$", parseFloat(money) + totalDepositedAmount)
      // console.log(
      //   "##$$$$+++++###$$$ totalDepositedAmount",
      //   totalDepositedAmount,
      // )
      // console.log("##$$$$+++++###$$$ totalCollection", totalCollection)

      // if (maximumAmount >= parseFloat(money) + totalDepositedAmount) {
      if (maximumAmount >= parseFloat(money) + totalCollection) {
        // console.log("MMMMMMMMMMMMMMMM")
        setIsSaveEnabled(true)
        sendCollectedMoney()
        // maximumAmount -= money
        login()
      } // M
      else {
        ToastAndroid.showWithGravityAndOffset(
          "Your collection quota has been exceeded.",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        )
      }
    } else if (secAmtType == "A") {
      // console.log("AAAAAAAAAAAAAAAAAA")

      // console.log("TTTTTYYYYYPPPPPEEEEE maximumAmount", maximumAmount)
      // console.log(
      //   "TTTTTYYYYYPPPPPEEEEE allowCollectionDays",
      //   allowCollectionDays,
      // )
      // console.log(
      //   "##$$$$###$$ maximumAmount * allowCollectionDays",
      //   maximumAmount * allowCollectionDays,
      // )
      // console.log(
      //   "##$$$$+++++###$$$ (money) + totalDepositedAmount",
      //   parseFloat(money) + totalDepositedAmount,
      // )

      // console.log(
      //   "##$$$$+++++###$$$ totalDepositedAmount",
      //   totalDepositedAmount,
      // )
      // console.log("##$$$$+++++###$$$ totalCollection", totalCollection)

      if (maximumAmount >= parseFloat(money) + totalCollection) {
        setIsSaveEnabled(true)
        sendCollectedMoney()
        // maximumAmount -= money
        login()
      } // A
      else {
        ToastAndroid.showWithGravityAndOffset(
          "Your collection quota has been exceeded.",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        )
      }
    }
  }

  // useEffect(() => {
  //   getTotalDepositAmount()
  // }, [])

  // const sendFinalCollectedMoney = () => {
  //   getTotalDepositAmount()

  //   console.log("Total Deposited Amount", totalDepositedAmount)
  // }

  return (
    // <View>
    //   <CustomHeader />
    //   <ScrollView
    //     style={{
    //       backgroundColor: COLORS.lightScheme.background,
    //       height: "90%",
    //       padding: 10,
    //     }}>
    //     {/* <ScrollView> */}
    //     <Text style={styles.info}>Preview</Text>
    //     {/* Table Component */}
    //     <View style={styles.tableConatiner}>
    //       <Table
    //         borderStyle={{
    //           borderWidth: 5,
    //           borderColor: COLORS.lightScheme.primary,
    //         }}
    //         style={{ backgroundColor: COLORS.lightScheme.onTertiary }}>
    //         <Rows data={tableData} textStyle={styles.text} />
    //       </Table>
    //     </View>

    //     {/* <View style={styles.netTotalTableContainer}>
    //         <Table
    //           borderStyle={{ borderWidth: 0, borderColor: COLORS.lightScheme.primary,  }}
    //           style={{ backgroundColor: COLORS.lightScheme.onTertiary }}>
    //           <Rows data={netTotalSectionTableData} textStyle={styles.netTotalText} />
    //         </Table>
    //       </View> */}

    //     <View style={styles.inputContainer}>
    //       <View style={styles.netTotalTableContainer}>
    //         <Table
    //           borderStyle={{
    //             borderWidth: 1,
    //             borderColor: COLORS.lightScheme.primary,
    //           }}
    //           style={{
    //             backgroundColor: COLORS.lightScheme.secondaryContainer,
    //           }}>
    //           <Rows
    //             data={netTotalSectionTableData}
    //             textStyle={styles.netTotalText}
    //           />
    //         </Table>
    //       </View>
    //       <View style={styles.buttonContainer}>
    //         <CancelButtonComponent
    //           title={"Back"}
    //           customStyle={{
    //             marginTop: 10,
    //             backgroundColor: "white",
    //             colors: "red",
    //             width: "40%",
    //           }}
    //           handleOnpress={() => {
    //             navigation.goBack()
    //           }}
    //         />
    //         <ButtonComponent
    //           disabled={isLoading}
    //           title={
    //             !isLoading ? (
    //               "Save"
    //             ) : (
    //               <ActivityIndicator color={COLORS.lightScheme.primary} />
    //             )
    //           }
    //           customStyle={{ marginTop: 10, width: "40%" }}
    //           handleOnpress={() => {
    //             handleSave()
    //           }}
    //           // disabled={isSaveEnabled}
    //         />
    //       </View>
    //     </View>

    //     {/* </ScrollView> */}
    //   </ScrollView>
    // </View>

    <View style={styles.root}>
      <CustomHeader />

      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View>
            <Text style={styles.heroSmall}>Transaction Preview</Text>
            <Text style={styles.heroTitle}>Preview</Text>
            <Text style={styles.heroSub}>Review details before saving</Text>
          </View>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Ready</Text>
          </View>
        </View>

        <View style={styles.tableCard}>
          <Text style={styles.sectionTitle}>Account Summary</Text>
          {tableData.map((row, index) => (
            <View
              key={index}
              style={[
                styles.summaryRow,
                index === tableData.length - 1 && styles.summaryRowLast
              ]}
            >
              <Text style={styles.summaryLabel}>{row[0]}</Text>
              <Text style={styles.summaryValue}>{row[1]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Net Total</Text>
          <View style={styles.netTotalContainer}>
            {netTotalSectionTableData.map((row, index) => (
              <View
                key={index}
                style={[
                  styles.summaryRow,
                  index === netTotalSectionTableData.length - 1 && styles.summaryRowLast
                ]}
              >
                <Text style={styles.summaryLabel}>{row[0]}</Text>
                <Text style={[
                  styles.summaryValue,
                  index > 1 && styles.summaryValueHighlight
                ]}>
                  {index > 0 ? `₹${Number(row[1] || 0).toFixed(2)}` : row[1]}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <CancelButtonComponent
              title={"Back"}
              customStyle={styles.backButton}
              handleOnpress={() => {
                navigation.goBack()
              }}
            />

            <ButtonComponent
              disabled={isLoading}
              title={
                !isLoading ? (
                  "Save"
                ) : (
                  <ActivityIndicator color={COLORS.lightScheme.primary} />
                )
              }
              customStyle={styles.saveButton}
              handleOnpress={() => {
                handleSave()
              }}
            />
          </View>
        </View>
      </ScrollView>
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

export default AccountPreview

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
//   image: {
//     height: 80,
//     width: "80%",
//     alignSelf: "center",
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.1)",
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 14,
    color: "#0B1F2A",
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  summaryValueHighlight: {
    fontSize: 16,
    color: "#009966",
    fontWeight: "800",
  },
  netTotalContainer: {
    backgroundColor: "rgba(0,153,102,0.03)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0,153,102,0.1)",
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
