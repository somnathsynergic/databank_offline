import React, { createContext, useEffect, useState, useRef } from "react"
import axios from "axios"
import DeviceInfo from "react-native-device-info"
import { ToastAndroid } from "react-native"
import { REACT_APP_BASE_URL } from "../Config/config"
import { address } from "../Routes/addresses"
import { signChallenge, getAgentCodeLocally, saveAgentCodeLocally } from "../Utils/cryptoHelper"
import {
  getDBConnection,
  saveAgent,
  verifyOfflineLogin,
  getAgent,
  getAllAgents,
  saveAccounts,
  clearAllLocalData,
  backupAndClearLocalData,
  getLastSynced,
  getLastSyncedFromAgent,
} from '../Database/db-service'
import NetInfo from "@react-native-community/netinfo"
import AnimatedToast from "../Components/AnimatedToast"

export const AppStore = createContext();

const AppContext = ({ children }) => {
  // Authentication & user info
  const [isLogin, setIsLogin] = useState(false);
  const [id, setId] = useState(0);
  const [userId, setUserId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPhoneNumber, setAgentPhoneNumber] = useState("");
  const [bankId, setBankId] = useState(0);
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [deviceId, setDeviceID] = useState(DeviceInfo.getUniqueIdSync());
  const [passcode, setPasscode] = useState("");
  const [agentTransNo, setAgentTransNo] = useState("");
  const [totalCollection, setTotalCollection] = useState(0);
  const [receiptNumber, setReceiptNumber] = useState(0);
  const [maximumAmount, setMaximumAmount] = useState(0);
  const [allowCollectionDays, setAllowCollectionDays] = useState(0);
  const [secAmtType, setSecAmtType] = useState("");
  const [printOp, setPrintOp] = useState(false);
  const [modifiedAt, setModifiedAt] = useState(() => new Date());
  const [transDt, setTransDt] = useState(() => new Date());
  const [isDaily, setisDaily] = useState(false);
  const [isLoan, setIsLoan] = useState(false);
  const [isRD, setIsRD] = useState(false);
  const [collectionFlag, setCollectionFlag] = useState(null);
  const [endFlag, setEndFlag] = useState(null);
  const [todayDateFromServer, setTodayDateFromServer] = useState(
    () => new Date(),
  );
  const [next, setNext] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const syncPerformed = useRef(false);
  // other state and refs remain unchanged
  const [syncLoading, setSyncLoading] = useState(false);
  const [lastWorkDate, setLastWorkDate] = useState('');
  // flag to ensure login toast shows only once per session
  const [loginToastShown, setLoginToastShown] = useState(false);
  // flag to signal screens to reset their local total collection amount
  const [needsLocalReset, setNeedsLocalReset] = useState(false);
  const [lastSyncedDate, setLastSyncedDate] = useState('');
  const [isSessionChecking, setIsSessionChecking] = useState(true);

  // Auto-load registered agent code on Context init
  useEffect(() => {
    const loadRegisteredAgent = async () => {
      try {
        const savedCode = await getAgentCodeLocally();
        if (savedCode && !userId) {
          setUserId(savedCode);
        }
      } catch (e) {
        console.error("Error loading local agent code:", e);
      }
    };
    loadRegisteredAgent();
  }, []);

  // Check login session on startup and auto-navigate if active
  useEffect(() => {
    const checkSession = async () => {
      try {
        const db = await getDBConnection();
        let sessionJson = null;

        try {
          const [res] = await db.executeSql(
            "SELECT app_value FROM td_app_state WHERE app_key = 'user_session';",
          );
          if (res && res.rows && res.rows.length > 0) {
            sessionJson = res.rows.item(0).app_value;
          }
        } catch (e1) {
          try {
            const [res2] = await db.executeSql(
              "SELECT value FROM app_state WHERE key = 'user_session';",
            );
            if (res2 && res2.rows && res2.rows.length > 0) {
              sessionJson = res2.rows.item(0).value;
            }
          } catch (e2) {
            sessionJson = null;
          }
        }

        if (sessionJson) {
          const session = JSON.parse(sessionJson);
          const currentTime = new Date().getTime();
          const oneDay = 24 * 60 * 60 * 1000;
          if (currentTime - session.loginTime < oneDay) {
            setUserId(session.userId || "");
            setAgentName(session.userData?.agent_name || "");
            setAgentEmail(session.userData?.email_id || "");
            setAgentPhoneNumber(session.userData?.phone_no || "");
            setBankId(session.userData?.bank_id || 0);
            setBankName(session.userData?.bank_name || "");
            setBranchName(session.userData?.branch_name || "");
            setBranchCode(session.userData?.branch_code || "");
            setMaximumAmount(session.userData?.max_amt || 0);
            setPrintOp(session.userData?.print_opt || false);
            setCollectionFlag(session.trans ? session.trans.coll_flag : 'N');
            setEndFlag(
              session.trans
                ? session.trans.coll_flag === 'Y'
                  ? 'N'
                  : 'Y'
                : 'Y',
            );
            setIsLoan(session.bankAccType?.loan_flag === "Y");
            setisDaily(session.bankAccType?.dds_flag === "Y");
            setIsRD(session.bankAccType?.rd_flag === "Y");
            setAllowCollectionDays(session.userData?.allow_collection_days || 0);
            setSecAmtType(session.userData?.sec_amt_type || "");
            setTotalCollection(session.totalCollection || 0);
            setReceiptNumber(session.receiptNo || 0);
            setAgentTransNo(session.agentTransNo || "");
            setLastWorkDate(session.lastWorkDate || "");
            setPasscode(session.passcode || "");
            setIsLogin(true);
            setLoginToastShown(true);
          }
        }
      } catch (e) {
        console.error("Error checking session:", e);
      } finally {
        setIsSessionChecking(false);
      }
    };
    checkSession();
  }, []);

  // Load last sync date on context init (page load)
  useEffect(() => {
    const loadLastSynced = async () => {
      try {
        const db = await getDBConnection();
        const stored = await getLastSynced(db);
        if (stored) {
          setLastSyncedDate(stored);
        } else {
          // try fetching directly from md_agent using current userId if available
          let agentSynced = ''
          if (userId) {
            agentSynced = await getLastSyncedFromAgent(db, userId);
          }
          if (agentSynced) {
            setLastSyncedDate(agentSynced);
          } else {
            // final fallback to any agent record
            const agents = await getAllAgents(db);
            if (agents.length > 0 && agents[0].last_synced) {
              setLastSyncedDate(agents[0].last_synced);
            }
            if (agents.length > 0 && agents[0].last_work_date) {
              setLastWorkDate(agents[0].last_work_date);
            }
          }
        }
      } catch (e) {
        console.error('Error loading initial last_synced:', e);
      }
    };
    loadLastSynced();
  }, []);

  // Animated toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastDuration, setToastDuration] = useState(4000);
  const showToast = (msg, dur = 4000) => {
    setToastMessage(msg);
    setToastDuration(dur);
    setToastVisible(true);
  };
  const hideToast = () => setToastVisible(false);

  // Monitor network status
  useEffect(() => {
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Capture device ID on mount
  useEffect(() => {
    const uniqueId = DeviceInfo.getUniqueIdSync();
    setDeviceID(uniqueId);
  }, []);

  // Login handler with Hardware Cryptographic Device Binding
  const login = async (forceRefresh = false) => {
    // If already logged in and not forcing refresh, skip API call
    if (isLogin && !forceRefresh) {
      return true;
    }

    if (isOffline) {
      ToastAndroid.showWithGravityAndOffset(
        "Login requires an active internet connection. Operation dismissed.",
        ToastAndroid.LONG,
        ToastAndroid.CENTER,
        25,
        50,
      );
      return false;
    }

    try {
      let loginPayload = {
        device_id: deviceId,
        user_id: userId,
        password: passcode,
      };

      // 1. Fetch Challenge from Backend for agent
      try {
        const challengeRes = await axios.post(
          address.CHALLENGE,
          { agent_code: userId },
          { headers: { Accept: "application/json" } }
        );

        if (challengeRes.data && challengeRes.data.status && challengeRes.data.challenge) {
          const challengeStr = challengeRes.data.challenge;

          // 2. Sign Challenge using Hardware Private Key
          const signatureStr = await signChallenge(challengeStr);

          // 3. Construct Cryptographic Login Payload
          loginPayload = {
            agent_code: userId,
            signature: signatureStr,
            device_id: deviceId,
          };
        }
      } catch (cryptoErr) {
        console.warn("Crypto challenge/signature fallback to legacy auth:", cryptoErr);
      }

      // Send Login Request to Backend
      const res = await axios.post(address.LOGIN, loginPayload, {
        headers: { Accept: "application/json" },
      });

      if (!res.data || !res.data.status || !res.data.success) {
        const errStr = res.data?.Error || "Invalid Credentials or Signature";
        ToastAndroid.show(errStr, ToastAndroid.LONG);
        return false;
      }

      // Save agent code locally for persistent auto-fill
      await saveAgentCodeLocally(userId);

      const userData = res.data.success.user_data.msg[0];
      console.log('userData////////////////////////', userData)
      const {
        bank_address,
        logo_path,
        device_type,
        agent_active_flag,
        bank_active_flag,
      } = userData;
      const trans =
        res.data.success.trans.suc > 0 && res.data.success.trans.msg
          ? res.data.success.trans.msg[0]
          : [];
      // Calculate last work date based on transaction date and allowed collection days
      let calculatedLastWorkDate = ''
      if (trans && trans.trans_dt && allowCollectionDays) {
        const transDate = new Date(trans.trans_dt);
        transDate.setDate(transDate.getDate() + allowCollectionDays);
        calculatedLastWorkDate = transDate.toISOString();
        setLastWorkDate(calculatedLastWorkDate);
      }
      console.log('////trans', res.data.success.trans)
      setIsLogin(true);
      if (!loginToastShown) {
        // Show login success toast for a longer period (6 seconds)
        showToast('Login successful', 6000);
        setLoginToastShown(true);
      }
      setAgentName(userData.agent_name);
      setAgentEmail(userData.email_id);
      setAgentPhoneNumber(userData.phone_no);
      setBankId(userData.bank_id);
      setBankName(userData.bank_name);
      setBranchName(userData.branch_name);
      setBranchCode(userData.branch_code);
      setMaximumAmount(userData.max_amt);
      setPrintOp(userData.print_opt);
      setCollectionFlag(trans ? trans.coll_flag : 'N');
      setEndFlag(trans ? (trans.coll_flag === 'Y' ? 'N' : 'Y') : 'Y');
      const bankTypes = res.data.success.bank_acc_type[0];
      setIsLoan(bankTypes.loan_flag === "Y");
      setisDaily(bankTypes.dds_flag === "Y");
      setIsRD(bankTypes.rd_flag === "Y");
      setAllowCollectionDays(userData.allow_collection_days);
      setSecAmtType(userData.sec_amt_type);
      const safeTotalCollection =
        +res.data?.success?.total_collection?.msg?.[0]?.total_collection || 0;
      const safeReceiptNo =
        res.data?.success?.setting?.msg?.[0]?.receipt_no || 0;
      const safeAgentTransNo =
        res.data?.success?.setting?.msg?.[0]?.agent_trans_no || ''
      setTotalCollection(safeTotalCollection);
      setReceiptNumber(safeReceiptNo);
      setAgentTransNo(trans ? trans.agent_trans_no : "");
      // Declare flag for full sync requirement
      let needFullSync = false;
      // Persist agent locally
      try {
        const db = await getDBConnection();
        const agents = await getAllAgents(db);
        const localAgent = agents.length > 0 ? agents[0] : null;
        const localAgentTransNo = localAgent ? localAgent.agent_trans_no : null;
        const apiAgentTransNo = trans ? trans.agent_trans_no : ""
        const apiCollectionFlag = trans ? trans.coll_flag : ""
        console.log('apiCollectionFlag', apiCollectionFlag)
        console.log('localAgentTransNo', localAgentTransNo)
        console.log('apiAgentTransNo', apiAgentTransNo)
        needFullSync =
          apiCollectionFlag === 'Y' && localAgentTransNo !== apiAgentTransNo;
        if (needFullSync) {
          // Read last_synced before wiping app_state
          let preservedLastSynced = ''
          try {
            preservedLastSynced = await getLastSynced(db);
          } catch (e) {
            console.error('Could not read last_synced before flush:', e);
          }
          await clearAllLocalData(db);
          setNeedsLocalReset(true);
          // Re-persist last_synced into app_state after the flush
          if (preservedLastSynced) {
            try {
              await db.executeSql(
                "INSERT OR REPLACE INTO app_state (key, value) VALUES ('last_synced', ?);",
                [preservedLastSynced],
              );
            } catch (e) {
              console.error('Could not restore last_synced after flush:', e);
            }
          }
        }
      } catch (flushErr) {
        console.error("Error during pre‑save flush check:", flushErr);
      }
      try {
        const db = await getDBConnection();
        const agentSettingsToSave = {
          agent_code: userId,
          device_id: deviceId,
          pin_hash: passcode,
          agent_name: userData.agent_name,
          bank_id: userData.bank_id,
          agent_trans_no: safeAgentTransNo,
          bank_name: userData.bank_name,
          branch_id: userData.branch_code,
          branch_name: userData.branch_name,
          max_daily_amount: userData.max_amt,
          max_days: userData.allow_collection_days,
          printer_type: userData.print_opt,
          is_active: userData.coll_flag,
          work_ended: userData.coll_flag == 'Y' ? 'N' : 'Y',
          sec_amt_type: userData.sec_amt_type,
          loan_flag: bankTypes.loan_flag === "Y",
          dds_flag: bankTypes.dds_flag === "Y",
          rd_flag: bankTypes.rd_flag === "Y",
          receipt_no: safeReceiptNo,
          total_collection: safeTotalCollection,
          agent_trans_no: trans ? trans.agent_trans_no : "",
          bank_address: bank_address,
          logo_path: logo_path,
          device_type: device_type,
          agent_active_flag: agent_active_flag,
          bank_active_flag: bank_active_flag,
          last_work_date: calculatedLastWorkDate,
        };
        // console.log(agentSettingsToSave)
        await saveAgent(db, agentSettingsToSave);
        // Save user session in SQLite
        try {
          const sessionData = {
            loginTime: new Date().getTime(),
            userId: userId,
            userData: userData,
            trans: trans,
            bankAccType: bankTypes,
            totalCollection: safeTotalCollection,
            receiptNo: safeReceiptNo,
            agentTransNo: trans ? trans.agent_trans_no : "",
            lastWorkDate: calculatedLastWorkDate,
            passcode: passcode,
          };
          await db.executeSql(
            "INSERT OR REPLACE INTO app_state (key, value) VALUES ('user_session', ?);",
            [JSON.stringify(sessionData)],
          );
          await db.executeSql(
            "INSERT OR REPLACE INTO td_app_state (app_key, app_value) VALUES ('user_session', ?);",
            [JSON.stringify(sessionData)],
          );
        } catch (sessionSaveErr) {
          console.error("Failed to save user session:", sessionSaveErr);
        }
        // Update lastSyncedDate after login
        try {
          const stored = await getLastSynced(db);
          if (stored) {
            setLastSyncedDate(stored);
          } else if (userId) {
            const agentSynced = await getLastSyncedFromAgent(db, userId);
            if (agentSynced) {
              setLastSyncedDate(agentSynced);
            }
          }
        } catch (e) {
          console.error('Could not read last_synced after login:', e);
        }
      } catch (dbErr) {
        console.error("Failed to persist agent locally:", dbErr);
      }
      // Background sync for offline accounts – only when needed
      if (!syncPerformed.current) {
        if (needFullSync) {
          const syncedCount = await syncAllAccounts(
            userData.bank_id,
            userData.branch_code,
            userId,
          );
          const countMessage =
            syncedCount != null
              ? `${syncedCount} accounts synced`
              : 'Sync completed'
          showToast(
            `Agent data sync successful: ${countMessage}. You can continue`,
          );
        }
        setSyncLoading(false);
        syncPerformed.current = true;
      } else {
        setSyncLoading(false);
      }
      // } else {
      //   ToastAndroid.show("Invalid Credentials", ToastAndroid.SHORT);
      //   setPasscode("");
      //   return false;
      // }
    } catch (err) {
      console.error("Online login error:", err);
      if (!isOffline) {
        ToastAndroid.show(
          "Server Error. Try offline login if registered.",
          ToastAndroid.SHORT,
        )
      }
      return false;
    }
  };

  // Placeholder for other helper functions (getUserId, getFlagsRequest, getTotalDepositAmount, syncAllAccounts, logout, etc.)
  const getUserId = async () => {
    if (isOffline) {
      return
    }
    const obj = { device_id: deviceId };
    try {
      const res = await axios.post(address.MY_AGENT, obj, {
        headers: { Accept: 'application/json' },
      });
      if (res?.data?.success?.msg?.length > 0) {
        setUserId(res?.data?.success?.msg[0]?.user_id);
      }
    } catch (err) {
      console.error("Error fetching agent ID:", err?.response?.data);
    }
  };

  const getFlagsRequest = async () => {
    // Implementation omitted for brevity – same as original project
  };

  const getTotalDepositAmount = async () => {
    if (isOffline) {
      return
    }
    const obj = { bank_id: bankId, branch_code: branchCode, agent_code: userId }

    await axios
      .post(address.TOTAL_COLLECTION, obj, {
        headers: {
          Accept: "application/json",
        },
      })
      .then(res => {
        const amt = res?.data?.success?.msg?.[0]?.deposit_amount || 0;
        setTotalCollection(amt);
      })
      .catch(err => {
        console.error("Error fetching total collection:", err);
      });
  };

  const syncAllAccounts = async (bId, bCode, aCode) => {
    try {
      const obj = {
        bank_id: bId,
        branch_code: bCode,
        agent_code: aCode,
        // flag: "A", // fetch all accounts
      };
      const res = await axios.post(address.SEARCH_ACCOUNT, obj, {
        headers: { Accept: "application/json" },
      });
      let accounts = res?.data?.success?.msg || [];
      // console.log(accounts)
      if (!Array.isArray(accounts)) {
        if (Array.isArray(accounts?.msg)) {
          accounts = accounts.msg;
        } else if (Array.isArray(accounts?.[0]?.msg)) {
          accounts = accounts[0].msg;
        } else if (Array.isArray(accounts?.[0]?.msg?.accounts)) {
          accounts = accounts[0].msg.accounts;
        } else {
          accounts = [];
        }
      }
      // Filter out acc_type if present
      const filteredAccounts = accounts.map(({ acc_type, ...rest }) => rest);
      if (filteredAccounts.length > 0) {
        const db = await getDBConnection();
        await saveAccounts(db, filteredAccounts, "A");
      }
      return accounts.length;
    } catch (err) {
      console.error("Sync all accounts error:", err);
      return 0;
    }
  };

  const logout = async () => {
    try {
      const db = await getDBConnection();
      await db.executeSql("DELETE FROM app_state WHERE key = 'user_session';");
    } catch (e) {
      console.error("Error clearing user session in database:", e);
    }
    setIsLogin(false);
    setAgentName("");
    setAgentEmail("");
    setAgentPhoneNumber("");
    setPasscode("");
    setLoginToastShown(false);
    // Reset sync flag so next login will sync again
    syncPerformed.current = false;
  };

  return (
    <AppStore.Provider
      value={{
        isLogin,
        setIsLogin,
        isSessionChecking,
        logout,
        id,
        userId,
        setUserId,
        agentName,
        agentEmail,
        agentPhoneNumber,
        login,
        // login can be called with forceRefresh flag where needed
        getUserId,
        deviceId,
        setDeviceID,
        passcode,
        setPasscode,
        agentTransNo,
        setAgentTransNo,
        next,
        setNext,
        bankId,
        bankName,
        branchName,
        branchCode,
        maximumAmount,
        totalCollection,
        receiptNumber,
        // holidayLock,
        modifiedAt,
        todayDateFromServer,
        getFlagsRequest,
        collectionFlag,
        endFlag,
        allowCollectionDays,
        secAmtType,
        getTotalDepositAmount,
        totalDepositedAmount: null,
        isDaily,
        isLoan,
        isRD,
        transDt,
        printOp,
        setTotalCollection,
        isOffline,
        syncLoading,
        needsLocalReset,
        clearNeedsLocalReset: () => setNeedsLocalReset(false),
        lastSyncedDate,
        setLastSyncedDate,
        lastWorkDate,
        setLastWorkDate,
      }}>
      {children}
      <AnimatedToast
        visible={toastVisible}
        message={toastMessage}
        onHide={hideToast}
        duration={toastDuration}
      />
    </AppStore.Provider>
  );
};

export default AppContext;
