import { useContext, useEffect, useState } from "react"
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
import { COLORS, colors } from "../../Resources/colors"
import { Table, Rows, Row } from "react-native-table-component"
// import axios from "axios" // Removed; using local DB service
import { REACT_APP_BASE_URL } from "../../Config/config"
import { getDayScrollReport, getDBConnection, getTypeWiseReport } from "../../Database/db-service"
import CalendarPicker from "react-native-calendar-picker"
// import { address } from "../../Routes/addresses" // No longer needed for offline report
// import { removeIndexes } from "../../Functions/removeIndexes" // Not used
import { Dropdown } from "react-native-element-dropdown"
// import { table } from "console" // Unused import removed
// import { NodePath } from "@babel/core" // Unused import removed
import NoData from "../../Components/NoData"

const ReportDay = () => {
  const { userId, bankId, branchCode, agentName, bankName, branchName, printOp } =
    useContext(AppStore)

  const [selectedStartDate, setSelectedStartDate] = useState(() => new Date())
  const [selectedEndDate, setSelectedEndDate] = useState(() => new Date())
  const [isData, setIsData] = useState(true)
  const [accountType, setAccountType] = useState(() => "")
  const [focusDrop, setFocusDrop] = useState(() => false)
  const [showModal, setShowModal] = useState(() => false)
  const [isDisabled, setIsDisabled] = useState(true)

  const [dayScrollReportArray, setDayScrollReportArray] = useState([])

  const [totalAmount, setTotalAmount] = useState(() => 0)
  const [isLoading, setIsLoading] = useState(false)

  const startDate = selectedStartDate
    ? selectedStartDate.toISOString().slice(0, 10)
    : ""
  const endDate = selectedEndDate
    ? selectedEndDate.toISOString().slice(0, 10)
    : ""
  const renderLabel = () => {
    if (accountType || focusDrop) {
      return (
        <Text style={[styles.label, focusDrop && { color: "blue" }]}>
          Select type
        </Text>
      )
    }
    return null
  }
  const data = [
    { label: "Daily", value: "D" },
    { label: "Loan", value: "L" },
    { label: "RD", value: "R" },
  ]

  const onDateChange = (date, type) => {
    if (type === "END_DATE") {
      setSelectedEndDate(date)
      setShowModal(false)
    } else {
      setSelectedStartDate(date)
      setSelectedEndDate(null)
    }
  }
  useEffect(() => {
    // console.log(printOp, 'printOp')
  }, [])
  const tableHead = ["Sl No.", "Date", "A/C Type", "A/c No.", "Name", "Amount"]
  let tableData = dayScrollReportArray

  const getReportsDayScroll = async () => {
    setIsLoading(true);
    setIsDisabled(true);
    const params = {
      bank_id: bankId,
      branch_code: branchCode,
      agent_code: userId,
      account_type: accountType,
      fromDate: startDate,
      toDate: endDate,
    };
    try {
      const db = await getDBConnection();
      const rows = await getDayScrollReport(db, params);
      let totalDepositedAmount = 0;
      console.log(rows)
      const newTableData = [];
      rows.forEach((item, i) => {
        const rowArr = [
          i + 1,
          new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
          accountType,
          item.account_number,
          item.account_holder_name,
          item.deposit_amount,
        ];
        totalDepositedAmount += item.deposit_amount;
        newTableData.push(rowArr);
      });
      if (newTableData.length === 0) {
        ToastAndroid.showWithGravityAndOffset(
          'No data found!',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        );
      }
      setTotalAmount(totalDepositedAmount);
      setDayScrollReportArray(newTableData);
    } catch (error) {
      ToastAndroid.showWithGravityAndOffset(
        'Error fetching report.',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      );
      console.log(error);
    } finally {
      setIsLoading(false);
      setIsDisabled(false);
    }
  }
  async function printReceipt() {
    if (printOp == 2) {
      try {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(bankName + '\r\n', { align: "center" })
        await BluetoothEscposPrinter.printText(branchName + '\r\n', { align: "center" })
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

        await BluetoothEscposPrinter.printText(
          "-------------------------------\n",
          {},
        )

        await BluetoothEscposPrinter.printText("DAY SCROLL REPORT\r\n", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText(
          "TYPE: " + (accountType == "D" ? "Daily" : accountType == "L" ? "Loan" : accountType == "R" ? "RD" : "") + "\r\n",
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText(
          `FROM: ${new Date(startDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}  TO: ${new Date(endDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}`,
          {
            align: "center",
          },
        )

        await BluetoothEscposPrinter.printText(
          "\n-------------------------------\n",
          {},
        )

        let columnWidthsHeader = [10, 10, 10]
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["A/c No", "Name", "Amt"],
          {},
        )
        await BluetoothEscposPrinter.printText("...............................\n", {})

        const copiedTableData = [...tableData]
        // console.log("TABLLLELEEEEE DDDAAATAAAA  CPPPYYY ", copiedTableData)

        let columnWidthsBody = [13, 12, 7]
        copiedTableData.forEach(async item => {
          await BluetoothEscposPrinter.printColumn(
            columnWidthsBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              item[3] ? item[3].toString() : "",
              item[4] ? item[4].toString().slice(0, 10) : "",
              item[5] ? item[5].toString() : "",
            ],
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
        await BluetoothEscposPrinter.printText(
          "---------------X---------------\n\n",
          {},
        )

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
    } else if (printOp == 3) {
      try {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(bankName, { align: "center" })
        await BluetoothEscposPrinter.printText("\r\n", {})
        await BluetoothEscposPrinter.printText(branchName, { align: "center" })
        await BluetoothEscposPrinter.printText("\r\n", {})
        await BluetoothEscposPrinter.printColumn(
          [15, 2, 31],
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
          [15, 2, 31],
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["Agent", ":", agentName],
          {},
        )

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------\n",
          {},
        )

        await BluetoothEscposPrinter.printText("DAY SCROLL REPORT\r\n", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText(
          "TYPE: " + (accountType == "D" ? "Daily" : accountType == "L" ? "Loan" : accountType == "R" ? "RD" : "") + "\r\n",
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText(
          `FROM: ${new Date(startDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}  TO: ${new Date(endDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })}`,
          {
            align: "center",
          },
        )

        await BluetoothEscposPrinter.printText("\r", {})

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------",
          {},
        )
        await BluetoothEscposPrinter.printText("\r\n", {})

        let columnWidthsHeader = [16, 16, 16]
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["A/c No", "Name", "Amt"],
          {},
        )
        await BluetoothEscposPrinter.printText("................................................\n", {})

        const copiedTableData = [...tableData]
        // console.log("TABLLLELEEEEE DDDAAATAAAA  CPPPYYY ", copiedTableData)

        let columnWidthsBody = [13, 25, 10]
        copiedTableData.forEach(async item => {
          await BluetoothEscposPrinter.printColumn(
            columnWidthsBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              item[3] ? item[3].toString() : "",
              item[4] ? item[4].toString().slice(0, 24) : "",
              item[5] ? item[5].toString() : "",
            ],
            {},
          )
        })

        await BluetoothEscposPrinter.printText(
          "------------------------------------------------\n",
          {},
        )

        await BluetoothEscposPrinter.printText(
          `TOTAL AMOUNT: ${totalAmount}\r\n`,
          {
            align: "center",
          },
        )
        await BluetoothEscposPrinter.printText(
          "----------------------X----------------------",
          {},
        )

        await BluetoothEscposPrinter.printText("\r\n", {})
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

  const handleSubmit = () => {
    tableData = []
    getReportsDayScroll()
  }

  return (
    <View style={styles.root}>
      <CustomHeader />

      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroSmall}>Reports</Text>
          <Text style={styles.heroTitle}>Day Scroll Report</Text>
          <Text style={styles.heroSub}>Filter by date range and account type</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={styles.dateCard}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.dateLabel}>From</Text>
            <Text style={styles.dateValue}>
              {new Date(startDate).toLocaleDateString("en-GB")}
            </Text>
          </View>

          <View style={styles.dateDivider} />

          <View>
            <Text style={styles.dateLabel}>To</Text>
            <Text style={styles.dateValue}>
              {new Date(endDate).toLocaleDateString("en-GB")}
            </Text>
          </View>
        </TouchableOpacity>

        <Modal visible={showModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <CalendarPicker
                width={350}
                height={350}
                startFromMonday={true}
                allowRangeSelection={true}
                todayBackgroundColor="tomato"
                selectedDayColor="dodgerblue"
                selectedDayTextColor="#FFFFFF"
                onDateChange={onDateChange}
              />
            </View>
          </View>
        </Modal>

        <View style={styles.card}>
          {renderLabel()}

          <Dropdown
            style={[styles.dropdown, focusDrop && styles.dropdownFocused]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={data}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!focusDrop ? "Select type" : "..."}
            searchPlaceholder="Search..."
            value={accountType}
            onFocus={() => setFocusDrop(true)}
            onBlur={() => setFocusDrop(false)}
            onChange={item => {
              setIsDisabled(false)
              setAccountType(item.value)
              setFocusDrop(false)
            }}
          />

          <TouchableOpacity
            disabled={isDisabled || isLoading}
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              (isDisabled || isLoading) && styles.submitButtonDisabled,
            ]}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.lightScheme.primary} size="large" />
            ) : (
              <Text style={styles.btnlabel}>SUBMIT</Text>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView>
          <View style={styles.tableCard}>
            {tableData.length !== 0 ? (
              <>
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
                  onPress={printReceipt}
                  style={styles.printButton}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnlabel}>PRINT</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

export default ReportDay

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
  dateCard: {
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  dateValue: {
    marginTop: 4,
    fontSize: 15,
    color: "#0B1F2A",
    fontWeight: "800",
  },
  dateDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(148,163,184,0.25)",
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
  dropdown: {
    height: 50,
    borderColor: "rgba(0,129,129,0.18)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    marginTop: 10,
  },
  dropdownFocused: {
    borderColor: "#000",
  },
  submitButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#C9D3D8",
  },
  btnlabel: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 0.8,
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
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
  },
  table: {
    backgroundColor: "#FFFFFF",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11,31,42,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    elevation: 20,
  },
})
