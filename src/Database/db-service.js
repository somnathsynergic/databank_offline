import SQLite from 'react-native-sqlite-storage'

SQLite.enablePromise(true);

const database_name = "DataBank.db"

let tablesCreatedFlag = false;

export const getDBConnection = async () => {
  const db = await SQLite.openDatabase({ name: database_name, location: 'default' });
  if (!tablesCreatedFlag) {
    try {
      await createTables(db);
      tablesCreatedFlag = true;
    } catch (e) {
      console.warn("Table auto-creation notice:", e);
    }
  }
  return db;
};

export const createTables = async db => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS md_agent (
        agent_code TEXT PRIMARY KEY,
        device_id TEXT,
        pin_hash TEXT,
        agent_name TEXT,
        bank_id TEXT,
        agent_trans_no TEXT,
        bank_name TEXT,
        branch_id TEXT,
        branch_name TEXT,
        max_daily_amount REAL,
        max_days INTEGER,
        printer_type TEXT,
        current_day_count INTEGER DEFAULT 0,
        last_work_date TEXT,
        work_ended INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        sec_amt_type TEXT,
        loan_flag INTEGER DEFAULT 0,
        dds_flag INTEGER DEFAULT 0,
        rd_flag INTEGER DEFAULT 0,
        receipt_no INTEGER DEFAULT 0,
        total_collection REAL DEFAULT 0,
        last_synced TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS td_account_dtls (
        acc_no TEXT PRIMARY KEY,
        customer_name TEXT,
        phone TEXT,
        loan_amount REAL,
        last_collection_date TEXT,
        current_balance REAL,
        status TEXT,
        acc_type TEXT,
        product_code TEXT,
        opening_date TEXT,
        bank_id TEXT,
        branch_id TEXT,
        agent_code TEXT,
        raw_data TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS td_collection (
            txn_no TEXT PRIMARY KEY,
            acc_no TEXT,
            agent_code TEXT,
            amount REAL,
            collected_at TEXT,
            current_balance REAL,
            synced INTEGER DEFAULT 0,
            receipt_printed INTEGER DEFAULT 0,
            bank_id TEXT,
            branch_id TEXT,
            acc_type TEXT,
            prev_coll_dt TEXT
        );`,
    `CREATE TABLE IF NOT EXISTS td_collection_backup (
            txn_no TEXT PRIMARY KEY,
            acc_no TEXT,
            agent_code TEXT,
            amount REAL,
            collected_at TEXT,
            current_balance REAL,
            synced INTEGER DEFAULT 0,
            receipt_printed INTEGER DEFAULT 0,
            bank_id TEXT,
            branch_id TEXT,
            acc_type TEXT,
            prev_coll_dt TEXT
        );`,
    `CREATE TABLE IF NOT EXISTS td_collection_dtls (
            txn_no TEXT PRIMARY KEY,
            acc_no TEXT,
            agent_code TEXT,
            amount REAL,
            collected_at TEXT,
            current_balance REAL,
            synced INTEGER DEFAULT 0,
            receipt_printed INTEGER DEFAULT 0,
            acc_type TEXT
        );`,
    `CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT,
        method TEXT,
        payload TEXT,
        created_at TEXT,
        retries INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending'
    );`,
    `CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS td_app_state (
        app_key TEXT PRIMARY KEY,
        app_value TEXT
    );`,
    // Backup tables for safe deletion on login
    `CREATE TABLE IF NOT EXISTS td_account_dtls_backup (
        acc_no TEXT PRIMARY KEY,
        customer_name TEXT,
        phone TEXT,
        loan_amount REAL,
        last_collection_date TEXT,
        current_balance REAL,
        status TEXT,
        acc_type TEXT,
        product_code TEXT,
        opening_date TEXT,
        bank_id TEXT,
        branch_id TEXT,
        agent_code TEXT,
        raw_data TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS td_collection_dtls_backup (
        txn_no TEXT PRIMARY KEY,
        acc_no TEXT,
        agent_code TEXT,
        amount REAL,
        collected_at TEXT,
        current_balance REAL,
        synced INTEGER DEFAULT 0,
        receipt_printed INTEGER DEFAULT 0,
        acc_type TEXT
    );`,
  ]

  try {
    for (const query of queries) {
      await db.executeSql(query);
    }
    // console.log("Tables created successfully");

    // Seamless migration for newly added columns
    const migrations = [
      "ALTER TABLE md_agent ADD COLUMN agent_trans_no TEXT;",
      "ALTER TABLE md_agent ADD COLUMN bank_name TEXT;",
      "ALTER TABLE md_agent ADD COLUMN branch_name TEXT;",
      "ALTER TABLE md_agent ADD COLUMN sec_amt_type TEXT;",
      "ALTER TABLE md_agent ADD COLUMN loan_flag INTEGER DEFAULT 0;",
      "ALTER TABLE md_agent ADD COLUMN dds_flag INTEGER DEFAULT 0;",
      "ALTER TABLE md_agent ADD COLUMN rd_flag INTEGER DEFAULT 0;",
      "ALTER TABLE md_agent ADD COLUMN receipt_no INTEGER DEFAULT 0;",
      "ALTER TABLE md_agent ADD COLUMN total_collection REAL DEFAULT 0;",
      "ALTER TABLE md_agent ADD COLUMN bank_address TEXT;",
      "ALTER TABLE md_agent ADD COLUMN logo_path TEXT;",
      "ALTER TABLE md_agent ADD COLUMN device_type TEXT;",
      "ALTER TABLE md_agent ADD COLUMN agent_active_flag TEXT;",
      "ALTER TABLE md_agent ADD COLUMN bank_active_flag TEXT;",
      "ALTER TABLE md_agent ADD COLUMN last_synced TEXT;",
      "ALTER TABLE td_account_dtls ADD COLUMN acc_type TEXT;",
      "ALTER TABLE td_account_dtls ADD COLUMN product_code TEXT;",
      "ALTER TABLE td_account_dtls ADD COLUMN raw_data TEXT;",
      "ALTER TABLE td_account_dtls ADD COLUMN opening_date TEXT;",
      "ALTER TABLE td_account_dtls_backup ADD COLUMN opening_date TEXT;",
      "ALTER TABLE td_account_dtls ADD COLUMN bank_id TEXT;",
      "ALTER TABLE td_account_dtls_backup ADD COLUMN bank_id TEXT;",
      "ALTER TABLE td_account_dtls ADD COLUMN branch_id TEXT;",
      "ALTER TABLE td_account_dtls_backup ADD COLUMN branch_id TEXT;",
      "ALTER TABLE td_account_dtls ADD COLUMN agent_code TEXT;",
      "ALTER TABLE td_account_dtls_backup ADD COLUMN agent_code TEXT;",
      `ALTER TABLE td_collection ADD COLUMN bank_id TEXT;`,
      `ALTER TABLE td_collection ADD COLUMN branch_id TEXT;`,
      `ALTER TABLE td_collection_backup ADD COLUMN bank_id TEXT;`,
      `ALTER TABLE td_collection_backup ADD COLUMN branch_id TEXT;`,
      `ALTER TABLE td_collection ADD COLUMN acc_type TEXT;`,
      `ALTER TABLE td_collection_dtls ADD COLUMN acc_type TEXT;`,
      `ALTER TABLE td_collection_dtls_backup ADD COLUMN acc_type TEXT;`,
      `ALTER TABLE td_collection_backup ADD COLUMN acc_type TEXT;`,
      `ALTER TABLE td_collection ADD COLUMN synced INTEGER DEFAULT 0;`,
      `ALTER TABLE td_collection ADD COLUMN receipt_printed INTEGER DEFAULT 0;`,
      `ALTER TABLE td_collection ADD COLUMN prev_coll_dt TEXT;`,
      `ALTER TABLE td_collection_backup ADD COLUMN prev_coll_dt TEXT;`
    ]

    for (const migration of migrations) {
      try {
        await db.executeSql(migration);
      } catch (err) {
        // Ignored. If it throws, the column probably already exists.
      }
    }
    // console.log("Migrations applied");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw Error("Failed to create tables");
  }
};

export const initDatabase = async () => {
  try {
    const db = await getDBConnection();
    await createTables(db);
    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

export const clearAllLocalData = async db => {
  const tables = [
    'md_agent',
    'td_account_dtls',
    'td_collection',
    'td_collection_dtls',
    'sync_queue',
    'app_state',
    'td_app_state',
  ];
  try {
    // Copy data into backup tables before clearing
    await db.executeSql(
      "INSERT OR REPLACE INTO td_account_dtls_backup SELECT * FROM td_account_dtls",
    )
    await db.executeSql(
      "INSERT OR REPLACE INTO td_collection_backup SELECT * FROM td_collection",
    )
    await db.executeSql(
      "INSERT OR REPLACE INTO td_collection_dtls_backup SELECT * FROM td_collection_dtls",
    )

    for (const table of tables) {
      await db.executeSql(`DELETE FROM ${table}`);
    }
    // console.log("All local tables flushed successfully.");
  } catch (err) {
    console.error("Error flushing local tables:", err);
    throw err;
  }
};

// New function to backup then clear collection and account details
export const clearSyncQueue = async db => {
  try {
    await db.executeSql("DELETE FROM sync_queue");
    // console.log('Sync queue cleared after successful sync.');
  } catch (err) {
    console.error('Error clearing sync queue:', err);
    throw err;
  }
};
export const saveAgent = async (db, agent) => {
  const query = `INSERT OR REPLACE INTO md_agent (
    agent_code, device_id, pin_hash, agent_name, bank_id, agent_trans_no, bank_name, branch_id, branch_name,
    max_daily_amount, max_days, printer_type, current_day_count, last_work_date, work_ended, is_active,
    sec_amt_type, loan_flag, dds_flag, rd_flag, receipt_no, total_collection,
    bank_address, logo_path, device_type, agent_active_flag, bank_active_flag, last_synced
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  );`;
  const params = [
    agent.agent_code,
    agent.device_id,
    agent.pin_hash,
    agent.agent_name,
    agent.bank_id,
    agent.agent_trans_no,
    agent.bank_name,
    agent.branch_id,
    agent.branch_name,
    agent.max_daily_amount,
    agent.max_days,
    agent.printer_type,
    agent.current_day_count,
    agent.last_work_date,
    agent.work_ended,
    agent.is_active,
    agent.sec_amt_type,
    agent.loan_flag,
    agent.dds_flag,
    agent.rd_flag,
    agent.receipt_no,
    agent.total_collection,
    agent.bank_address,
    agent.logo_path,
    agent.device_type,
    agent.agent_active_flag,
    agent.bank_active_flag,
    agent.last_synced || null,
  ]
  try {
    await db.executeSql(query, params);
    // console.log("Agent saved locally:", agent.agent_code);
  } catch (error) {
    console.error("Error saving agent:", error);
    throw Error("Failed to save agent");
  }
};

export const saveLastSynced = async (db, dateTimeStr) => {
  try {
    await db.executeSql(
      `INSERT OR REPLACE INTO app_state (key, value) VALUES ('last_synced', ?);`,
      [dateTimeStr],
    );
    await db.executeSql(
      `INSERT OR REPLACE INTO td_app_state (app_key, app_value) VALUES ('last_synced', ?);`,
      [dateTimeStr],
    );
  } catch (error) {
    console.error('Error saving last_synced to app_state:', error);
  }
};

export const getLastSynced = async db => {
  try {
    const [result] = await db.executeSql(
      `SELECT app_value FROM td_app_state WHERE app_key = 'last_synced';`,
    );
    if (result.rows.length > 0) {
      return result.rows.item(0).app_value;
    }
  } catch (error) {
    // Try app_state fallback
    try {
      const [res2] = await db.executeSql(
        `SELECT value FROM app_state WHERE key = 'last_synced';`,
      );
      if (res2.rows.length > 0) {
        return res2.rows.item(0).value;
      }
    } catch (e2) {
      console.error('Error reading last_synced:', e2);
    }
  }
  return '';
};

export const getLastSyncedFromAgent = async (db, agentCode) => {
  const query = `SELECT last_synced FROM md_agent WHERE agent_code = ?;`;
  try {
    const [result] = await db.executeSql(query, [agentCode]);
    if (result.rows.length > 0) {
      return result.rows.item(0).last_synced || '';
    }
    return '';
  } catch (error) {
    console.error('Error fetching last_synced from md_agent:', error);
    return '';
  }
};

export const verifyOfflineLogin = async (db, agentCode, pin) => {
  const query = "SELECT * FROM md_agent WHERE agent_code = ? AND pin_hash = ?;"
  try {
    const [results] = await db.executeSql(query, [agentCode, pin]);
    if (results.rows.length > 0) {
      return results.rows.item(0);
    }
    return null;
  } catch (error) {
    console.error("Error during offline login:", error);
    throw Error("Offline login check failed");
  }
};

export const getAllAgents = async db => {
  const query = "SELECT * FROM md_agent;"
  try {
    const [results] = await db.executeSql(query);
    const agents = [];
    for (let i = 0; i < results.rows.length; i++) {
      agents.push(results.rows.item(i));
    }
    return agents;
  } catch (error) {
    console.error("Error fetching all agents:", error);
    throw Error("Failed to fetch agents");
  }
};

export const saveAccounts = async (db, accounts, accType) => {
  if (!accounts || accounts.length === 0) {
    return
  }
  // Insert without acc_type since it's no longer required for sync
  const query = `INSERT OR REPLACE INTO td_account_dtls (
    acc_no, acc_type, customer_name, product_code, opening_date, bank_id, branch_id, agent_code, raw_data
  ) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?);`;

  try {
    for (const acc of accounts) {
      const params = [
        acc.account_number,
        acc.product_code[0],
        acc.customer_name,
        acc.product_code || null,
        acc.opening_date || null,
        acc.bank_id || null,
        acc.branch_code || null,
        acc.agent_code || null,
        JSON.stringify(acc), // store the full object to return later
      ]
      await db.executeSql(query, params);
    }
    // console.log(`Saved ${accounts.length} accounts to local DB without acc_type.`);
  } catch (error) {
    console.error("Error saving accounts without acc_type:", error);
  }
};

export const searchOfflineAccounts = async (db, searchTerm, accType) => {
  // Retrieve all accounts (or limited set) and filter by account type from stored raw_data
  let query = "SELECT raw_data FROM td_account_dtls"
  const params = [];

  if (searchTerm) {
    query += " WHERE raw_data LIKE ?"
    const term = `%${searchTerm}%`;
    params.push(term);
  }

  query += " LIMIT 200;"

  try {
    const [results] = await db.executeSql(query, params);
    // console.log(results.rows.item(0))
    const accounts = [];
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      if (row.raw_data) {
        const acc = JSON.parse(row.raw_data);
        if (accType) {
          const type = (
            acc.acc_type ||
            acc.account_type ||
            acc.ACC_TYPE ||
            acc.AccountType ||
            ""
          )
            .toString()
            .trim()
            .toUpperCase();
          // Exclude only if type is present and does not match requested type
          if (type && type !== accType.trim().toUpperCase()) {
            continue
          }
        }
        // If a search term is provided, it's already matched in SQL via LIKE on raw_data
        // Additional term filtering on specific fields (optional)
        if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          const matches =
            (acc.account_number &&
              acc.account_number
                .toString()
                .toLowerCase()
                .includes(lowerTerm)) ||
            (acc.customer_name &&
              acc.customer_name.toLowerCase().includes(lowerTerm));
          if (!matches) {
            continue
          }
        }
        if (acc.product_code[0] == accType) {
          accounts.push(acc);
        }
      }
    }
    return accounts;
  } catch (error) {
    console.error("Error searching offline accounts:", error);
    return [];
  }
};

export const saveCollection = async (db, data) => {
  const query = `INSERT INTO td_collection (
    txn_no, acc_no, agent_code, amount, collected_at, current_balance, synced, receipt_printed, bank_id, branch_id, acc_type, prev_coll_dt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

  const params = [
    data.txn_no,
    data.acc_no,
    data.agent_code,
    data.amount,
    data.collected_at,
    data.current_balance,
    data.synced ? 1 : 0,
    data.receipt_printed ? 1 : 0,
    data.bank_id,
    data.branch_id,
    data.acc_type,
    data.prev_coll_dt
  ]

  try {
    await db.executeSql(query, params);
    // console.log(`Saved collection ${data.txn_no} locally.`);
  } catch (error) {
    console.error("Error saving collection:", error);
    throw error;
  }
};

// Save detailed collection row including balance after transaction
export const saveCollectionDetails = async (db, data) => {
  const query = `INSERT INTO td_collection_dtls (
      txn_no, acc_no, agent_code, amount, collected_at, current_balance, synced, receipt_printed, acc_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;
  const params = [
    data.txn_no,
    data.acc_no,
    data.agent_code,
    data.amount,
    data.collected_at,
    data.current_balance,
    data.synced ? 1 : 0,
    data.receipt_printed ? 1 : 0,
    data.acc_type
  ];
  try {
    await db.executeSql(query, params);
    // console.log(`Saved collection details ${data.txn_no} locally.`);
  } catch (error) {
    console.error("Error saving collection details:", error);
    throw error;
  }
};

export const updateLocalAccountBalance = async (db, accNo, newBalance) => {
  try {
    // We need to update raw_data because the app reads from it!
    const selectQuery = "SELECT raw_data FROM td_account_dtls WHERE acc_no = ?"
    const [results] = await db.executeSql(selectQuery, [accNo]);
    if (results.rows.length > 0) {
      const row = results.rows.item(0);
      if (row.raw_data) {
        const parsed = JSON.parse(row.raw_data);
        parsed.current_balance = newBalance;

        const updateQuery =
          "UPDATE td_account_dtls SET current_balance = ?, raw_data = ? WHERE acc_no = ?"
        await db.executeSql(updateQuery, [
          newBalance,
          JSON.stringify(parsed),
          accNo,
        ]);
        // console.log(`Updated local balance for ${accNo} to ${newBalance}`);
      }
    }
  } catch (error) {
    console.error("Error updating local balance:", error);
  }
};

export const addToSyncQueue = async (db, endpoint, method, payload) => {
  const query = `INSERT INTO sync_queue (
    endpoint, method, payload, created_at, status
  ) VALUES (?, ?, ?, ?, 'pending');`;

  const params = [
    endpoint,
    method,
    JSON.stringify(payload),
    new Date().toISOString(),
  ]

  try {
    const [result] = await db.executeSql(query, params);
    // console.log(`Added request to sync queue with ID: ${result.insertId}`);
    return result.insertId;
    console.error("Error adding to sync queue:", error);
    throw error;
  } catch (error) {
    console.error("Error updating local balance:", error);
  }
};

// export const clearSyncQueue = async (db) => {
//   const query = `DELETE FROM sync_queue;`;
//   try {
//     await db.executeSql(query);
//   } catch (error) {
//     console.error("Error clearing sync queue:", error);
//     throw error;
//   }
// };

export const getSyncCounts = async db => {
  const query = `
    SELECT 
      SUM(CASE WHEN synced = 0 THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN synced = 1 THEN 1 ELSE 0 END) as synced
    FROM td_collection;
  `;
  try {
    const [results] = await db.executeSql(query);
    const item = results.rows.item(0);
    return {
      pending: item.pending || 0,
      synced: item.synced || 0,
    }
  } catch (error) {
    console.error("Error fetching sync counts:", error);
    return { pending: 0, synced: 0 };
  }
};

export const getRecentTransactions = async (db, limit = 20) => {
  // Try original tables first
  const originalQuery = `
    SELECT c.*, a.customer_name 
    FROM td_collection c
    LEFT JOIN td_account_dtls a ON c.acc_no = a.acc_no
    ORDER BY c.collected_at DESC LIMIT ?;
  `;
  try {
    const [originalResults] = await db.executeSql(originalQuery, [limit]);
    if (originalResults.rows.length > 0) {
      const transactions = [];
      for (let i = 0; i < originalResults.rows.length; i++) {
        transactions.push(originalResults.rows.item(i));
      }
      return transactions;
    }
    // Fallback to backup tables
    const backupQuery = `
      SELECT c.*, a.customer_name 
      FROM td_collection_backup c
      LEFT JOIN td_account_dtls_backup a ON c.acc_no = a.acc_no
      ORDER BY c.collected_at DESC LIMIT ?;
    `;
    const [backupResults] = await db.executeSql(backupQuery, [limit]);
    const transactions = [];
    for (let i = 0; i < backupResults.rows.length; i++) {
      transactions.push(backupResults.rows.item(i));
    }
    return transactions;
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return [];
  }
};

export const getMiniStatementOffline = async (db, { bank_id, branch_code, agent_code, acc_num, account_type, fromDate, toDate }) => {
  const query = `
    SELECT acc_no as account_number,
           acc_type as trans_type,
           collected_at as PAID_DT,
           amount as PAID_AMT,
           current_balance as BALANCE_AMT,
           collected_at
    FROM (
      SELECT * FROM td_collection
      UNION
      SELECT * FROM td_collection_backup
    )
    WHERE bank_id = ?
      AND branch_id = ?
      AND agent_code = ?
      AND acc_no = ?
      AND acc_type = ?
      AND DATE(collected_at) BETWEEN ? AND ?
    ORDER BY collected_at DESC;
  `;
  try {
    const [result] = await db.executeSql(query, [bank_id, branch_code, agent_code, acc_num, account_type, fromDate, toDate]);
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return rows;
  } catch (error) {
    console.error('Error fetching MINI_STATEMENT_OFFLINE:', error);
    return [];
  }
};

export const getDuplicateReceiptsFromDB = async (db, paramsObj) => {
  const { bank_id, branch_code, agent_code, account_number, account_type } =
    paramsObj;
  console.log('params', paramsObj)
  const query = `
    SELECT c.*, a.customer_name, a.opening_date
    FROM (
      SELECT * FROM td_collection
      UNION
      SELECT * FROM td_collection_backup
    ) c
    LEFT JOIN (
      SELECT acc_no, customer_name, opening_date FROM td_account_dtls
      UNION
      SELECT acc_no, customer_name, opening_date FROM td_account_dtls_backup
    ) a ON c.acc_no = a.acc_no
    WHERE c.bank_id = ? AND c.branch_id = ? AND c.agent_code = ? AND c.acc_no = ? AND c.acc_type = ?
    ORDER BY c.collected_at DESC;
  `;
  const queryParams = [
    bank_id,
    branch_code,
    agent_code,
    account_number,
    account_type,
  ];
  try {
    const [result] = await db.executeSql(query, queryParams);
    const receipts = [];
    console.log(result.rows.item(0))
    for (let i = 0; i < result.rows.length; i++) {
      receipts.push(result.rows.item(i));
    }
    return receipts;
  } catch (error) {
    console.error("Error fetching duplicate receipts:", error);
    return [];
  }
};

export const getPendingSyncQueue = async db => {
  const query =
    "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC;"
  try {
    const [results] = await db.executeSql(query);
    const items = [];
    for (let i = 0; i < results.rows.length; i++) {
      items.push(results.rows.item(i));
    }
    return items;
  } catch (error) {
    console.error("Error fetching pending sync queue:", error);
    return [];
  }
};

// Get total collection amount from td_collection table
export const getTotalCollectionAmount = async db => {
  const query = `SELECT (
    (SELECT SUM(amount) FROM td_collection) +
    (SELECT SUM(amount) FROM td_collection_dtls)
  ) as total;`;
  try {
    const [result] = await db.executeSql(query);
    const row = result.rows.item(0);
    // SQLite returns null if there are no rows; default to 0
    return row?.total !== null && row?.total !== undefined ? row.total : 0;
  } catch (error) {
    console.error("Error fetching total collection amount:", error);
    return 0;
  }
};

export const getLatestTransactionDateByAccount = async (db, accNo) => {
  const query = `
    SELECT collected_at FROM (
      SELECT collected_at FROM td_collection WHERE acc_no = ?
      UNION ALL
      SELECT collected_at FROM td_collection_backup WHERE acc_no = ?
    ) ORDER BY collected_at DESC LIMIT 1;
  `;
  try {
    const [result] = await db.executeSql(query, [accNo, accNo]);
    if (result.rows.length > 0) {
      return result.rows.item(0).collected_at;
    }
    return ""
  } catch (error) {
    console.error("Error fetching latest transaction date:", error);
    return ""
  }
};

export const getLatestCollectionDate = async db => {
  const query = `
    SELECT collected_at FROM (
      SELECT collected_at FROM td_collection
      UNION ALL
      SELECT collected_at FROM td_collection_backup
    ) WHERE collected_at IS NOT NULL AND collected_at != ''
    ORDER BY collected_at DESC LIMIT 1;
  `;
  try {
    const [result] = await db.executeSql(query);
    if (result.rows.length > 0) {
      return result.rows.item(0).collected_at;
    }
    return ""
  } catch (error) {
    console.error("Error fetching latest collection date:", error);
    return ""
  }
};

export const markTransactionSynced = async (db, txnNo) => {
  const query = "UPDATE td_collection SET synced = 1 WHERE txn_no = ?;"
  try {
    const [result] = await db.executeSql(query, [txnNo]);
    // console.log(`Transaction ${txnNo} marked as synced. Rows affected: ${result.rowsAffected}`);
    return result;
  } catch (error) {
    console.error("Error marking transaction synced:", error);
    return null;
  }
};

export const removeFromSyncQueue = async (db, id) => {
  const query = "DELETE FROM sync_queue WHERE id = ?;"
  try {
    await db.executeSql(query, [id]);
    // console.log(`Item ${id} removed from sync queue.`);
  } catch (error) {
    console.error("Error removing from sync queue:", error);
  }
};

export const markTransactionSyncedFallback = async (db, accNo, date) => {
  const query =
    "UPDATE td_collection SET synced = 1 WHERE acc_no = ? AND collected_at = ? AND synced = 0;"
  try {
    const [result] = await db.executeSql(query, [accNo, date]);
    // console.log(`Fallback sync check for ${accNo} at ${date}: rows affected ${result.rowsAffected}`);
    return result;
  } catch (error) {
    console.error("Error in fallback sync update:", error);
    return null;
  }
};

// Fetch an account’s full data (including current_balance) by account number
export const getAccountByNumber = async (db, accNo) => {
  const query = "SELECT raw_data FROM td_account_dtls WHERE acc_no = ?"
  try {
    const [result] = await db.executeSql(query, [accNo]);
    if (result.rows.length > 0) {
      const row = result.rows.item(0);
      return row.raw_data ? JSON.parse(row.raw_data) : null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching account by number:", error);
    return null;
  }
};

export const reconcileOrphanSyncs = async db => {
  const query = `UPDATE td_collection SET synced = 1 WHERE synced = 0 AND NOT EXISTS (
    SELECT 1 FROM sync_queue WHERE status = 'pending'
  );`;
  try {
    const [result] = await db.executeSql(query);
    // console.log(`Reconciliation complete. Rows marked as synced: ${result.rowsAffected}`);
    return result.rowsAffected;
  } catch (error) {
    console.error("Error during sync reconciliation:", error);
    return 0;
  }
};

export const getDayScrollReport = async (db, { bank_id, branch_code, agent_code, account_type, fromDate, toDate }) => {

  console.log(bank_id, branch_code, agent_code, account_type, fromDate, toDate)
  // const query = `
  //   SELECT DATE(c.collected_at) as date,
  //          c.acc_type as account_type,
  //          c.acc_no as account_number,
  //          a.customer_name as account_holder_name,
  //          c.amount as deposit_amount,
  //          a.product_code,
  //          c.collected_at
  //   FROM (
  //     SELECT txn_no, acc_no, agent_code, amount, collected_at, current_balance, synced, receipt_printed, bank_id, branch_id, acc_type FROM td_collection
  //     UNION ALL
  //     SELECT txn_no, acc_no, agent_code, amount, collected_at, current_balance, synced, receipt_printed, bank_id, branch_id, acc_type FROM td_collection_backup
  //   ) c
  //   LEFT JOIN (
  //     SELECT acc_no, customer_name, product_code FROM td_account_dtls
  //     UNION ALL
  //     SELECT acc_no, customer_name, product_code FROM td_account_dtls_backup
  //   ) a ON c.acc_no = a.acc_no
  //   WHERE c.bank_id = ?
  //     AND c.branch_id = ?
  //     AND c.agent_code = ?
  //     AND c.acc_type = ?
  //     AND c.collected_at BETWEEN ? AND ?
  //   ORDER BY c.collected_at;
  // `;
  const query = `
    SELECT DATE(c.collected_at) as date,
            c.acc_type as account_type,
            c.acc_no as account_number,
            a.customer_name as account_holder_name,
            c.amount as deposit_amount,
            a.product_code,
            c.collected_at
     FROM (
       SELECT txn_no, acc_no, agent_code, amount, collected_at, current_balance, synced, receipt_printed, bank_id, branch_id, acc_type FROM td_collection
       UNION
       SELECT txn_no, acc_no, agent_code, amount, collected_at, current_balance, synced, receipt_printed, bank_id, branch_id, acc_type FROM td_collection_backup
     ) c
     LEFT JOIN (
       SELECT acc_no, customer_name, product_code FROM td_account_dtls
       UNION
       SELECT acc_no, customer_name, product_code FROM td_account_dtls_backup
     ) a ON c.acc_no = a.acc_no
     WHERE c.bank_id = ?
       AND c.branch_id = ?
       AND c.agent_code = ?
       AND c.acc_type = ?
       AND DATE(c.collected_at) BETWEEN ? AND ?
     ORDER BY c.collected_at;
   `;
  // const query = `
  //   select * from td_collection

  // `;

  try {
    console.log('query', query)
    const [result] = await db.executeSql(query, [bank_id, branch_code, agent_code, account_type, fromDate, toDate]);
    // const [result] = await db.executeSql(query);
    console.log(result.rows.item(0))
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
      console.log('row=', result.rows.item(i))
    }

    return rows;
  } catch (error) {
    console.error('Error fetching DAY_SCROLL_REPORT:', error);
    return [];
  }
};
export const getTypeWiseReport = async (db, { bank_id, branch_code, agent_code, account_type, fromDate, toDate }) => {
  const query = `
    SELECT DATE(c.collected_at) as date,
           c.acc_no as account_number,
           a.customer_name as account_holder_name,
           c.amount as deposit_amount,
           a.product_code
    FROM (
      SELECT * FROM td_collection
      UNION
      SELECT * FROM td_collection_backup
    ) c
    LEFT JOIN (
      SELECT acc_no, customer_name, product_code FROM td_account_dtls
      UNION
      SELECT acc_no, customer_name, product_code FROM td_account_dtls_backup
    ) a ON c.acc_no = a.acc_no
    WHERE c.bank_id = ?
      AND c.branch_id = ?
      AND c.agent_code = ?
      AND c.acc_type = ?
       AND DATE(c.collected_at) BETWEEN ? AND ?
      
    ORDER BY c.collected_at;
  `;
  console.log(query)
  try {
    const [result] = await db.executeSql(query, [bank_id, branch_code, agent_code, account_type, fromDate, toDate]);
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return rows;
  } catch (error) {
    console.error('Error fetching TYPE_WISE_REPORT:', error);
    return [];
  }
};
export const getNoWiseReport = async (db, { bank_id, branch_code, agent_code, account_type, fromDate, toDate }) => {
  const query = `
    SELECT DATE(c.collected_at) as date,
           c.acc_no as account_number,
           a.customer_name as account_holder_name,
           c.amount as deposit_amount,
           a.product_code
    FROM (
      SELECT * FROM td_collection
      UNION
      SELECT * FROM td_collection_backup
    ) c
    LEFT JOIN (
      SELECT acc_no, customer_name, product_code FROM td_account_dtls
      UNION
      SELECT acc_no, customer_name, product_code FROM td_account_dtls_backup
    ) a ON c.acc_no = a.acc_no
    WHERE c.bank_id = ?
      AND c.branch_id = ?
      AND c.agent_code = ?
      AND c.acc_type = ?
       AND DATE(c.collected_at) BETWEEN ? AND ?

    ORDER BY CAST(c.acc_no AS INTEGER) ASC, c.collected_at ASC;
  `;
  try {
    const [result] = await db.executeSql(query, [bank_id, branch_code, agent_code, account_type, fromDate, toDate]);
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return rows;
  } catch (error) {
    console.error('Error fetching NO_WISE_REPORT:', error);
    return [];
  }
};

export const getNonCollectionReport = async (db, { bank_id, branch_code, agent_code, account_type, dateTime }) => {
  const query = `
    SELECT 
           acc_type,
           product_code,
           acc_no as account_number,
           phone as mobile_no,
           customer_name,
           DATE(opening_date) as opening_date,
           current_balance
    FROM (
      SELECT * FROM td_account_dtls
      UNION
      SELECT * FROM td_account_dtls_backup
    )
    WHERE bank_id = ?
      AND branch_id = ?
      AND agent_code = ?
      AND acc_type = ?
      AND acc_no NOT IN (
        SELECT acc_no FROM td_collection
        UNION
        SELECT acc_no FROM td_collection_backup

      )
    ORDER BY acc_no;
  `;

  // console.log({ bank_id, branch_code, agent_code, account_type, dateTime }
  // )
  try {
    // const [result] = await db.executeSql(query, [bank_id, branch_code, agent_code, bank_id, branch_code, agent_code, account_type]);
    const [result] = await db.executeSql(query, [bank_id, branch_code, agent_code, account_type]);
    // const [result] = await db.executeSql(query);
    const rows = [];
    console.log(result.rows.item(0))
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return rows;
  } catch (error) {
    console.error('Error fetching NON_COLLECTION_REPORT:', error);
    return [];
  }
};


export const getMiniStatement = async (db, { bank_id, branch_code, agent_code, acc_num, account_type, fromDate, toDate }) => {
  const query = `
    SELECT acc_no as account_number,
           account_type as trans_type,
           collected_at as PAID_DT,
           amount as PAID_AMT,
           current_balance as BALANCE_AMT,
           collected_at
    FROM (
      SELECT * FROM td_collection
      UNION
      SELECT * FROM td_collection_backup
    )
    WHERE bank_id = ?
      AND branch_code = ?
      AND agent_code = ?
      AND acc_no = ?
      AND account_type = ?
      AND DATE(collected_at) BETWEEN ? AND ?
    ORDER BY collected_at DESC;
  `;
  try {
    const [result] = await db.executeSql(query, [bank_id, branch_code, agent_code, acc_num, account_type, fromDate, toDate]);
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return rows;
  } catch (error) {
    console.error('Error fetching MINI_STATEMENT:', error);
    return [];
  }
};

export const getDateWiseCollSummary = async (db, { bank_id, branch_code, agent_code, account_type, fromDate, toDate }) => {
  const query = `
    SELECT DATE(collected_at) as date,
           SUM(amount) as deposit_amount,
           COUNT(acc_no) as rcpts
    FROM (
      SELECT * FROM td_collection
      UNION
      SELECT * FROM td_collection_backup
    )
    WHERE bank_id = ?
      AND branch_id = ?
      AND agent_code = ?
      AND acc_type = ?
      AND DATE(collected_at) BETWEEN ? AND ?
    GROUP BY DATE(collected_at)
    ORDER BY DATE(collected_at) DESC;
  `;
  try {
    const [result] = await db.executeSql(query, [bank_id, branch_code, agent_code, account_type, fromDate, toDate]);
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return rows;
  } catch (error) {
    console.error('Error fetching DATE_WISE_COLL_SUMMARY:', error);
    return [];
  }
};

export const getLastFiveTransactions = async (db, { bank_id, branch_code, agent_code, account_type }) => {
  console.log(bank_id, branch_code, agent_code, account_type)

  const query = `
    SELECT DATE(c.collected_at) as date,
           c.acc_no as account_number,
           a.customer_name as account_holder_name,
           c.amount as deposit_amount
    FROM (
      SELECT * FROM td_collection
      UNION
      SELECT * FROM td_collection_backup
    ) c
    LEFT JOIN (
      SELECT acc_no, customer_name FROM td_account_dtls
      UNION
      SELECT acc_no, customer_name FROM td_account_dtls_backup
    ) a ON c.acc_no = a.acc_no
    WHERE c.bank_id = ?
      AND c.branch_id = ?
      AND c.agent_code = ?
      AND c.acc_type = ?
    ORDER BY c.collected_at DESC
    LIMIT 5;
  `;
  // const query = `select agent_code from td_collection`
  console.log(query)
  try {
    const [result] = await db.executeSql(query, [bank_id, branch_code, agent_code, account_type]);
    // const [result] = await db.executeSql(query);
    const rows = [];
    console.log(result.rows.length)
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return rows;
  } catch (error) {
    console.error('Error fetching LAST_FIVE_TRANSACTIONS:', error);
    return [];
  }
};

export const getDayTotalReport = async (db, { bank_id, branch_code, agent_code, fromDate, toDate }) => {
  const query = `
    SELECT DATE(collected_at) as trns_date,
           SUM(amount) as tot_col_amt,
           COUNT(agent_code) as tot_col
    FROM (
      SELECT * FROM td_collection
      UNION
      SELECT * FROM td_collection_backup
    )
    WHERE bank_id = ?
      AND branch_id = ?
      AND agent_code = ?
      AND DATE(collected_at) BETWEEN ? AND ?
    GROUP BY DATE(collected_at)
    ORDER BY DATE(collected_at) DESC;
  `;
  try {
    const [result] = await db.executeSql(query, [bank_id, branch_code, agent_code, fromDate, toDate]);
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return rows;
  } catch (error) {
    console.error('Error fetching DAY_TOTAL_REPORT:', error);
    return [];
  }
};

