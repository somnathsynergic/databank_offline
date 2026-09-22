import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import AlertModal from '../../Components/AlertModal';
import axios from 'axios';
import React, { useContext, useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import CustomHeader from '../../Components/CustomHeader';
import { AppStore } from '../../Context/AppContext';
import { getDBConnection, getSyncCounts, getRecentTransactions, getPendingSyncQueue, markTransactionSynced, removeFromSyncQueue, markTransactionSyncedFallback, reconcileOrphanSyncs, getAgent } from '../../Database/db-service';

// Placeholder for fetching and saving account details when needed
const fetchAndSaveAccountDetails = async (db, accountNumber) => {
  // TODO: Implement API call to fetch account details and save using saveAccounts or direct insert
  // For now, just log the intention
  console.log('Fetching and saving account details for', accountNumber);
};

import { COLORS } from '../../Resources/colors';

export default function SyncScreen() {
  const { isOffline } = useContext(AppStore);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);
  const [lastSyncText, setLastSyncText] = useState("Never");
  const [syncPercent, setSyncPercent] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncQueue, setSyncQueue] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString());
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const [alertInfo, setAlertInfo] = useState({ visible: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {} });
  const loadData = useCallback(async () => {
    try {
      const db = await getDBConnection();
      const counts = await getSyncCounts(db);
      const recent = await getRecentTransactions(db);

      setPendingCount(counts.pending);
      setSyncedCount(counts.synced);

      // Map DB transactions to UI format while keeping the raw data
      const formatted = recent.map(item => ({
        title: item.txn_no ? `Transaction #${String(item.txn_no).slice(-6)}` : "Transaction",
        subtitle: `₹${item.amount || 0} collected`,
        status: item.synced == 1 ? "synced" : "pending",
        rawData: item // Store full record for the detail modal
      }));
      setSyncQueue(formatted);

      // Update percentage
      const total = counts.pending + counts.synced;
      if (total > 0) {
        setSyncPercent(Math.round((counts.synced / total) * 100));
      } else {
        setSyncPercent(0);
      }

      if (counts.synced > 0) {
        setLastSyncText("Just now");
      }
      setLastRefresh(new Date().toLocaleTimeString());
      // After loading sync data, verify if account details need to be synced based on agent transaction number and collection flag
    const verifyAndSyncAccounts = async () => {
      try {
        const db = await getDBConnection();
        // Assuming there is only one agent logged in; adjust as needed
        const agent = await getAgent(db, /* use current agent code from context */ '');
        if (!agent) return;
        // Placeholder: fetchedTransNo would come from server - replace with actual API call
        const fetchedTransNo = agent.agent_trans_no; // assume same for demo
        const collectionFlag = agent.collection_flag || 'N'; // default if missing
        if (agent.agent_trans_no !== fetchedTransNo && collectionFlag === 'Y') {
          // Sync td_account_dtls only when condition met
          console.log('Condition met: syncing td_account_dtls');
          // Example: fetch and save specific account details
          await fetchAndSaveAccountDetails(db, 'ACCOUNT_NUMBER');
        }
      } catch (e) {
        console.error('Error during account sync verification:', e);
      }
    };
    // Trigger verification after data load
    verifyAndSyncAccounts();

    } catch (error) {
      console.error("Failed to load sync data:", error);
      setAlertInfo({
        visible: true,
        title: "Data Error",
        message: "Could not load synchronization data. Please ensure the database is initialized.",
        onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })),
        onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })),
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSyncNow = async () => {
    if (isOffline) {
      setAlertInfo({
        visible: true,
        title: "Network Required",
        message: "Please connect to the internet to synchronize your data.",
        onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })),
        onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })),
      });
      return;
    }

    setIsSyncing(true);
    try {
      const db = await getDBConnection();
      const queue = await getPendingSyncQueue(db);
      // console.log("queue", queue)
      if (queue.length === 0) {
        // If queue is empty but pendingCount > 0, we have orphans.
        if (pendingCount > 0) {
          // console.log("Empty queue but pending items found. Reconciling...");
          const fixed = await reconcileOrphanSyncs(db);
          if (fixed > 0) {
            await loadData();
            setAlertInfo({ visible: true, title: "Sync Complete", message: `Everything is already synchronized. Reconciled ${fixed} history status badges.`, onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })), onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })), });
          } else {
            setAlertInfo({ visible: true, title: "No Data", message: "Everything is already synchronized.", onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })), onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })), });
          }
        } else {
          setAlertInfo({ visible: true, title: "No Data", message: "Everything is already synchronized.", onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })), onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })), });
        }
        setIsSyncing(false);
        return;
      }

      // console.log(`Starting sync for ${queue.length} items...`);

      let successCount = 0;
      let failureReasons = [];

      for (const item of queue) {
        try {
          const payload = JSON.parse(item.payload);
          const serverPayload = { ...payload };
          delete serverPayload.local_txn_no; // Sanitize for strict server validation
          // console.log('serverPayload', serverPayload)
          const response = await axios({
            method: item.method,
            url: item.endpoint,
            data: serverPayload,
            headers: { Accept: "application/json" }
          });

          if (response.data.status) {
            // console.log(`Server success for item ${item.id}`);
            let dbResult = null;
            // Mark as synced locally
            if (payload.local_txn_no) {
              dbResult = await markTransactionSynced(db, payload.local_txn_no);
            } else if (payload.account_number && payload.transaction_date) {
              // Fallback for older records
              dbResult = await markTransactionSyncedFallback(db, payload.account_number, payload.transaction_date);
            }

            if (dbResult && dbResult.rowsAffected > 0) {
              successCount++;
              // Remove from queue ONLY if DB update succeeded to ensure retry on mismatch
              await removeFromSyncQueue(db, item.id);
            } else {
              console.warn(`Sync succeeded but local DB update failed for txn: ${payload.local_txn_no || 'unknown'}`);
              failureReasons.push(`Transaction #${item.id}: Local DB update failed.`);
            }
          } else {
            console.warn(`Server returned failure status for item ${item.id}:`, response.data.message);
            const serverError = response.data.message || response.data.error || response.data.msg || response.data.err || 'Server rejected request.';
            failureReasons.push(`Transaction #${item.id}: ${serverError}`);
          }
        } catch (itemErr) {
          console.error(`Failed to sync item ${item.id}:`, itemErr.message);
          const msg = itemErr.response?.data?.message || itemErr.response?.data?.error || itemErr.response?.data?.msg || itemErr.response?.data?.err || itemErr.message;
          failureReasons.push(`Transaction #${item.id}: ${msg}`);
        }
      }

      await loadData();

      let summaryMessage = `Successfully synchronized ${successCount} out of ${queue.length} items.`;
      if (failureReasons.length > 0) {
        summaryMessage += "\n\nFailures:\n" + failureReasons.join("\n");
      }

      setAlertInfo({ visible: true, title: "Sync Results", message: summaryMessage, onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })), onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })), });
    } catch (error) {
      console.error("Critical error during sync sync:", error);
      setAlertInfo({ visible: true, title: "Sync Error", message: "An error occurred during synchronization. Please try again later.", onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })), onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })), });
    } finally {
      setIsSyncing(false);
    }
  }

  const handleSyncNowDemo = async () => {
    if (isOffline) {
      setAlertInfo({ visible: true, title: "Network Required", message: "Please connect to the internet to synchronize your data.", onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })), onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })), });
      return;
    }

    setIsSyncing(true);
    try {
      const db = await getDBConnection();
      const queue = await getPendingSyncQueue(db);
      // console.log("queue", queue)
      if (queue.length === 0) {
        // If queue is empty but pendingCount > 0, we have orphans.
        if (pendingCount > 0) {
          // console.log("Empty queue but pending items found. Reconciling...");
          const fixed = await reconcileOrphanSyncs(db);
          if (fixed > 0) {
            await loadData();
            setAlertInfo({ visible: true, title: "Sync Complete", message: `Everything is already synchronized. Reconciled ${fixed} history status badges.`, onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })), onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })), });
          } else {
            setAlertInfo({ visible: true, title: "No Data", message: "Everything is already synchronized.", onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })), onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })), });
          }
        } else {
          setAlertInfo({ visible: true, title: "No Data", message: "Everything is already synchronized.", onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })), onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })), });
        }
        setIsSyncing(false);
        return;
      }

      // console.log(`Starting sync for ${queue.length} items...`);

      let successCount = 0;
      let failureReasons = [];
      let arr = []
      for (const item of queue) {
        // console.log(item.payload, 'payload')
        arr.push(JSON.parse(item.payload))
      }
      // console.log(arr, 'arr')

    } catch (error) {
      console.error("Critical error during sync sync:", error);
      setAlertInfo({ visible: true, title: "Sync Error", message: "An error occurred during synchronization. Please try again later.", onCancel: () => setAlertInfo(prev => ({ ...prev, visible: false })), onConfirm: () => setAlertInfo(prev => ({ ...prev, visible: false })), });
    } finally {
      setIsSyncing(false);
    }
  }

  const handleRefreshQueue = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 500); // Small delay for visual feedback
  }

  const handleItemPress = (item) => {
    setSelectedTxn(item.rawData);
    setShowDetail(true);
  }
  return (
    <View style={styles.root}>
      <CustomHeader />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View>
            <Text style={styles.heroSmall}>Offline First</Text>
            <Text style={styles.heroTitle}>Sync Now</Text>
            <Text style={styles.heroSub}>Keep local data and server data aligned</Text>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.lastRefreshText}>Refreshed: {lastRefresh}</Text>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Ready</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Synced</Text>
            <Text style={styles.summaryValue}>{syncedCount}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sync Status</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Network</Text>
            <Text style={[styles.infoValue, !isOffline ? styles.online : styles.offline]}>
              {!isOffline ? "Online" : "Offline"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Sync</Text>
            <Text style={styles.infoValue}>{lastSyncText}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Queued Items</Text>
            <Text style={styles.infoValue}>{pendingCount}</Text>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${syncPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>{syncPercent}% completed</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sync Actions</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            disabled={isSyncing || isOffline}
            onPress={handleSyncNowDemo}
          >
            {isSyncing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>SYNC NOW</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            disabled={isRefreshing}
            onPress={handleRefreshQueue}
          >
            {isRefreshing ? (
              <ActivityIndicator color="#0B1F2A" />
            ) : (
              <Text style={styles.secondaryButtonText}>REFRESH QUEUE</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Queue</Text>

          {syncQueue?.length ? (
            syncQueue.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.queueItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.queueLeft}>
                  <Text style={styles.queueTitle}>{item.title}</Text>
                  <Text style={styles.queueSub}>{item.subtitle}</Text>
                </View>

                <View
                  style={[
                    styles.queueBadge,
                    item.status === "failed" && styles.badgeFailed,
                    item.status === "pending" && styles.badgePending,
                    item.status === "synced" && styles.badgeSynced,
                  ]}
                >
                  <Text style={styles.queueBadgeText}>{item.status}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No pending items in queue.</Text>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showDetail}
        onRequestClose={() => setShowDetail(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDetail(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Detail</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedTxn && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Receipt No.</Text>
                  <Text style={styles.detailValue}>{selectedTxn.txn_no}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account No.</Text>
                  <Text style={styles.detailValue}>{selectedTxn.acc_no}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selectedTxn.customer_name || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={[styles.detailValue, { color: '#0B7A75', fontWeight: 'bold' }]}>₹{selectedTxn.amount}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{selectedTxn.collected_at}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Balance After</Text>
                  <Text style={styles.detailValue}>₹{selectedTxn.current_balance}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[styles.queueBadge, selectedTxn.synced == 1 ? styles.badgeSynced : styles.badgePending]}>
                    <Text style={styles.queueBadgeText}>
                      {selectedTxn.synced == 1 ? 'SYNCED' : 'PENDING'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDetail(false)}
            >
              <Text style={styles.modalCloseButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <AlertModal
        visible={alertInfo.visible}
        title={alertInfo.title}
        message={alertInfo.message}
        onConfirm={alertInfo.onConfirm}
        onCancel={alertInfo.onCancel}
        showCancel={alertInfo.showCancel !== undefined ? alertInfo.showCancel : false}
        confirmText={alertInfo.confirmText || "OK"}
        cancelText={alertInfo.cancelText || "Cancel"}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // backgroundColor: "#F5F9FF",
    backgroundColor: COLORS.lightScheme.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#F5F9FF",
  },
  hero: {
    backgroundColor: "#0B1F2A",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
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
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(217,184,92,0.12)",
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.25)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  statusText: {
    color: "#009966",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  lastRefreshText: {
    fontSize: 10,
    color: "#009966",
    opacity: 0.8,
    marginRight: 4,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
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
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 22,
    color: "#0B1F2A",
    fontWeight: "800",
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B1F2A",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.18)",
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#0B1F2A",
    fontWeight: "700",
  },
  online: {
    color: "#0B7A75",
  },
  offline: {
    color: "#DC2626",
  },
  progressWrap: {
    marginTop: 14,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E5EEF2",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#0B1F2A",
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  primaryButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#0B1F2A",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  secondaryButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(11,31,42,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#0B1F2A",
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  queueItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.18)",
  },
  queueLeft: {
    flex: 1,
    paddingRight: 10,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0B1F2A",
  },
  queueSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  queueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#EAF7F7",
    borderWidth: 1,
    borderColor: "rgba(217,184,92,0.12)",
  },
  badgeFailed: {
    backgroundColor: "#FEE2E2",
    borderColor: "rgba(220,38,38,0.15)",
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
    borderColor: "rgba(245,158,11,0.15)",
  },
  badgeSynced: {
    backgroundColor: "#DCFCE7",
    borderColor: "rgba(34,197,94,0.15)",
  },
  queueBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0B1F2A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 15
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B1F2A'
  },
  closeIcon: {
    fontSize: 20,
    color: '#64748B'
  },
  modalBody: {
    marginBottom: 24
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600'
  },
  detailValue: {
    fontSize: 14,
    color: '#0B1F2A',
    fontWeight: '700'
  },
  modalCloseButton: {
    backgroundColor: '#0B1F2A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1
  }
});