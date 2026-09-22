// EndWorkScreen.jsx - cleaned version
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ToastAndroid,
  PixelRatio,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useCallback, useContext, useEffect, useState } from "react";
import CustomHeader from "../../Components/CustomHeader";
import { COLORS, colors } from "../../Resources/colors";
import ButtonComponent from "../../Components/ButtonComponent";
import MpinComponent from "../../Components/MpinComponent";
import { AppStore } from "../../Context/AppContext";
import axios from "axios";
import { REACT_APP_BASE_URL } from "../../Config/config";
import { address } from "../../Routes/addresses";
import { StackActions, useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator } from "react-native";
import { getDBConnection, getPendingSyncQueue, markTransactionSynced, removeFromSyncQueue, markTransactionSyncedFallback, getSyncCounts, reconcileOrphanSyncs, clearSyncQueue, getTotalCollectionAmount, saveLastSynced, getLastSyncedFromAgent } from '../../Database/db-service';
import AlertModal from "../../Components/AlertModal";
import { SCREEN_HEIGHT } from "react-native-normalize";

const EndWorkScreen = ({ navigation }) => {


  // ----- State -----------------------------------------------------------
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [endScreenPassword, setEndScreenPassword] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [processed_coll_count, setProcessedCollCount] = useState(0)
  const [received_coll_count, setReceivedCollCount] = useState(0)
  // New state for sync status toast
  const [syncCount, setSyncCount] = useState(0);
  const [sendStatus, setSendStatus] = useState(false)
  const [syncStatusVisible, setSyncStatusVisible] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [alertInfo, setAlertInfo] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => { },
    onCancel: () => { },
    showCancel: false,
    confirmText: "OK",
    cancelText: "",
  });

  // ----- Helpers ----------------------------------------------------------
  const loadSyncCounts = async () => {
    try {
      const db = await getDBConnection();
      const syncCounts = await getSyncCounts(db);
      setPendingCount(syncCounts.pending);
    } catch (e) {
      console.error("Failed to load sync counts in End Work", e);
    }
  };

  const showAlert = (title, message) => {
    setAlertInfo({
      visible: true,
      title,
      message,
      onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })),
      onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })),
    });
  };

  // ----- Context ----------------------------------------------------------
  const {
    userId,
    agentName,
    passcode,
    deviceId,
    bankId,
    branchCode,
    totalCollection,
    receiptNumber,
    endFlag,
    maximumAmount,
    agentTransNo,
    transDt,
    setTotalCollection,
    allowCollectionDays,
    login,
    getTotalDepositAmount,
    isOffline,
    setLastSyncedDate,
    logout,
  } = useContext(AppStore);

  const tableData = [
    ["Agent Code", userId],
    ["Agent Name", agentName],
    ["Branch Code", branchCode],
    ["Allowed Days", allowCollectionDays],
    ["Send Date", transDt.toISOString().slice(0, 10)],
    ["Max Collection", maximumAmount],
    ["Total Collection", totalCollection],
    ["Remaining Collection", maximumAmount - totalCollection],
  ];

  // ----- Sync logic -------------------------------------------------------
  const syncPendingData = async () => {
    if (isOffline) return false;
    try {
      const db = await getDBConnection();
      const queue = await getPendingSyncQueue(db);
      if (queue.length === 0) return true;

      for (const item of queue) {
        try {
          const payload = JSON.parse(item.payload);
          const serverPayload = { ...payload };
          delete serverPayload.local_txn_no;

          const response = await axios({
            method: item.method,
            url: item.endpoint,
            data: serverPayload,
            headers: { Accept: "application/json" },
          });

          if (response.data.status) {
            let dbResult = null;
            if (payload.local_txn_no) {
              dbResult = await markTransactionSynced(db, payload.local_txn_no);
            } else if (payload.account_number && payload.transaction_date) {
              dbResult = await markTransactionSyncedFallback(db, payload.account_number, payload.transaction_date);
            }
            if (dbResult && dbResult.rowsAffected > 0) {
              await removeFromSyncQueue(db, item.id);
            } else {
              return false;
            }
          } else {
            return false;
          }
        } catch (itemErr) {
          console.error(`Failed to sync item ${item.id} during End Work:`, itemErr.message);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("Critical error during sync in End Work:", error);
      return false;
    }
  };

  const handleSyncNowDemo = async () => {
    if (isOffline) {
      showAlert("Network Required", "Please connect to the internet to synchronize your data.");
      return;
    }
    setIsSyncing(true);
    try {
      const db = await getDBConnection();
      const queue = await getPendingSyncQueue(db);
      // if (queue.length === 0) {
      //   if (pendingCount > 0) {
      //     const fixed = await reconcileOrphanSyncs(db);
      //     if (fixed > 0) {
      //       await loadData();
      //       showAlert("Sync Complete", `Everything is already synchronized. Reconciled ${fixed} history status badges.`);
      //     } else {
      //       showAlert("No Data", "Everything is already synchronized.");
      //     }
      //   } else {
      //     showAlert("No Data", "Everything is already synchronized.");
      //   }
      //   setIsSyncing(false);
      //   return;
      // }

      // // Build payload for RECEIVE_COLLECTION
      // const arr = [];
      // for (const item of queue) {
      //   arr.push(JSON.parse(item.payload));
      // }
      // const obj = {
      //   user_id: userId,
      //   password: passcode,
      //   device_id: deviceId,
      //   bank_id: bankId,
      //   branch_code: branchCode,
      //   agent_code: userId,
      //   coll_flag: "Y",
      //   agent_trans_no: agentTransNo,
      //   date_time: new Date(),
      //   collection_dtls: arr,
      //   total_collection_count: arr.length,
      // };

      // await axios.post(address.RECEIVE_COLLECTION, obj, {
      //   headers: { Accept: "application/json" },
      // });
      // After successful collection, fetch sync status
      await loadSyncStatus();
    } catch (error) {
      console.error("Critical error during sync sync:", error);
      showAlert("Sync Error", "An error occurred during synchronization. Please try again later.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch sync status after collection
  const loadSyncStatus = async () => {
    try {
      const payload = {
        bank_id: bankId,
        branch_code: branchCode,
        agent_code: userId,
        agent_trans_no: agentTransNo,
      };
      const response = await axios.post(address.CHECK_OFFLINE_SYNC_STATUS, payload, {
        headers: { Accept: "application/json" },
      });
      console.log(response.data)
      if (response.data) {
        setSyncCount(response.data.success.sync_count);
        setSyncStatusVisible(true);
      }
    } catch (err) {
      console.error('Failed to fetch sync status', err);
    }
  };

  // ----- End collection ---------------------------------------------------
  const endCollection = async () => {
    setLoading(true);
    const db = await getDBConnection();
    const queue = await getPendingSyncQueue(db);
    setIsSyncing(true);
    // if (queue.length === 0) {
    //   if (pendingCount > 0) {
    //     const fixed = await reconcileOrphanSyncs(db);
    //     if (fixed > 0) {
    //       await loadData();
    //       showAlert("Sync Complete", `Everything is already synchronized. Reconciled ${fixed} history status badges.`);
    //     } else {
    //       showAlert("No Data", "Everything is already synchronized.");
    //     }
    //   } else {
    //     showAlert("No Data", "Everything is already synchronized.");
    //   }
    //   setIsSyncing(false);
    //   return;
    // }

    const arr = [];
    if (queue.length > 0) {
      for (const item of queue) {
        arr.push(JSON.parse(item.payload));
      }
    }

    const obj = {
      user_id: userId,
      password: endScreenPassword,
      device_id: deviceId,
      bank_id: bankId,
      branch_code: branchCode,
      agent_code: userId,
      coll_flag: "Y",
      agent_trans_no: agentTransNo,
      date_time: new Date(),
      collection_dtls: arr,
      total_collection_count: arr.length,
    };

    await axios
      .post(address.RECEIVE_COLLECTION, obj, {
        headers: { Accept: "application/json" },
      })
      .then(async res => {
        console.log(res.data)
        setLoading(false);
        const txnCount = arr.length;
        // showAlert('Transactions Sent', `${txnCount} transactions sent successfully!`);
        if (res.data.status) {
          setProcessedCollCount(res.data.processed_coll_count);
          setReceivedCollCount(res.data.received_coll_count);
          // Persist the sync date_time to app_state so it survives next login flush
          try {
            const syncDb = await getDBConnection();
            await saveLastSynced(syncDb, obj.date_time.toISOString());
            // Also ensure the value is stored on the agent record
            const agentSynced = await getLastSyncedFromAgent(syncDb, userId);
            console.log('Last synced from agent after end work:', agentSynced);
            // Update context state so Home reflects instantly
            setLastSyncedDate(obj.date_time.toISOString());
          } catch (saveErr) {
            console.error('Failed to persist last_synced:', saveErr);
          }
          if (res.data.processed_coll_count === res.data.received_coll_count) {
            setShowSyncSuccess(true);
            setIsSyncing(false);
            setAlertInfo({
              visible: true,
              title: "Success",
              message: `${res.data.received_coll_count} transactions of ${res.data.processed_coll_count} sent successfully!`,
              onConfirm: () => {
                setAlertInfo(prev => ({ ...prev, visible: false }));
                logout();
              },
              onCancel: () => {
                setAlertInfo(prev => ({ ...prev, visible: false }));
                logout();
              },
              showCancel: false,
              confirmText: "OK",
              cancelText: "",
            });
          } else {
            setAlertInfo({
              visible: true,
              title: "Success",
              message: `${res.data.received_coll_count} transactions of ${res.data.processed_coll_count} sent successfully!`,
              onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })),
              onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })),
              showCancel: false,
              confirmText: "OK",
              cancelText: "",
            });
          }
          setIsButtonEnabled(!isButtonEnabled);
          // loadSyncStatus();
          // await clearSyncQueue(db);
          // Clear collection data after successful sync
          // await db.executeSql(`INSERT OR REPLACE INTO td_account_dtls_backup SELECT * FROM td_account_dtls`);
          // await db.executeSql(`INSERT OR REPLACE INTO td_collection_backup SELECT * FROM td_collection`);
          // await db.executeSql(`INSERT OR REPLACE INTO td_collection_dtls_backup SELECT * FROM td_collection_dtls`);
          // await db.executeSql('DELETE FROM td_collection;');
          // await db.executeSql('DELETE FROM td_collection_dtls;');
          // await login(true);
          // onRefresh()

        }
        else {
          setIsSyncing(false)
          setAlertInfo({
            visible: true,
            title: "Something went wrong!",
            message: res.data.error,
            onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })),
            onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })),
            showCancel: false,
            confirmText: "OK",
            cancelText: "",
          });
          setEndScreenPassword("");
        }
      })
      .catch(err => {
        setLoading(false);
        alert("Some error while ending work.");
        ToastAndroid.showWithGravityAndOffset(
          "Some error while ending work.",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          25,
          50,
        );
      });
  };

  const handleEndWorkButton = () => {
    // console.log("hello")
    try {
      // if (endScreenPassword === passcode) {
      // console.log(endScreenPassword, passcode)
      endCollection();
      setLoading(false)
      setEndScreenPassword("");
      // } 
      // else {
      //   console.log(endScreenPassword, passcode)
      //   setAlertInfo({
      //     visible: true,
      //     title: "Invalid Password",
      //     message: "The password you entered is incorrect.",
      //     onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })),
      //     onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })),
      //     showCancel: false,
      //     confirmText: "OK",
      //     cancelText: "",
      //   });
      //   setEndScreenPassword("");
      // }
    } catch (error) {
      console.log(error);
      setEndScreenPassword("");
    }
  };

  // Fetch total collection from local DB for offline mode
  const fetchTotalCollection = async () => {
    var sum = 0
    // if (isOffline) {
    try {
      const db = await getDBConnection();
      // Fetch raw collection rows for debugging
      const [colResults] = await db.executeSql('SELECT * FROM td_collection;');
      const collections = [];
      for (let i = 0; i < colResults.rows.length; i++) {
        collections.push(colResults.rows.item(i));
        sum += colResults.rows.item(i).amount;
      }
      console.log('td_collection rows:', collections);
      const [dtlsResults] = await db.executeSql('SELECT * FROM td_collection_dtls;');
      const collectionDtls = [];
      for (let i = 0; i < dtlsResults.rows.length; i++) {
        collectionDtls.push(dtlsResults.rows.item(i));
        sum += dtlsResults.rows.item(i).amount;

      }
      console.log('td_collection_dtls rows:', collectionDtls);
      // const total = await getTotalCollectionAmount(db);
      console.log('total', sum);
      setTotalCollection(sum);
    } catch (err) {
      console.error('Failed to fetch total collection on page load:', err);
    }
    // }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    login(true);
    fetchTotalCollection();

    // getTotalDepositAmount();
    setTimeout(() => {
      setRefreshing(false);
      login(true);
    }, 2000);
  }, []);

  useEffect(() => {
    const init = async () => {
      onRefresh();
      // await login(true);
      // await fetchTotalCollection();
      // console.log('isLoading', isLoading)
      // setLoading(false)
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      // getTotalDepositAmount();
      setTimeout(async () => {
        setRefreshing(false);
        await login(true);
        await fetchTotalCollection();
      }, 2000);
    }, []),
  );
  return (
    // <View>
    <View style={styles.root}>
      <CustomHeader title="End Work" />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            colors={[COLORS.lightScheme.primary]}
            onRefresh={onRefresh}
          />
        }
        style={{
          backgroundColor: COLORS.lightScheme.background,
          height: "100%",
          padding: 10,
        }}>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          {tableData.map(([label, value], idx) => (
            <View
              key={label}
              style={
                idx === tableData.length - 1
                  ? styles.summaryRowLast
                  : styles.summaryRow
              }
            >
              <Text style={styles.summaryLabel}>{label}</Text>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* PIN Section */}
        <View style={styles.pinSection}>
          <MpinComponent
            length={4}
            placeholder="*"
            value={endScreenPassword}
            onChangeText={setEndScreenPassword}
          />
          <ButtonComponent
            title="End Work "
            handleOnpress={() => handleEndWorkButton()}
            disabled={!endScreenPassword || isLoading || isOffline || endFlag == 'Y' || sendStatus}
            loading={isLoading}
          />
          {/* <Text> !endScreenPassword = {!endScreenPassword ? 'true' : 'false'} isLoading = {isLoading ? 'true' : 'false'}  isOffline = {isOffline ? 'true' : 'false'}  endFlag = {endFlag} sendStatus = {sendStatus ? 'true' : 'false'} </Text> */}
        </View>

        {isSyncing && !showSyncSuccess && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>Syncing...</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadSyncStatus}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
        {showSyncSuccess && (
          <View style={[styles.toastContainer, { backgroundColor: '#009966' }]}>
            <Text style={[styles.toastText, { flex: 1 }]}>✓ Sync successful! All transactions sent.</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSyncSuccess(false)}
            >
              <Text style={styles.refreshButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        {syncStatusVisible && syncCount > 0 && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{syncCount} transactions synced successfully</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadSyncStatus}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
            {processed_coll_count == received_coll_count && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSyncStatusVisible(false)}
              >
                <Text style={styles.refreshButtonText}>✕</Text>
              </TouchableOpacity>)
            }
          </View>
        )}
      </ScrollView>
      <AlertModal {...alertInfo} />

    </View>

    // </View>
  );
}

export default EndWorkScreen;


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(217,184,92,0.02)",

  },
  hero: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#0B1F2A",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#009966",
    fontWeight: "600",
  },
  contentCard: {
    flex: 1,
    marginHorizontal: 14,
    marginBottom: 14,
    padding: 12,
    borderRadius: 24,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(168,162,158,0.4)",
    marginBottom: 18,
    shadowColor: "#8b8b8bff",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(168,162,158,0.3)",
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
  },
  summaryValueHighlight: {
    fontSize: 16,
    color: "#009966",
    fontWeight: "800",
  },
  pinSection: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#ffffffff",
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
    marginBottom: 16,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionLabel: {
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  refreshButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#009966",
    borderRadius: 4,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  closeButton: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#f44336",
    borderRadius: 4,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  toastContainer: {
    position: "absolute",
    top: SCREEN_HEIGHT / 1.6,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 12,
    borderRadius: 18,
    elevation: 4,
  },
});
