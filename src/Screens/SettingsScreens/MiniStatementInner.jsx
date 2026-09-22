import { useContext, useState, useEffect } from "react"
import {
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ToastAndroid,
  Modal,
  ActivityIndicator,
} from "react-native"
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import { AppStore } from "../../Context/AppContext"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS } from "../../Resources/colors"
import { Table, Rows, Row, Col } from "react-native-table-component"
import axios from "axios"
import CalendarPicker from "react-native-calendar-picker"
import { address } from "../../Routes/addresses"
import { removeIndexes } from "../../Functions/removeIndexes";
import { getDBConnection, getMiniStatementOffline } from "../../Database/db-service";

const MiniStatementInner = ({ route }) => {
  const { item } = route.params
  // console.log('item '+item.acc_type)
  const { userId, bankId, branchCode, bankName, branchName, agentName } =
    useContext(AppStore)

  const [selectedStartDate, setSelectedStartDate] = useState(() => new Date())
  const [selectedEndDate, setSelectedEndDate] = useState(() => new Date())
  const [showModal, setShowModal] = useState(() => false)
  const [miniStatementArray, setMiniStatementArray] = useState(() => [])
  const [totalAmount, setTotalAmount] = useState(() => 0)
  const [isLoading, setIsLoading] = useState(false)
  const startDate = selectedStartDate
    ? selectedStartDate.toISOString().slice(0, 10)
    : ""
  const endDate = selectedEndDate
    ? selectedEndDate.toISOString().slice(0, 10)
    : ""

  const onDateChange = (date, type) => {
    if (type === "END_DATE") {
      setSelectedEndDate(date)
      setShowModal(false)
    } else {
      setSelectedStartDate(date)
      setSelectedEndDate(null)
    }
  }

  const tableHead = ["Sl No.", "Date", "Deposit", "Balance"]
  const accountDetailsTable = [[item?.customer_name], [item?.account_number]]
  let tableData = miniStatementArray

  const dateFormatters = dateData => {
    const originalDate = dateData
    const date = new Date(originalDate)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    const formattedDate = `${day}/${month}/${year}`
    // console.log(formattedDate)
    return formattedDate
  }

  const getMiniStatement = async () => {
    setIsLoading(true);
    try {
      // Offline fetch handled in fallbackToLocal
      await fallbackToLocal();
    } catch (err) {
      console.error('Error in getMiniStatement', err);
    } finally {
      setIsLoading(false);
    }
  };
  async function fallbackToLocal() {
    try {
      const db = await getDBConnection();
      // Use offline function for specific account
      const recent = await getMiniStatementOffline(db, {
        bank_id: bankId,
        branch_code: branchCode,
        agent_code: userId,
        acc_num: item?.account_number,
        account_type: item?.product_code[0],
        fromDate: startDate,
        toDate: endDate,
      });
      let localTotal = 0;
      console.log('recent', recent)
      recent.forEach((itm, i) => {
        const rowArr = [
          i + 1,
          new Date(itm?.PAID_DT).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          }),
          itm.PAID_AMT,
          itm.BALANCE_AMT,
        ];
        localTotal += itm.PAID_AMT;
        tableData.push(...[rowArr]);
      });
      if (tableData.length == 0) {
        ToastAndroid.showWithGravityAndOffset(
          'No data found!',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        );
      }
      setTotalAmount(localTotal);
      setMiniStatementArray(tableData);
    } catch (dbErr) {
      console.error('Error fetching local mini statement', dbErr);
      ToastAndroid.showWithGravityAndOffset(
        'Error loading data offline',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      );
    }
  }
  async function printReceipt() {
    try {
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printText(bankName + '\r\n', { align: "center" })
      // await BluetoothEscposPrinter.printText("\r\n", {})
      await BluetoothEscposPrinter.printText(branchName + '\r\n', { align: "center" })
      // await BluetoothEscposPrinter.printText("\r\n", {})
      await BluetoothEscposPrinter.printColumn(
        [10, 2, 18],
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        [
          "Date",
          ":",
          new Date()
            .toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })
            .toString(),
        ],
        {},
      )
      await BluetoothEscposPrinter.printColumn(
        [10, 2, 18],
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["Agent", ":", agentName],
        {},
      )
      await BluetoothEscposPrinter.printColumn(
        [10, 2, 18],
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["Cus Name", ":", item.customer_name],
        {},
      )

      await BluetoothEscposPrinter.printColumn(
        [10, 2, 18],
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["Acc No", ":", item.account_number],
        {},
      )

      await BluetoothEscposPrinter.printText(
        "-------------------------------\n",
        {},
      )

      await BluetoothEscposPrinter.printText("MINI STATEMENT\n", {
        align: "center",
      })
      const typeChar = item?.product_code ? item.product_code[0] : item?.acc_type;
      await BluetoothEscposPrinter.printText(
        "TYPE: " + (typeChar == "D" ? "Daily" : typeChar == "L" ? "Loan" : typeChar == "R" ? "RD" : "") + "\n",
        { align: "center" },
      )

      // await BluetoothEscposPrinter.printText(`FROM: ${new Date(startDate).toLocaleDateString("en-GB", {day: "2-digit", month: "2-digit", year: "2-digit"})}  TO: ${new Date(endDate).toLocaleDateString("en-GB", {day: "2-digit", month: "2-digit", year: "2-digit"})}`, {
      //   align: "center",
      // })

      // await BluetoothEscposPrinter.printText("\r", {})

      // await BluetoothEscposPrinter.printPic(logo, { width: 300, align: "center", left: 30 })

      await BluetoothEscposPrinter.printText(
        "-------------------------------",
        {},
      )
      // await BluetoothEscposPrinter.printText("\r\n", {})

      let columnWidthsHeader = [10, 10, 10]
      await BluetoothEscposPrinter.printColumn(
        columnWidthsHeader,
        [
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.CENTER,
        ],
        ["Date", "Coll Amt", "Cls Bal"],
        {},
      )

      const copiedTableData = [...tableData]
      // console.log("TABLLLELEEEEE DDDAAATAAAA  CPPPYYY ", copiedTableData)

      let columnWidthsBody = [30]
      copiedTableData.forEach(async item => {
        let newItems = [...item]
        // console.log("new itemsssssss", newItems)
        const updatedItems = removeIndexes(newItems, [0])

        // updatedItems[2] = updatedItems[2].slice(0, 8)
        let items = updatedItems.join("     ")
        // console.log("++==++ PRINTED ITEM", items)
        await BluetoothEscposPrinter.printColumn(
          columnWidthsBody,
          [BluetoothEscposPrinter.ALIGN.CENTER],
          [items.toString()],
          {},
        )
      })

      await BluetoothEscposPrinter.printText(
        "-------------------------------\n",
        {},
      )

      await BluetoothEscposPrinter.printText(
        `TOTAL AMOUNT: ${totalAmount}\r\n`,
        {
          align: "center",
        },
      )
      // await BluetoothEscposPrinter.printText("Total Receipts: " + totalReceipts + "\n", { align: "center" })
      // await BluetoothEscposPrinter.printText("Total Amount: " + total + "\n", { align: "center" })
      await BluetoothEscposPrinter.printText(
        "---------------X---------------\n\n",
        {},
      )

      // await BluetoothEscposPrinter.printText("\r\n", {})
    } catch (e) {
      console.log(e.message || "ERROR")
      ToastAndroid.showWithGravityAndOffset(
        "Printer not connected.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      )
    }
  }

  useEffect(() => {
    getMiniStatement()
  }, [])

  return (
    <View style={styles.root}>
      <CustomHeader />

      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroSmall}>Reports</Text>
          <Text style={styles.heroTitle}>Mini Statement</Text>
          <Text style={styles.heroSub}>Account details and recent transactions</Text>
        </View>

        <View style={styles.card}>
          <Table
            borderStyle={styles.tableBorder}
            style={styles.table}
          >
            <Row
              data={accountDetailsTable}
              textStyle={styles.accountDetailsStyle}
            />
          </Table>
        </View>

        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator
              color="#0B1F2A"
              size="large"
            />
          </View>
        )}

        <ScrollView style={styles.scrollViewStyle} showsVerticalScrollIndicator={false}>
          {tableData.length !== 0 && (
            <View style={styles.tableCard}>
              <Table
                borderStyle={styles.tableBorder}
                style={styles.table}
              >
                <Row data={tableHead} textStyle={styles.head} />
                <Rows data={tableData} textStyle={styles.text} />
              </Table>

              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{totalAmount}</Text>
              </View>

              <TouchableOpacity
                disabled={tableData.length === 0}
                onPress={() => printReceipt()}
                style={[
                  styles.printButton,
                  tableData.length === 0 && styles.disabledContainer,
                ]}
                activeOpacity={0.85}
              >
                <Text style={styles.btnLabel}>PRINT</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

export default MiniStatementInner

// const styles = StyleSheet.create({
//   dateWrapper: {
//     flex: 1,
//     justifyContent: "space-evenly",
//     alignItems: "center",
//     flexDirection: "row",
//     margin: 0,
//   },
//   dateButton: {
//     width: "40%",
//     height: 40,
//     borderWidth: 2,
//     borderColor: COLORS.lightScheme.primary,
//     backgroundColor: COLORS.lightScheme.primary,
//     margin: 15,
//     borderRadius: 30,
//     alignSelf: "center",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   text: {
//     margin: 6,
//     color: COLORS.lightScheme.onBackground,
//     fontWeight: "400",
//     fontSize: 10,
//   },
//   accountDetailsStyle: {
//     margin: 6,
//     color: COLORS.lightScheme.primary,
//     fontWeight: "bold",
//     fontSize: 20,
//   },
//   head: {
//     margin: 6,
//     color: COLORS.lightScheme.onBackground,
//     fontWeight: "900",
//     fontSize: 10,
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

//   scrollViewStyle: {
//     marginTop: 15,
//   },
//   disabledContainer: {
//     width: "40%",
//     height: 40,
//     borderWidth: 2,
//     borderColor: "lightgray",
//     backgroundColor: "lightgray",
//     margin: 15,
//     borderRadius: 30,
//     alignSelf: "center",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   btnLabel: {
//     color: "white",
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
  },
  heroSub: {
    marginTop: 6,
    fontSize: 14,
    color: "#009966",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
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
  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
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
  tableBorder: {
    borderWidth: 2,
    borderColor: "#0B1F2A",
    borderRadius: 10,
  },
  table: {
    backgroundColor: "#FFFFFF",
  },
  accountDetailsStyle: {
    margin: 6,
    color: "#0B1F2A",
    fontWeight: "bold",
    fontSize: 20,
  },
  head: {
    margin: 6,
    color: "#0B1F2A",
    fontWeight: "900",
    fontSize: 10,
  },
  text: {
    margin: 6,
    color: "#334155",
    fontWeight: "400",
    fontSize: 10,
  },
  scrollViewStyle: {
    marginTop: 15,
  },
  loadingWrap: {
    paddingVertical: 10,
  },
  totalCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#EAF7F7",
    borderWidth: 1,
    borderColor: "rgba(0,129,129,0.12)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: "#0B1F2A",
    fontSize: 14,
    fontWeight: "700",
  },
  totalValue: {
    color: "#0B7A75",
    fontSize: 16,
    fontWeight: "800",
  },
  printButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#0B1F2A",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledContainer: {
    backgroundColor: "#C9D3D8",
  },
  btnLabel: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});
