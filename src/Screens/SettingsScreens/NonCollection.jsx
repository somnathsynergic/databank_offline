import { useContext, useState } from "react"
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import {
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ToastAndroid,
} from "react-native"
import { AppStore } from "../../Context/AppContext"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS } from "../../Resources/colors"
import { Table, Rows, Row } from "react-native-table-component"
import { getNonCollectionReport as fetchNonCollectionReport, getDBConnection } from "../../Database/db-service"
import { useEffect } from "react"
import { ActivityIndicator } from "react-native"
import { Dropdown } from "react-native-element-dropdown"

const NonCollection = () => {
  const { userId, bankId, branchCode, agentName, bankName, branchName, printOp } = useContext(AppStore)
  const [accountType, setAccountType] = useState(() => "")
  const [focusDrop, setFocusDrop] = useState(() => false)
  const [nonCollectionReport, setNonCollectionReport] = useState(() => [])
  const [isDisabled, setIsDisabled] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  // const [loading, setLoading] = useState(() => true)
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
  const tableHead = ["Sl No.", "A/c No.", "Name", "Phone"]
  let tableData = nonCollectionReport

  const getNonCollectionReport = async () => {
    setIsLoading(true)
    setIsDisabled(true)
    try {
      const db = await getDBConnection();
      const data = await fetchNonCollectionReport(db, { bank_id: bankId, branch_code: branchCode, agent_code: userId, account_type: accountType, dateTime: new Date() });
      setIsLoading(false);
      data.forEach((item, i) => {
        let rowArr = [
          i + 1,
          item.account_number,
          item.customer_name,
          item.mobile_no,
        ];
        tableData.push(...[rowArr]);
      });
      if (tableData.length == 0) {
        setIsDisabled(false);
        ToastAndroid.showWithGravityAndOffset(
          "No data found!",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        );
      }
      setNonCollectionReport(tableData);
      setIsDisabled(false);
    } catch (err) {
      setIsLoading(false);
      setIsDisabled(false);
      ToastAndroid.showWithGravityAndOffset(
        "Error occurred in the server",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      );
      console.log(err);
    }
  }

  useEffect(() => {
    tableData = []
    // getNonCollectionReport()
  }, [])
  const handleSubmit = () => {
    tableData = []
    getNonCollectionReport()
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
        await BluetoothEscposPrinter.printText('NON COLLECTION REPORT\n', { align: 'center' })
        await BluetoothEscposPrinter.printText(`TYPE: ${accountType == 'D' ? 'Daily' : accountType == 'L' ? 'Loan' : accountType == 'R' ? 'RD' : ''}\n`, { align: 'center' })
        await BluetoothEscposPrinter.printText('-------------------------------\n', {})
        await BluetoothEscposPrinter.printColumn(
          [10, 10, 10],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['A/c No', 'Name', 'Phone'],
          {},
        )
        await BluetoothEscposPrinter.printText('...............................\n', {})
        const copiedData = [...nonCollectionReport]
        copiedData.forEach(async item => {
          await BluetoothEscposPrinter.printColumn(
            [10, 10, 10],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
            [
              item[1] ? item[1].toString() : "",
              item[2] ? item[2].toString().slice(0, 10) : "",
              item[3] ? item[3].toString() : "",
            ],
            {},
          )
        })
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
        await BluetoothEscposPrinter.printText('NON COLLECTION REPORT\r\n', { align: 'center' })
        await BluetoothEscposPrinter.printText(`TYPE: ${accountType == 'D' ? 'Daily' : accountType == 'L' ? 'Loan' : accountType == 'R' ? 'RD' : ''}\r\n`, { align: 'center' })
        await BluetoothEscposPrinter.printText('\r', {})
        await BluetoothEscposPrinter.printText('------------------------------------------------', {})
        await BluetoothEscposPrinter.printText('\r\n', {})
        await BluetoothEscposPrinter.printColumn(
          [13, 20, 15],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['A/c No', 'Name', 'Phone'],
          {},
        )
        await BluetoothEscposPrinter.printText('................................................\n', {})
        const copiedData = [...nonCollectionReport]
        copiedData.forEach(async item => {
          await BluetoothEscposPrinter.printColumn(
            [13, 20, 15],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
            [
              item[1] ? item[1].toString() : "",
              item[2] ? item[2].toString().slice(0, 18) : "",
              item[3] ? item[3].toString() : "",
            ],
            {},
          )
        })
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
  // console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<", tableData)
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
    //     <Text style={styles.todayCollection}>Non Collection Report</Text>
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

    //           {/* {loading ? (
    //             ''
    //             <ActivityIndicator animating={true} />
    //           ) : (
    //             <Rows data={tableData} textStyle={styles.text} />
    //           )

    //           } */}
    //         </Table>
    //       )}
    //     </ScrollView>
    //   </View>
    // </View>
    <View style={styles.root}>
      <CustomHeader />

      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroSmall}>Reports</Text>
          <Text style={styles.heroTitle}>Non Collection Report</Text>
          <Text style={styles.heroSub}>Select type and generate report</Text>
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
                <Table
                  borderStyle={styles.tableBorder}
                  style={styles.table}
                >
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

export default NonCollection

// const styles = StyleSheet.create({
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
//   btnlabel: {
//     color: "white",
//     fontWeight: "bold",
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
  dropdownContainer: {
    backgroundColor: "white",
    padding: 16,
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
