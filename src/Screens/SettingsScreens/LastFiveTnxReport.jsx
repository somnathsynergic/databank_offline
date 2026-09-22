import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  PixelRatio,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
} from "react-native"
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import React, { useContext, useEffect, useState } from "react"
import { getDBConnection, getLastFiveTransactions } from "../../Database/db-service"
import { Row, Rows, Table } from "react-native-table-component"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS } from "../../Resources/colors"
import { AppStore } from "../../Context/AppContext"
import { Dropdown } from "react-native-element-dropdown"

export default function LastFiveTnxReport() {
  const { userId, bankId, branchCode, agentName, bankName, branchName, printOp } = useContext(AppStore)
  const [lastFiveData, setLastFiveData] = useState(() => [])
  const [focusDrop, setFocusDrop] = useState(() => false)
  const [showModal, setShowModal] = useState(() => false)
  const [accountType, setAccountType] = useState(() => "")
  const [isDisabled, setIsDisabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const tableHead = ["Date", "Acc No", "Name", "Dep Amt"]
  let tableData = lastFiveData

  const getLastFiveTnx = async () => {
    setIsLoading(true);
    setIsDisabled(true);
    try {
      const db = await getDBConnection();
      const data = await getLastFiveTransactions(db, {
        bank_id: bankId,
        branch_code: branchCode,
        agent_code: userId,
        account_type: accountType,
      });

      data.forEach((item, i) => {
        let row = [
          new Date(item.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }),
          item.account_number,
          item.account_holder_name,
          item.deposit_amount,
        ];
        tableData.push(...[row]);
      });

      if (tableData.length === 0) {
        ToastAndroid.showWithGravityAndOffset(
          "No data found!",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        );
      }
      setLastFiveData(tableData);
    } catch (error) {
      console.error("Error fetching last five transactions:", error);
    } finally {
      setIsLoading(false);
      setIsDisabled(false);
    }
  }

  const handleSubmit = () => {
    tableData = []
    getLastFiveTnx()
  }

  async function printReceipt() {
    if (printOp == 2) {
      try {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER)
        await BluetoothEscposPrinter.printText(bankName + '\r\n', { align: 'center' })
        await BluetoothEscposPrinter.printText(branchName + '\r\n', { align: 'center' })
        await BluetoothEscposPrinter.printColumn(
          [10, 2, 18],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['Date', ':', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          [10, 2, 18],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['Agent', ':', agentName.toString()],
          {},
        )
        await BluetoothEscposPrinter.printText('-------------------------------\n', {})
        await BluetoothEscposPrinter.printText('LAST FIVE TNX REPORT\n', { align: 'center' })
        await BluetoothEscposPrinter.printText(`TYPE: ${accountType == 'D' ? 'Daily' : accountType == 'L' ? 'Loan' : accountType == 'R' ? 'RD' : ''}\n`, { align: 'center' })
        await BluetoothEscposPrinter.printText('-------------------------------\n', {})
        await BluetoothEscposPrinter.printColumn(
          [13, 12, 7],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['Date', 'A/c No', 'Amt'],
          {},
        )
        await BluetoothEscposPrinter.printText('...............................\n', {})
        const copiedData = [...lastFiveData]
        copiedData.forEach(async item => {
          await BluetoothEscposPrinter.printColumn(
            [13, 12, 7],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
            [
              item[0] ? item[0].toString() : "",
              item[1] ? item[1].toString() : "",
              item[3] ? item[3].toString() : "",
            ],
            {},
          )
        })
        await BluetoothEscposPrinter.printText('-------------------------------\n', {})
        await BluetoothEscposPrinter.printText('---------------X---------------\n\n', {})
      } catch (e) {
        ToastAndroid.show('Printer not connected.', ToastAndroid.SHORT)
        console.log(e.message || 'ERROR')
      }
    } else if (printOp == 3) {
      try {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER)
        await BluetoothEscposPrinter.printText(bankName, { align: 'center' })
        await BluetoothEscposPrinter.printText('\r\n', {})
        await BluetoothEscposPrinter.printText(branchName, { align: 'center' })
        await BluetoothEscposPrinter.printText('\r\n', {})
        await BluetoothEscposPrinter.printColumn(
          [15, 2, 31],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['Date', ':', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          [15, 2, 31],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['Agent', ':', agentName.toString()],
          {},
        )
        await BluetoothEscposPrinter.printText('------------------------------------------------\n', {})
        await BluetoothEscposPrinter.printText('LAST FIVE TNX REPORT\r\n', { align: 'center' })
        await BluetoothEscposPrinter.printText(`TYPE: ${accountType == 'D' ? 'Daily' : accountType == 'L' ? 'Loan' : accountType == 'R' ? 'RD' : ''}\r\n`, { align: 'center' })
        await BluetoothEscposPrinter.printText('\r', {})
        await BluetoothEscposPrinter.printText('------------------------------------------------', {})
        await BluetoothEscposPrinter.printText('\r\n', {})
        await BluetoothEscposPrinter.printColumn(
          [13, 25, 10],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['Date', 'A/c No', 'Amt'],
          {},
        )
        await BluetoothEscposPrinter.printText('................................................\n', {})
        const copiedData = [...lastFiveData]
        copiedData.forEach(async item => {
          await BluetoothEscposPrinter.printColumn(
            [13, 25, 10],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
            [
              item[0] ? item[0].toString() : "",
              item[1] ? item[1].toString() : "",
              item[3] ? item[3].toString() : "",
            ],
            {},
          )
        })
        await BluetoothEscposPrinter.printText('------------------------------------------------\n', {})
        await BluetoothEscposPrinter.printText('--------------------X--------------------------', {})
        await BluetoothEscposPrinter.printText('\r\n', {})
      } catch (e) {
        ToastAndroid.show('Printer not connected.', ToastAndroid.SHORT)
        console.log(e.message || 'ERROR')
      }
    } else {
      ToastAndroid.show('Invalid printer option selected.', ToastAndroid.SHORT)
    }
  }
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
  //   useEffect(() => {
  //     tableData = []
  //     getLastFiveTnx()
  //   }, [])

  return (
    // <View style={{ flex: 1 }}>
    //   <CustomHeader />
    //   <View
    //     style={{
    //       flex: 4,
    //       padding: 10,
    //       backgroundColor: COLORS.lightScheme.background,
    //       margin: 20,
    //       borderRadius: 10,
    //     }}>
    //     <Text style={styles.todayCollection}>Last Five Transactions</Text>
    //     <View style={styles.dropdownContainer}>
    //       {renderLabel()}
    //       <Dropdown
    //         style={[styles.dropdown, focusDrop && { borderColor: "blue" }]}
    //         placeholderStyle={styles.placeholderStyle}
    //         selectedTextStyle={styles.selectedTextStyle}
    //         inputSearchStyle={styles.inputSearchStyle}
    //         iconStyle={styles.iconStyle}
    //         data={data}
    //         search
    //         maxHeight={300}
    //         labelField="label"
    //         valueField="value"
    //         placeholder={!focusDrop ? "Select type" : "..."}
    //         searchPlaceholder="Search..."
    //         value={accountType}
    //         onFocus={() => setFocusDrop(true)}
    //         onBlur={() => setFocusDrop(false)}
    //         onChange={item => {
    //           setIsDisabled(false)

    //           setAccountType(item.value)
    //           setFocusDrop(false)
    //         }}
    //         // renderLeftIcon={() => (
    //         //   <AntDesign
    //         //     style={styles.icon}
    //         //     color={isFocus ? 'blue' : 'black'}
    //         //     name="Safety"
    //         //     size={20}
    //         //   />
    //         // )}
    //       />
    //     </View>
    //     <View>
    //       <TouchableOpacity
    //         disabled={isDisabled || isLoading}
    //         onPress={() => handleSubmit()}
    //         style={isDisabled ? styles.disabledContainer : styles.dateButton}>
    //         {isLoading ? (
    //           <ActivityIndicator
    //             color={COLORS.lightScheme.primary}
    //             size={"large"}></ActivityIndicator>
    //         ) : (
    //           <Text style={styles.btnlabel}>SUBMIT</Text>
    //         )}
    //       </TouchableOpacity>
    //     </View>

    //     <ScrollView>
    //       {tableData.length != 0 && (
    //         <Table
    //           borderStyle={{
    //             borderWidth: 2,
    //             borderColor: COLORS.lightScheme.secondary,
    //             borderRadius: 10,
    //           }}
    //           style={{ backgroundColor: COLORS.lightScheme.background }}>
    //           <Row data={tableHead} textStyle={styles.head} />
    //           <Rows data={tableData} textStyle={styles.text} />
    //         </Table>
    //       )}
    //     </ScrollView>
    //     {/* <View>
    //       <TouchableOpacity
    //         onPress={() => printReceipt()}
    //         style={styles.dateButton}>
    //         <Text>Print</Text>
    //       </TouchableOpacity>
    //     </View> */}
    //   </View>
    // </View>

    <View style={styles.root}>
      <CustomHeader />

      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroSmall}>Reports</Text>
          <Text style={styles.heroTitle}>Last Five Transactions</Text>
          <Text style={styles.heroSub}>Select type and view recent activity</Text>
        </View>

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
            onPress={() => handleSubmit()}
            style={[
              styles.submitButton,
              (isDisabled || isLoading) && styles.submitButtonDisabled,
            ]}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <Text style={styles.btnlabel}>SUBMIT</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView>
          <View style={styles.tableCard}>
            {tableData.length !== 0 ? (
              <>
                <Table borderStyle={styles.tableBorder} style={styles.table}>
                  <Row data={tableHead} textStyle={styles.head} />
                  <Rows data={tableData} textStyle={styles.text} />
                </Table>

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

// const styles = StyleSheet.create({
//   dateWrapper: {
//     flex: 1,
//     justifyContent: "space-evenly",
//     alignItems: "center",
//     flexDirection: "row",
//     margin: 20,
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
//   footerText: {
//     fontSize: 15,
//     fontWeight: "600",
//   },
//   dropdownContainer: {
//     backgroundColor: "white",
//     padding: 16,
//   },
//   dropdown: {
//     height: 50,
//     borderColor: "gray",
//     borderWidth: 0.5,
//     borderRadius: 8,
//     paddingHorizontal: 8,
//   },
//   icon: {
//     marginRight: 5,
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
//   btnlabel: {
//     color: "white",
//     fontWeight: "bold",
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
    borderColor: "#0B1F2A",
  },
  submitButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#0B1F2A",
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
    borderWidth: 2,
    borderColor: "#0B1F2A",
    borderRadius: 10,
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
  printButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#0B1F2A",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderStyle: { fontSize: 16 },
  selectedTextStyle: { fontSize: 16 },
  iconStyle: { width: 20, height: 20 },
  inputSearchStyle: { height: 40, fontSize: 16 },
});
