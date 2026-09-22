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
  Modal,
  ActivityIndicator,
} from "react-native"
// import DateTimePickerModal from "react-native-modal-datetime-picker"
import { AppStore } from "../../Context/AppContext"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS, colors } from "../../Resources/colors"
import { Table, Rows, Row } from "react-native-table-component"
import { getNoWiseReport, getDBConnection } from "../../Database/db-service"
import DropdownComponent from "../../Components/DropdownComponent"
// import DateRangePicker from '../../Components/DateRangePicker'
// import Calandar from "react-native-calendars/src/calendar"
// import Calendar from "react-native-calendar-range-picker"
import CalendarPicker from "react-native-calendar-picker"
import { Dropdown } from "react-native-element-dropdown"
// import { address } from "../../Routes/addresses" // removed
import React from 'react'

function ReportNo() {
  const { userId, bankId, branchCode, agentName, bankName, branchName, printOp } = useContext(AppStore)

  // const [startingDate, setStartingDate] = useState(() => "From Date") // date in yyyy-mm-dd
  // const [endingDate, setEndingDate] = useState(() => "To Date") // date in yyyy-mm-dd

  // const [isStartingDatePickerVisible, setIsStartingDatePickerVisible] = useState(() => false)
  // const [isEndingDatePickerVisible, setIsEndingDatePickerVisible] = useState(() => false)
  // const [isDisabled,setIsDisabled] = useState(true)

  const [typeWiseReportArray, setTypeWiseReportArray] = useState(() => [])
  const [accountType, setAccountType] = useState(() => "")
  const [isLoading, setIsLoading] = useState(false)

  const [showModal, setShowModal] = useState(() => false)
  const [selectedStartDate, setSelectedStartDate] = useState(() => new Date())
  const [selectedEndDate, setSelectedEndDate] = useState(() => new Date())
  const [isDisabled, setIsDisabled] = useState(true)

  const [focusDrop, setFocusDrop] = useState(() => false)

  const [totalAmount, setTotalAmount] = useState(() => 0)

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

  // const showStartingDatePicker = () => {
  //   setIsStartingDatePickerVisible(true)
  // }

  // const showEndingDatePicker = () => {
  //   setIsEndingDatePickerVisible(true)
  // }

  // const hideStartingDatePicker = () => {
  //   setIsStartingDatePickerVisible(false)
  // }

  // const hideEndingDatePicker = () => {
  //   setIsEndingDatePickerVisible(false)
  // }

  // const handleConfirmPickedFromDate = date => {
  //   console.warn("PICKED DATE >>>>>>>>>>>", date)
  //   const modifiedFromDate = new Date(date).toISOString().slice(0, 10)
  //   setStartingDate(modifiedFromDate)
  //   hideStartingDatePicker()
  // }

  // const handleConfirmPickedToDate = date => {
  //   console.warn("PICKED DATE >>>>>>>>>>>", date)
  //   const modifiedToDate = new Date(date).toISOString().slice(0, 10)
  //   setEndingDate(modifiedToDate)
  //   hideEndingDatePicker()
  // }

  const data = [
    { label: "Daily", value: "D" },
    { label: "Loan", value: "L" },
    { label: "RD", value: "R" },
  ]

  const tableHead = ["Sl No.", "Date", "A/C Type", "A/c No.", "Name", "Amount"]
  let tableData = typeWiseReportArray

  const getReportsTypeScroll = async () => {
    setIsLoading(true)
    setIsDisabled(true)
    const db = await getDBConnection();
    const data = await getNoWiseReport(db, { bank_id: bankId, branch_code: branchCode, agent_code: userId, account_type: accountType, fromDate: startDate, toDate: endDate });
    let totalDepositedAmount = 0;
    data.forEach((item, i) => {
      let rowArr = [
        i + 1,
        new Date(item.date).toLocaleDateString("en-GB"),
        item.product_code,
        item.account_number,
        item.account_holder_name,
        item.deposit_amount,
      ];
      totalDepositedAmount += item.deposit_amount;
      tableData.push(...[rowArr]);
    });
    setTotalAmount(totalDepositedAmount);
    setTypeWiseReportArray(tableData);
    setIsLoading(false);
    setIsDisabled(false);
    if (tableData.length === 0) {
      ToastAndroid.showWithGravityAndOffset(
        "No data found!",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      );
    }
  }

  const handleSubmit = () => {
    tableData = []
    getReportsTypeScroll()
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
        await BluetoothEscposPrinter.printText('A/C NO. WISE REPORT\n', { align: 'center' })
        await BluetoothEscposPrinter.printText(
          "TYPE: " + (accountType == "D" ? "Daily" : accountType == "L" ? "Loan" : accountType == "R" ? "RD" : "") + "\n",
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText(
          `FROM: ${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}  TO: ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}`,
          { align: 'center' },
        )
        await BluetoothEscposPrinter.printText('\n-------------------------------\n', {})
        await BluetoothEscposPrinter.printColumn(
          [13, 12, 7],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['A/c No', 'Name', 'Amt'],
          {},
        )
        await BluetoothEscposPrinter.printText('...............................\n', {})
        const copiedData = [...typeWiseReportArray]
        copiedData.forEach(async item => {
          await BluetoothEscposPrinter.printColumn(
            [13, 12, 7],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
            [
              item[3] ? item[3].toString() : "",
              item[4] ? item[4].toString().slice(0, 10) : "",
              item[5] ? item[5].toString() : "",
            ],
            {},
          )
        })
        await BluetoothEscposPrinter.printText('-------------------------------\n', {})
        await BluetoothEscposPrinter.printText(`TOTAL: ${totalAmount}\r\n`, { align: 'center' })
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
        await BluetoothEscposPrinter.printText('A/C NO. WISE REPORT\r\n', { align: 'center' })
        await BluetoothEscposPrinter.printText(
          "TYPE: " + (accountType == "D" ? "Daily" : accountType == "L" ? "Loan" : accountType == "R" ? "RD" : "") + "\r\n",
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText(
          `FROM: ${new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}  TO: ${new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}`,
          { align: 'center' },
        )
        await BluetoothEscposPrinter.printText('\r', {})
        await BluetoothEscposPrinter.printText('------------------------------------------------', {})
        await BluetoothEscposPrinter.printText('\r\n', {})
        await BluetoothEscposPrinter.printColumn(
          [13, 25, 10],
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
          ['A/c No', 'Name', 'Amt'],
          {},
        )
        await BluetoothEscposPrinter.printText('................................................\n', {})
        const copiedData = [...typeWiseReportArray]
        copiedData.forEach(async item => {
          await BluetoothEscposPrinter.printColumn(
            [13, 25, 10],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
            [
              item[3] ? item[3].toString() : "",
              item[4] ? item[4].toString().slice(0, 24) : "",
              item[5] ? item[5].toString() : "",
            ],
            {},
          )
        })
        await BluetoothEscposPrinter.printText('------------------------------------------------\n', {})
        await BluetoothEscposPrinter.printText(`TOTAL: ${totalAmount}\r\n`, { align: 'center' })
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

  // console.log("###################", accountType)
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
    //     <Text style={styles.todayCollection}>No. Wise Report</Text>
    //     <View style={styles.dateWrapper}>
    //       {/* <TouchableOpacity onPress={() => showStartingDatePicker()} style={styles.dateButton}>
    //         <Text>{startingDate}</Text>
    //       </TouchableOpacity>
    //       <TouchableOpacity onPress={() => showEndingDatePicker()} style={styles.dateButton}>
    //         <Text>{endingDate}</Text>
    //       </TouchableOpacity>
    //       <DateTimePickerModal
    //         isVisible={isStartingDatePickerVisible}
    //         mode="date"
    //         onConfirm={handleConfirmPickedFromDate}
    //         onCancel={hideStartingDatePicker}
    //       />
    //       <DateTimePickerModal
    //         isVisible={isEndingDatePickerVisible}
    //         mode="date"
    //         onConfirm={handleConfirmPickedToDate}
    //         onCancel={hideEndingDatePicker}
    //       /> */}
    //       <TouchableOpacity
    //         onPress={() => setShowModal(true)}
    //         style={{
    //           justifyContent: "space-around",
    //           flexDirection: "row",
    //           backgroundColor: "white",
    //           borderColor: COLORS.lightScheme.primary,
    //           borderWidth: 1,
    //           padding: 10,
    //           margin: 10,
    //           borderRadius: 10,
    //           height: 40,
    //           width: "100%",
    //         }}>
    //         {/* <Text style={{color: "white"}}>Show Calendar</Text> */}
    //         <Text
    //           style={{
    //             fontSize: 15,
    //             fontWeight: 500,
    //             color: COLORS.lightScheme.primary,
    //             fontWeight: "bold",
    //           }}>
    //           From: {new Date(startDate).toLocaleDateString("en-GB")}
    //         </Text>
    //         <Text
    //           style={{
    //             fontSize: 15,
    //             fontWeight: 500,
    //             color: COLORS.lightScheme.primary,
    //             fontWeight: "bold",
    //           }}>
    //           To: {new Date(endDate).toLocaleDateString("en-GB")}
    //         </Text>
    //       </TouchableOpacity>
    //       <Modal visible={showModal} animationType="fade">
    //         <View
    //           style={{
    //             flex: 1,
    //             backgroundColor: "#FFFFFF",
    //             margin: 20,
    //           }}>
    //           <CalendarPicker
    //             width={350}
    //             height={350}
    //             startFromMonday={true}
    //             allowRangeSelection={true}
    //             todayBackgroundColor="tomato"
    //             selectedDayColor="dodgerblue"
    //             selectedDayTextColor="#FFFFFF"
    //             onDateChange={onDateChange}
    //           />
    //         </View>
    //       </Modal>
    //     </View>
    //     <View>
    //       {/* <View style={{justifyContent: "space-around", flexDirection: "row", backgroundColor: "coral", padding: 10, margin: 10, borderRadius: 10}}>
    //         <Text style={{ fontSize: 15, fontWeight: 500, color: COLORS.lightScheme.onPrimary, fontWeight: "bold" }}>From: {startDate}</Text>
    //         <Text style={{ fontSize: 15, fontWeight: 500, color: COLORS.lightScheme.onPrimary, fontWeight: "bold" }}>To: {endDate}</Text>
    //       </View> */}
    //       {/* <DropdownComponent
    //         data={data}
    //         onFocus={() => setFocusDrop(true)}
    //         onBlur={() => setFocusDrop(false)}
    //         onChangeDrop={(value) => {
    //           setAccountType(value)
    //           setFocusDrop(false)
    //         }}>
    //         Select Type
    //       </DropdownComponent> */}

    //       <View style={styles.dropdownContainer}>
    //         {renderLabel()}
    //         <Dropdown
    //           style={[styles.dropdown, focusDrop && { borderColor: "blue" }]}
    //           placeholderStyle={styles.placeholderStyle}
    //           selectedTextStyle={styles.selectedTextStyle}
    //           inputSearchStyle={styles.inputSearchStyle}
    //           iconStyle={styles.iconStyle}
    //           data={data}
    //           search
    //           maxHeight={300}
    //           labelField="label"
    //           valueField="value"
    //           placeholder={!focusDrop ? "Select type" : "..."}
    //           searchPlaceholder="Search..."
    //           value={accountType}
    //           onFocus={() => setFocusDrop(true)}
    //           onBlur={() => setFocusDrop(false)}
    //           onChange={item => {
    //             setIsDisabled(false)
    //             setAccountType(item.value)
    //             setFocusDrop(false)
    //           }}
    //           // renderLeftIcon={() => (
    //           //   <AntDesign
    //           //     style={styles.icon}
    //           //     color={isFocus ? 'blue' : 'black'}
    //           //     name="Safety"
    //           //     size={20}
    //           //   />
    //           // )}
    //         />
    //       </View>

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
    //       {/* {isLoading && <ActivityIndicator color={COLORS.lightScheme.primary} size={'large'}></ActivityIndicator>} */}
    //       {tableData.length != 0 && (
    //         <Table
    //           borderStyle={{
    //             borderWidth: 2,
    //             borderColor: COLORS.lightScheme.onTertiaryContainer,
    //             borderRadius: 10,

    //           }}
    //           style={{ backgroundColor: COLORS.lightScheme.onPrimary }}>
    //           <Row data={tableHead} textStyle={styles.head} />
    //           <Rows data={tableData} textStyle={styles.text} />
    //         </Table>
    //       )}
    //     </ScrollView>
    //     <Text>Total Amount: {totalAmount}</Text>
    //   </View>
    // </View>

    <View style={styles.root}>
      <CustomHeader />

      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroSmall}>Reports</Text>
          <Text style={styles.heroTitle}>Account No. Wise Report</Text>
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
              <ActivityIndicator color="#FFFFFF" size="large" />
            ) : (
              <Text style={styles.btnlabel}>Submit</Text>
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

                <View style={styles.totalCard}>
                  <Text style={styles.totalLabel}>Total Synced</Text>
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

export default ReportNo

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
//     margin: 9,
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
//   label: {
//     position: "absolute",
//     backgroundColor: "white",
//     left: 22,
//     top: 8,
//     zIndex: 999,
//     paddingHorizontal: 8,
//     fontSize: 14,
//   },
//   placeholderStyle: {
//     fontSize: 16,
//   },
//   selectedTextStyle: {
//     fontSize: 16,
//   },
//   iconStyle: {
//     width: 20,
//     height: 20,
//   },
//   inputSearchStyle: {
//     height: 40,
//     fontSize: 16,
//   },
//   submitBtnTxt: {
//     color: "white",
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
    backgroundColor: "rgba(11,31,42,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    elevation: 8,
  },
  placeholderStyle: { fontSize: 16 },
  selectedTextStyle: { fontSize: 16 },
  iconStyle: { width: 20, height: 20 },
  inputSearchStyle: { height: 40, fontSize: 16 },
});
