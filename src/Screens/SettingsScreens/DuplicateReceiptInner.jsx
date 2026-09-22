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
import AlertModal from "../../Components/AlertModal"
import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import { AppStore } from "../../Context/AppContext"
import CustomHeader from "../../Components/CustomHeader"
import { COLORS } from "../../Resources/colors"
import { Table, Rows, Row, Col } from "react-native-table-component"
import axios from "axios"
import CalendarPicker from "react-native-calendar-picker"
import { address } from "../../Routes/addresses"
import { icon } from "../../Resources/Icons"
import { getDBConnection, getDuplicateReceiptsFromDB, getLatestTransactionDateByAccount } from "../../Database/db-service"

const DuplicateReceiptInner = ({ route }) => {
  const { item } = route.params

  const {
    userId,
    bankId,
    branchCode,
    bankName,
    branchName,
    agentName,
    todayDateFromServer,
    printOp,
  } = useContext(AppStore)

  const [duplicateReceipts, setDuplicateReceipts] = useState(() => [])

  const [loading, setLoading] = useState(() => true)
  const [alertInfo, setAlertInfo] = useState({ visible: false, title: "", message: "", onConfirm: () => { }, onCancel: () => { } })

  const tableHead = ["Date", "Rcpt No", "Dep Amt", "Print"]
  let tableData = duplicateReceipts

  // const [lastTnxDate, setLastTnxDate] = useState(() => "")

  const getDuplicateReceipts = async () => {
    setLoading(true);
    try {
      const db = await getDBConnection();
      const recent = await getDuplicateReceiptsFromDB(db, {
        bank_id: bankId,
        branch_code: branchCode,
        agent_code: userId,
        account_number: item?.account_number,
        account_type: item?.product_code[0],
      });
      console.log('response', recent, {
        bank_id: bankId,
        branch_code: branchCode,
        agent_code: userId,
        account_number: item?.account_number,
        account_type: item?.product_code[0],
      })
      recent.forEach((rec, i) => {
        let rowArr = [
          new Date(rec?.collected_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          }) + ", " +
          new Date(rec?.collected_at).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          rec.txn_no,
          rec.amount,
          <TouchableOpacity
            onPress={() => {
              setAlertInfo({
                visible: true,
                title: "Print Duplicate",
                message: "Are you sure you want to Print?",
                onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })),
                onConfirm: async () => {
                  await getLastTnxDate(rec.receipt_no, rec.account_number, rec.acc_type);
                  await printReceipt(rec);
                  setAlertInfo(prev => ({ ...prev, visible: false }));
                },
              });
            }}
            style={styles.dateButton}
          >
            {icon.printer(COLORS.lightScheme.primary, 30)}
          </TouchableOpacity>,
        ];
        tableData.push(...[rowArr]);
      });
      if (tableData.length == 0) {
        ToastAndroid.showWithGravityAndOffset(
          "No data found!",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        );
      }
      setDuplicateReceipts(tableData);
      setLoading(false);
    } catch (dbErr) {
      console.error("Error fetching local duplicate receipts", dbErr);
      ToastAndroid.showWithGravityAndOffset(
        "Error loading data offline",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        25,
        50,
      );
      setLoading(false);
    }
  }

  let prevTnxDate = ""

  const getLastTnxDate = async (rcptNo, accountNumber, accType) => {
    // Offline fetch of the most recent transaction date for the account
    try {
      const db = await getDBConnection();
      const latestDate = await getLatestTransactionDateByAccount(db, accountNumber);
      // The latest date may be the same as the current receipt; callers handle display.
      prevTnxDate = latestDate || "";
    } catch (err) {
      console.error("Error fetching last transaction date offline", err);
    }
  };

  async function printReceipt(item) {
    console.log(item);
    // Fetch previous transaction date for this receipt
    await getLastTnxDate(item?.txn_no, item?.acc_no, item?.acc_type);
    if (printOp == 2) {
      try {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(bankName + '\r\n', { align: "center" })
        await BluetoothEscposPrinter.printText(branchName + '\r\n', { align: "center" })

        await BluetoothEscposPrinter.printText("DUPLICATE RECEIPT\n", {
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
              new Date(item?.collected_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              }) +
              ", " +
              new Date(item?.collected_at).toLocaleTimeString("en-GB", {
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
          ["RCPT NO", ":", item?.txn_no.toString().slice(-6)],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ACC NO", ":", item?.acc_no],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["NAME", ":", item?.customer_name],
          {},
        )

        let currBal = item?.acc_type == "L" ? item?.current_balance + item?.amount : item?.current_balance - item?.amount;

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            item?.acc_type == "L" ? "PREV BAL" : "OPEN BAL",
            ":",
            currBal.toString(),
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
          ["COLL AMT", ":", item?.amount.toString()],
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
            item?.acc_type == "L" ? "CURR BAL" : "CLOSE BAL",
            ":",
            Number(item?.current_balance).toFixed(2).toString(),
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
            item?.prev_coll_dt
              ? new Date(item.prev_coll_dt)
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

        if (item?.acc_type == "L") {
          await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "AGENT CODE",
              ":",
              userId.toString(),
            ],
            {},
          )
        } else {
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
        }

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
        await BluetoothEscposPrinter.printText(bankName + '\r\n', { align: "center" })
        await BluetoothEscposPrinter.printText(branchName + '\r\n', { align: "center" })

        await BluetoothEscposPrinter.printText("DUPLICATE RECEIPT\n", {
          align: "center",
        })

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
              new Date(item?.collected_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              }) +
              ", " +
              new Date(item?.collected_at).toLocaleTimeString("en-GB", {
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
          ["RCPT NO", ":", item?.receipt_no.toString().slice(-6)],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ACC NO", ":", item?.account_number],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["NAME", ":", item?.account_holder_name],
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
            item?.acc_type == "L" ? "PREV BAL" : "OPEN BAL",
            ":",
            item?.opening_bal.toString(),
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
          ["COLL AMT", ":", item?.deposit_amount.toString()],
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
            item?.acc_type == "L" ? "CURR BAL" : "CLOSE BAL",
            ":",
            Number(item?.closing_bal).toFixed(2).toString(),
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
            item?.prev_coll_dt
              ? new Date(item.prev_coll_dt)
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

        // console.log(item?.account_type == "L", item?.account_type, '-----------------------')

        if (item?.acc_type == "L") {
          await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "AGENT CODE",
              ":",
              userId.toString(),
            ],
            {},
          )
        } else {
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
        }

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

  useEffect(() => {
    tableData = []
    getDuplicateReceipts()
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <CustomHeader />
      <View
        style={{
          flex: 4,
          padding: 10,
          backgroundColor: COLORS.lightScheme.background,
          margin: 20,
          borderRadius: 10,
        }}>
        <Text style={styles.todayCollection}>Duplicate Receipts</Text>
        <ScrollView>
          {tableData.length != 0 && (
            <Table
              borderStyle={{
                borderWidth: 2,
                borderColor: COLORS.lightScheme.secondary,
                borderRadius: 10,
                fontSize: 16,
              }}
              style={{ backgroundColor: COLORS.lightScheme.background }}>
              <Row data={tableHead} textStyle={styles.head} />

              {loading ? (
                <ActivityIndicator animating={true} size={"large"} />
              ) : (
                <Rows data={tableData} textStyle={styles.text} />
              )}
            </Table>
          )}
        </ScrollView>
      </View>
      <AlertModal
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={alertInfo.onConfirm}
        onCancel={alertInfo.onCancel}
      />
    </View>
  )
}
export default DuplicateReceiptInner

const styles = StyleSheet.create({
  dateWrapper: {
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
    flexDirection: "row",
    margin: 20,
  },
  dateButton: {
    width: "40%",
    height: 40,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "white",
    margin: 15,
    borderRadius: 10,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    margin: 6,
    color: COLORS.lightScheme.onBackground,
    fontWeight: "400",
    fontSize: 16,
  },
  accountDetailsStyle: {
    margin: 6,
    color: COLORS.lightScheme.primary,
    fontWeight: "bold",
    fontSize: 20,
  },
  head: {
    margin: 6,
    color: COLORS.lightScheme.onBackground,
    fontWeight: "900",
    fontSize: 16,
  },
  todayCollection: {
    backgroundColor: COLORS.lightScheme.primary,
    color: COLORS.lightScheme.onPrimary,
    fontWeight: "600",
    textAlign: "center",
    fontSize: PixelRatio.roundToNearestPixel(22),
    padding: PixelRatio.roundToNearestPixel(5),
    marginBottom: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
})
