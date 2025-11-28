import { Fetch } from "./usefetch"

export const checkUserExists = async (userInput) => {
  try {
    const response = await Fetch(`/api/getuserfromuserinput/${userInput}`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error("Failed to check user existence")
    }
    return response.json()
  } catch (error) {
    console.error(error)
    throw error
  }
}

// export const createAccount = async (email) => {
//   try {
//     const response = await Fetch('/api/createaccount/', {
//       method: 'POST',
//       body: JSON.stringify({ email }),
//     });

//     if (!response.ok) {
//       throw new Error('Failed to create account');
//     }
//     return response.json();
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

// AllApiCalls.js

export const createAccount = async ({ username, email, password }) => {
  try {
    const response = await Fetch("/api/createaccount/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData?.detail || "Failed to create account")
    }

    return response.json()
  } catch (error) {
    console.error("Create Account Error:", error)
    throw error
  }
}

export const sendOtpEmail = async (email) => {
  try {
    const response = await Fetch(`/api/sendotpemail/${email}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData?.detail || "Failed to send OTP")
    }

    return response.json()
  } catch (error) {
    console.error("Send OTP Error:", error)
    throw error
  }
}

export const verifyOtp = async ({ login_identifier, password }) => {
  try {
    const response = await Fetch(`/api/customtoken/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login_identifier, password }),
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData?.detail || "OTP verification failed")
    }

    return await response.json() // will return the token or response body
  } catch (error) {
    console.error("OTP Verification Error:", error)
    throw error
  }
}

export const loginUser = async ({ email, password }) => {
  try {
    const response = await Fetch("/api/customtoken/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login_identifier: email,
        password: password,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err?.detail || "Login failed")
    }

    return await response.json() // { token: "..." }
  } catch (error) {
    console.error("Login Error:", error)
    throw error
  }
}

// AllApiCalls.js
export const resetPassword = async ({ login_identifier, new_password }) => {
  const response = await Fetch("/api/resetpassword/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ login_identifier, new_password }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err?.detail || "Failed to reset password")
  }

  return response.json()
}

export const getUserProfile = async (userId) => {

  const response = await Fetch(`/api/profile/${userId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch profile")
  }

  const data = await response.json()
  return data
}

export const updateUserProfile = async (userId, updatedData) => {
  const token = localStorage.getItem("auth_token")

  const response = await Fetch(`/api/profile/${userId}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedData),
  })

  if (!response.ok) {
    throw new Error("Failed to update profile")
  }

  return response.json()
}

export const sendOtp = async (email) => {
  try {
    const response = await Fetch(`/api/sendotpemail/${email}/`, {
      method: "PUT",
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      throw new Error("Failed to send OTP")
    }
    return response.json()
  } catch (error) {
    console.error(error)
    throw error
  }
}

// src/api/runBacktest.js or .ts

export const runBacktest = async ({ statement, files }) => {
  const formData = new FormData()

  // Attach the statement JSON as a string
  formData.append("statement", JSON.stringify(statement))

  // Attach each file using its timeframe key
  // Example: files = { "3h": File, "15min": File }
  for (const [timeframe, file] of Object.entries(files)) {
    formData.append(timeframe, file)
  }

  const response = await Fetch("/api/run-backtest/", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error?.error || "Failed to start backtest")
  }

  return response.json()
}

// NOTE: 'Fetch' is a custom wrapper for the browser fetch API, used for consistent error handling and headers.
// If you want to use the native fetch, replace all 'Fetch' with 'fetch'.

// Add this new function for MetaAPI integration
export const runBacktestWithMetaAPI = async (strategy, token, accountId, symbol) => {
  // Debug logging
  console.log('🔍 MetaAPI Debug Info:', {
    tokenLength: token?.length || 0,
    accountId: accountId,
    symbol: symbol,
    tokenPrefix: token?.substring(0, 20) + '...',
    hasToken: !!token,
    hasAccountId: !!accountId
  });

  const formData = new FormData();
  formData.append('statement', JSON.stringify(strategy));
  formData.append('metaapi_token', token);
  formData.append('metaapi_account_id', accountId);
  formData.append('symbol', symbol);
  
  try {
    const response = await Fetch('/api/run-backtest/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('🔍 MetaAPI Backend Error:', error);
      throw new Error(error?.error || error?.message || 'Failed to start backtest with MetaAPI');
    }

    return response.json();
  } catch (error) {
    console.error('🔍 MetaAPI Request Error:', error);
    throw error;
  }
};

// New: Check available timeframes for a symbol via MetaAPI
export const getSymbolTimeframes = async ({ metaapi_token, metaapi_account_id, symbol }) => {
  const response = await Fetch('/api/get-symbol-timeframes/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metaapi_token, metaapi_account_id, symbol }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error?.error || error?.message || 'Failed to check symbol timeframes')
  }
  return response.json()
}

// New: Validate a strategy against MetaAPI timeframes
export const validateStrategyMetaapi = async ({ statement, metaapi_token, metaapi_account_id, symbol }) => {
  const response = await Fetch('/api/validate-strategy-metaapi/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      statement: JSON.stringify(statement),
      metaapi_token,
      metaapi_account_id,
      symbol,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error?.error || error?.message || 'Failed to validate strategy')
  }
  return response.json()
}

// New: Get all broker symbols (optionally filtered)
export const getAllBrokerSymbols = async ({ metaapi_token, metaapi_account_id, filter = undefined }) => {
  const payload = { metaapi_token, metaapi_account_id }
  if (filter) payload.filter = filter

  const response = await Fetch('/api/get-all-broker-symbols/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error?.error || error?.message || 'Failed to fetch broker symbols')
  }
  return response.json()
}

// New: Find symbols with available timeframe(s)
export const findSymbolsWithTimeframe = async ({ metaapi_token, metaapi_account_id, symbol, timeframes }) => {
  const response = await Fetch('/api/find-symbols-with-timeframe/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metaapi_token, metaapi_account_id, symbol, timeframes }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error?.error || error?.message || 'Failed to find symbols with timeframe')
  }
  return response.json()
}

/**
 * Run optimisation (async or sync)
 * @param {Object} params
 * @param {Object} params.statement - The strategy statement
 * @param {Object} [params.files] - The files to upload (required if not using MetaAPI)
 * @param {string|null} [params.strategy_statement_id] - Optional strategy statement ID
 * @param {boolean} [params.wait] - If true, wait for completion and return result in response
 * @param {string|null} [params.metaapi_token] - MetaAPI token (for MetaAPI mode)
 * @param {string|null} [params.metaapi_account_id] - MetaAPI account ID (for MetaAPI mode)
 * @param {string|null} [params.symbol] - Trading symbol (for MetaAPI mode)
 */
export const runOptimisation = async ({ 
  statement, 
  files = null, 
  strategy_statement_id = null, 
  wait = false,
  metaapi_token = null,
  metaapi_account_id = null,
  symbol = null 
}) => {
  // Validate input: either files OR MetaAPI credentials must be provided
  const isMetaAPIMode = metaapi_token && metaapi_account_id && symbol;
  const isFileMode = files && Object.keys(files).length > 0;

  if (!isMetaAPIMode && !isFileMode) {
    throw new Error("Either files or MetaAPI credentials (token, account_id, symbol) must be provided");
  }

  // Debug logging for MetaAPI mode
  if (isMetaAPIMode) {
    console.log('🔍 MetaAPI Optimisation Debug Info:', {
      tokenLength: metaapi_token?.length || 0,
      accountId: metaapi_account_id,
      symbol: symbol,
      tokenPrefix: metaapi_token?.substring(0, 20) + '...',
      hasToken: !!metaapi_token,
      hasAccountId: !!metaapi_account_id
    });
  }

  const formData = new FormData()

  // Attach the statement JSON as a string
  formData.append("statement", JSON.stringify(statement))

  // Attach strategy statement ID if provided
  if (strategy_statement_id) {
    formData.append("strategy_statement_id", strategy_statement_id)
  }

  // Attach wait if requested
  if (wait) {
    formData.append("wait", "true")
  }

  // MetaAPI mode: attach MetaAPI credentials
  if (isMetaAPIMode) {
    formData.append("metaapi_token", metaapi_token)
    formData.append("metaapi_account_id", metaapi_account_id)
    formData.append("symbol", symbol)
    console.log('📡 Running optimisation with MetaAPI');
  }

  // File upload mode: attach each file using its timeframe key
  if (isFileMode) {
    for (const [timeframe, file] of Object.entries(files)) {
      formData.append(timeframe, file)
    }
    console.log('📁 Running optimisation with file upload');
  }

  try {
    const response = await Fetch("/api/run-optimisation/", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('🔍 Optimisation Backend Error:', error);
      throw new Error(error?.error || "Failed to start optimisation")
    }
    const data = await response.json();
    console.log("✅ Optimisation response:", data);
    return data;
  } catch (err) {
    console.error("❌ Optimisation request failed:", err);
    throw err;
  }
}


// AllApiCalls.ts
export const createStatement = async ({ account, statement }) => {
  const payload = {
    account,
    name: statement.name,
    side: statement.side,
    saveresult: statement.saveresult,
    strategy: statement.strategy,
    instrument: statement.instrument || "XAU/USD",  // use default if not provided
  }

  // Add optional fields if they exist
  if (statement.Equity !== undefined && statement.Equity !== null) {
    payload.Equity = statement.Equity
  }

  if (statement.tradingtype !== undefined && statement.tradingtype !== null) {
    payload.tradingtype = statement.tradingtype
  }

  const response = await Fetch("/api/strategies/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error?.error || "Failed to create statement")
  }

  return response.json()
}



export const fetchStatement = async (page = 1, pageSize = 10, search = "") => {
  const accountId = localStorage.getItem("user_id")
  if (!accountId) throw new Error("Account ID not found")

  let url = `/api/strategies/?page=${page}&page_size=${pageSize}&account=${accountId}`
  
  // Add search parameter if provided
  if (search && search.trim()) {
    url += `&search=${encodeURIComponent(search.trim())}`
  }

  const response = await Fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) throw new Error("Failed to fetch strategies")

  const data = await response.json()

  return {
    total: data.count,
    next: data.next,
    previous: data.previous,
    strategies: data.results,
  }
}



  export const fetchStatementDetail = async (id) => {
    const response = await Fetch(`/api/strategies/${id}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error?.detail || "Failed to fetch statement detail")
    }

    return response.json()
  }

export const deleteStatement = async (statement_id) => {
  const response = await Fetch(`/api/strategies/${statement_id}/delete/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error?.detail || "Failed to delete statement")
  }

  return response.json()
}
export const updateStatement = async (statement_id, updatedData) => {
  const response = await Fetch(`/api/strategies/${statement_id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error?.detail || "Failed to update statement")
  }

  return response.json()
}



// API functions for strategy testing

/**
 * Update strategy with new parameters
 * @param {number} strategyId - The ID of the strategy to update
 * @param {number} accountId - The account ID
 * @param {string} side - The trading side (buy/sell)
 * @param {string} saveResult - Whether to save the result
 * @param {string} strID - Strategy ID
 * @param {number} nTradeMax - Maximum number of trades
 * @param {number} margin - Margin value
 * @param {string} lot - Lot size
 * @param {number} cash - Account deposit amount
 * @returns {Promise} - Promise with the API response
 */
export async function updateStrategyTradingType(id, tradingtype, tradingSession = null) {
  try {
    // Create the base trading type object
    const tradingTypeObj = {
      NewTrade: tradingtype.NewTrade,
      commission: tradingtype.commission, // Use dynamic commission from form
      margin: tradingtype.margin,
      lot: tradingtype.lot,
      cash: tradingtype.cash,
      asset_type: tradingtype.asset_type, // Add the asset type
    }

    // Only include nTrade_max if it exists in the tradingtype object
    if (tradingtype.nTrade_max !== undefined) {
      tradingTypeObj.nTrade_max = tradingtype.nTrade_max
    }

    // Create the request body
    const requestBody = {
      TradingType: tradingTypeObj,
    }

    // Add TradingSession if provided
    if (tradingSession) {
      requestBody.TradingSession = tradingSession
    }

    // Debug logging
    console.log("🔍 DEBUG: updateStrategyTradingType request body:", JSON.stringify(requestBody, null, 2))
    console.log("🔍 DEBUG: TradingSession in request body:", requestBody.TradingSession)

    const response = await Fetch(`/api/strategies/${id}/edit/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Failed to update tradingtype: ${response.status}`)
    }

    const responseData = await response.json()
    console.log("🔍 DEBUG: updateStrategyTradingType response:", JSON.stringify(responseData, null, 2))
    return responseData
  } catch (error) {
    console.error("Error updating tradingtype:", error)
    throw error
  }
}


/**
 * Updates a strategy with new name and instrument
 * @param {string} id - The strategy ID to update
 * @param {object} data - The data containing name and instrument
 * @returns {Promise} Promise with the updated strategy data
 */
export async function editStrategy(id, data) {
  try {
    // Debug logging
    console.log("🔍 DEBUG: editStrategy data being sent:", JSON.stringify(data, null, 2))
    
    const response = await Fetch(`/api/strategies/${id}/edit/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to update strategy: ${response.status}`)
    }

    const responseData = await response.json()
    console.log("🔍 DEBUG: editStrategy response:", JSON.stringify(responseData, null, 2))
    return responseData
  } catch (error) {
    console.error("Error updating strategy:", error)
    throw error
  }
}
export const changePassword = async (old_password, new_password,user_id) => {

  const response = await Fetch(`/api/change-password/${user_id}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    
    },
    body: JSON.stringify({ old_password, new_password }),
  })

  if (!response.ok) {
    throw new Error("Failed to change password")
  }

  return response.json()
}
export const saveOptimisationInput = async (jsonSt, ui_data) => {
  const response = await Fetch("/api/optimisation/save/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jsonSt, ui_data }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to save optimisation input");
  }

  return response.json();
};

// New API functions for optimization results management

export const getOptimisationStatus = async (taskId) => {
  const response = await Fetch(`/api/optimisation-status/${taskId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get optimisation status");
  }

  return response.json();
};

export const getOptimizationResults = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.strategy_statement_id) {
    queryParams.append('strategy_statement_id', params.strategy_statement_id);
  }
  if (params.account_id) {
    queryParams.append('account_id', params.account_id);
  }
  if (params.status) {
    queryParams.append('status', params.status);
  }
  if (params.algorithm) {
    queryParams.append('algorithm', params.algorithm);
  }
  if (params.page) {
    queryParams.append('page', params.page);
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size);
  }

  const response = await Fetch(`/api/optimization-results/?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get optimization results");
  }

  return response.json();
};

export const getOptimizationResultDetail = async (optimizationId) => {
  const response = await Fetch(`/api/optimization-results/${optimizationId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get optimization result detail");
  }

  return response.json();
};

export const deleteOptimizationResult = async (optimizationId) => {
  const response = await Fetch(`/api/optimization-results/${optimizationId}/delete/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete optimization result");
  }

  return response.json();
};

export const getStrategyOptimizationResults = async (strategyStatementId, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) {
    queryParams.append('page', params.page);
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size);
  }

  const response = await Fetch(`/api/strategies/${strategyStatementId}/optimization-results/?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get strategy optimization results");
  }

  return response.json();
};

// Walk Forward Optimization API functions

/**
 * Run walk forward optimisation (async or sync)
 * @param {Object} params
 * @param {Object} params.statement - The strategy statement
 * @param {Object} [params.files] - The files to upload (required if not using MetaAPI)
 * @param {string|null} [params.strategy_statement_id] - Optional strategy statement ID
 * @param {boolean} [params.wait] - If true, wait for completion and return result in response
 * @param {Object|null} [params.walk_forward_setting] - Walk forward optimization settings
 * @param {string|null} [params.metaapi_token] - MetaAPI token (for MetaAPI mode)
 * @param {string|null} [params.metaapi_account_id] - MetaAPI account ID (for MetaAPI mode)
 * @param {string|null} [params.symbol] - Trading symbol (for MetaAPI mode)
 */
export const runWalkForwardOptimisation = async ({ 
  statement, 
  files = null, 
  strategy_statement_id = null, 
  wait = false, 
  walk_forward_setting = null,
  metaapi_token = null,
  metaapi_account_id = null,
  symbol = null 
}) => {
  // Validate input: either files OR MetaAPI credentials must be provided
  const isMetaAPIMode = metaapi_token && metaapi_account_id && symbol;
  const isFileMode = files && Object.keys(files).length > 0;

  if (!isMetaAPIMode && !isFileMode) {
    throw new Error("Either files or MetaAPI credentials (token, account_id, symbol) must be provided");
  }

  // Log the payload being sent
  console.log("🚀 WALK FORWARD OPTIMIZATION PAYLOAD:");
  console.log("📋 Statement:", statement);
  console.log("📁 Files:", isFileMode ? Object.keys(files) : 'N/A (using MetaAPI)');
  console.log("🆔 Strategy Statement ID:", strategy_statement_id);
  console.log("⏳ Wait:", wait);
  console.log("⚙️ Walk Forward Settings:", walk_forward_setting);
  
  // Debug logging for MetaAPI mode
  if (isMetaAPIMode) {
    console.log('🔍 MetaAPI Walk Forward Optimisation Debug Info:', {
      tokenLength: metaapi_token?.length || 0,
      accountId: metaapi_account_id,
      symbol: symbol,
      tokenPrefix: metaapi_token?.substring(0, 20) + '...',
      hasToken: !!metaapi_token,
      hasAccountId: !!metaapi_account_id
    });
  }

  const formData = new FormData()

  // Attach the statement JSON as a string
  formData.append("statement", JSON.stringify(statement))

  // Attach walk_forward_setting if provided
  if (walk_forward_setting) {
    formData.append("walk_forward_setting", JSON.stringify(walk_forward_setting))
  }

  // Attach strategy statement ID if provided
  if (strategy_statement_id) {
    formData.append("strategy_statement_id", strategy_statement_id)
  }

  // Attach wait if requested
  if (wait) {
    formData.append("wait", "true")
  }

  // MetaAPI mode: attach MetaAPI credentials
  if (isMetaAPIMode) {
    formData.append("metaapi_token", metaapi_token)
    formData.append("metaapi_account_id", metaapi_account_id)
    formData.append("symbol", symbol)
    console.log('📡 Running walk forward optimisation with MetaAPI');
  }

  // File upload mode: attach each file using its timeframe key
  if (isFileMode) {
    for (const [timeframe, file] of Object.entries(files)) {
      formData.append(timeframe, file)
      console.log(`📎 Attached file: ${timeframe} -> ${file.name} (${file.size} bytes)`);
    }
    console.log('📁 Running walk forward optimisation with file upload');
  }

  // Log the FormData contents
  console.log("📦 FormData contents:");
  for (let [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      console.log(`  ${key}: ${value.substring(0, 200)}${value.length > 200 ? '...' : ''}`);
    } else {
      console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
    }
  }

  try {
    const response = await Fetch("/api/run-walkforward-optimisation/", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('🔍 Walk Forward Optimisation Backend Error:', error);
      throw new Error(error?.error || "Failed to start walk forward optimisation")
    }
    const data = await response.json();
    console.log("✅ Walk Forward Optimisation response:", data);
    return data;
  } catch (err) {
    console.error("❌ Walk Forward Optimisation request failed:", err);
    throw err;
  }
};

export const getWalkForwardOptimizationResults = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.strategy_statement_id) {
    queryParams.append('strategy_statement_id', params.strategy_statement_id);
  }
  if (params.status) {
    queryParams.append('status', params.status);
  }
  if (params.algorithm) {
    queryParams.append('algorithm', params.algorithm);
  }
  if (params.page) {
    queryParams.append('page', params.page);
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size);
  }

  const response = await Fetch(`/api/walkforward-optimization-results/?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get walk forward optimization results");
  }

  return response.json();
};

export const getWalkForwardOptimizationResultDetail = async (optimizationId) => {
  console.log("API call: getWalkForwardOptimizationResultDetail for ID:", optimizationId)
  
  const response = await Fetch(`/api/walkforward-optimization-results/${optimizationId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log("API response status:", response.status, response.ok)

  if (!response.ok) {
    const errorData = await response.json();
    console.error("API error response:", errorData)
    throw new Error(errorData.error || "Failed to get walk forward optimization result detail");
  }

  const data = await response.json();
  console.log("API response data:", data)
  return data;
};

export const deleteWalkForwardOptimizationResult = async (optimizationId) => {
  const response = await Fetch(`/api/walkforward-optimization-results/${optimizationId}/delete/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete walk forward optimization result");
  }

  return response.json();
};

export const getStrategyWalkForwardOptimizationResults = async (strategyStatementId, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) {
    queryParams.append('page', params.page);
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size);
  }

  const response = await Fetch(`/api/strategies/${strategyStatementId}/walkforward-optimization-results/?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get strategy walk forward optimization results");
  }

  return response.json();
};

// Optimization Droplets API Functions

/**
 * Step 2: Get cost estimates for optimization before starting
 * Endpoint: GET /api/optimization-costs/
 * Purpose: Show user estimated costs before starting optimization
 * Headers: Authorization: Bearer {token}
 * Response: Cost estimates for regular vs walk-forward optimization
 */
export const getOptimizationCosts = async () => {
  const response = await Fetch("/api/optimization-costs/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get optimization costs");
  }

  return response.json();
};

/**
 * Step 3: Create optimization job (start optimization with droplet)
 * Endpoint: POST /api/optimization-jobs/create/
 * Purpose: Start the optimization process
 * Headers: Authorization: Bearer {token}, Content-Type: application/json
 * Response: Job ID, droplet ID, estimated cost
 * 
 * NOTE: Backend fetches strategy from database using strategy_statement_id, so NO statement parameter needed!
 * 
 * @param {Object} params
 * @param {string} params.strategy_statement_id - REQUIRED: Strategy statement ID (backend fetches from DB)
 * @param {string} [params.type] - Type of optimization: "regular" or "walk_forward" (default: "regular")
 * @param {Object} [params.files] - The files to upload (required if not using MetaAPI)
 * @param {Object|null} [params.walk_forward_settings] - Walk forward optimization settings (for walk_forward type)
 * @param {File|null} [params.csvFile] - CSV file for the backend (optional)
 * @param {string|null} [params.metaapi_token] - MetaAPI token (for MetaAPI mode)
 * @param {string|null} [params.metaapi_account_id] - MetaAPI account ID (for MetaAPI mode)
 * @param {string|null} [params.symbol] - Trading symbol (for MetaAPI mode)
 */
export const createOptimizationJob = async ({ 
  strategy_statement_id, // REQUIRED - backend fetches strategy from DB
  type = "regular", 
  files = null, 
  walk_forward_settings = null,
  csvFile = null,
  metaapi_token = null,
  metaapi_account_id = null,
  symbol = null 
}) => {
  // Validate required parameters
  if (!strategy_statement_id) {
    throw new Error("strategy_statement_id is required");
  }

  // Validate input: either files OR MetaAPI credentials must be provided
  const isMetaAPIMode = metaapi_token && metaapi_account_id && symbol;
  const isFileMode = files && Object.keys(files).length > 0;

  if (!isMetaAPIMode && !isFileMode) {
    throw new Error("Either files or MetaAPI credentials (token, account_id, symbol) must be provided");
  }

  // Debug logging
  console.log("🚀 OPTIMIZATION JOB PAYLOAD:");
  console.log("🆔 Strategy Statement ID:", strategy_statement_id);
  console.log("🔧 Optimization Type:", type);
  console.log("📁 Files:", isFileMode ? Object.keys(files) : 'N/A (using MetaAPI)');
  console.log("⚙️ Walk Forward Settings:", walk_forward_settings);

  // Debug logging for MetaAPI mode
  if (isMetaAPIMode) {
    console.log('🔍 MetaAPI Optimization Job Debug Info:', {
      tokenLength: metaapi_token?.length || 0,
      accountId: metaapi_account_id,
      symbol: symbol,
      tokenPrefix: metaapi_token?.substring(0, 20) + '...',
      hasToken: !!metaapi_token,
      hasAccountId: !!metaapi_account_id
    });
  }

  const formData = new FormData();

  // ❌ DO NOT send statement - backend fetches from database!
  // ✅ Send strategy_statement_id instead
  formData.append("strategy_statement_id", strategy_statement_id);

  // Attach optimization type (backend expects 'type')
  formData.append("type", type);

  // Attach walk forward settings if provided (backend expects 'walk_forward_settings')
  if (walk_forward_settings) {
    formData.append("walk_forward_settings", JSON.stringify(walk_forward_settings));
    console.log("📋 Walk forward settings attached:", JSON.stringify(walk_forward_settings));
  }

  // MetaAPI mode: attach MetaAPI credentials
  if (isMetaAPIMode) {
    formData.append("metaapi_token", metaapi_token);
    formData.append("metaapi_account_id", metaapi_account_id);
    formData.append("symbol", symbol);
    console.log('📡 Creating optimization job with MetaAPI');
  }

  // File upload mode: attach files
  if (isFileMode) {
    // Attach each file using its timeframe key
    for (const [timeframe, file] of Object.entries(files)) {
      formData.append(timeframe, file);
    }

    // Attach the CSV file for the backend
    if (csvFile) {
      formData.append("csvFile", csvFile);
    } else {
      // Fallback: use the first file from the files object if csvFile not provided
      const fileEntries = Object.entries(files);
      if (fileEntries.length > 0) {
        const [, firstFile] = fileEntries[0];
        formData.append("csvFile", firstFile);
      }
    }
    console.log('📁 Creating optimization job with file upload');
  }

  try {
    const response = await Fetch("/api/optimization-jobs/create/", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('🔍 Optimization Job Backend Error:', errorData);
      throw new Error(errorData.error || "Failed to create optimization job");
    }

    const data = await response.json();
    console.log("✅ Optimization job created:", data);
    return data;
  } catch (err) {
    console.error("❌ Optimization job creation failed:", err);
    throw err;
  }
};

/**
 * Step 4: Get optimization job status and results (for polling)
 * Endpoint: GET /api/optimization-jobs/{job_id}/
 * Purpose: Check job progress every 5-10 seconds
 * Headers: Authorization: Bearer {token}
 * Status Values: creating_droplet, running, completed, failed, cancelled
 */
export const getOptimizationJob = async (jobId) => {
  const response = await Fetch(`/api/optimization-jobs/${jobId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get optimization job");
  }

  return response.json();
};

/**
 * Step 6: Cancel optimization job
 * Endpoint: POST /api/optimization-jobs/{job_id}/cancel/
 * Purpose: Allow user to cancel running optimization
 * Headers: Authorization: Bearer {token}
 * Response: Confirmation of cancellation
 */
export const cancelOptimizationJob = async (jobId) => {
  const response = await Fetch(`/api/optimization-jobs/${jobId}/cancel/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to cancel optimization job");
  }

  return response.json();
};

/**
 * Step 7: List all optimization jobs for the user
 * Endpoint: GET /api/optimization-jobs/
 * Purpose: Show user's optimization history
 * Headers: Authorization: Bearer {token}
 * Query Params: limit=20, offset=0 (for pagination)
 */
export const listOptimizationJobs = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.limit) {
    queryParams.append('limit', params.limit);
  }
  if (params.offset) {
    queryParams.append('offset', params.offset);
  }
  if (params.status) {
    queryParams.append('status', params.status);
  }

  const response = await Fetch(`/api/optimization-jobs/?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to list optimization jobs");
  }

  return response.json();
};

/**
 * Get Walk Forward Optimization results from droplet job
 * Endpoint: GET /api/optimization-jobs/{job_id}/
 * Purpose: Get walk forward optimization results with hypothesis testing
 * Response includes: z_statistic, p_value, hypothesis_decision, avg_validation_return, etc.
 */
export const getWalkForwardDropletResults = async (jobId) => {
  const response = await Fetch(`/api/optimization-jobs/${jobId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get walk forward optimization results");
  }

  return response.json();
};

/**
 * List all walk forward optimization jobs for a strategy (from droplets)
 * Endpoint: GET /api/strategies/{id}/walkforward-optimizations/
 * Returns: List of walk forward optimization jobs with through_droplet flag
 */
export const listStrategyWalkForwardJobs = async (strategyId) => {
  const response = await Fetch(`/api/strategies/${strategyId}/walkforward-optimizations/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to list walk forward optimization jobs");
  }

  return response.json();
};

// Backtest Results API Functions

/**
 * Get all backtest results with optional filtering
 * @param {Object} params - Query parameters
 * @param {string} [params.strategy_statement_id] - Filter by strategy ID
 * @param {string} [params.account_id] - Filter by account ID
 * @param {string} [params.status] - Filter by status (completed/failed)
 * @param {string} [params.data_source] - Filter by data source (metaapi/file_upload)
 * @param {number} [params.page] - Page number for pagination
 * @param {number} [params.page_size] - Results per page
 */
export const getBacktestResults = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.strategy_statement_id) {
    queryParams.append('strategy_statement_id', params.strategy_statement_id);
  }
  if (params.account_id) {
    queryParams.append('account_id', params.account_id);
  }
  if (params.status) {
    queryParams.append('status', params.status);
  }
  if (params.data_source) {
    queryParams.append('data_source', params.data_source);
  }
  if (params.page) {
    queryParams.append('page', params.page);
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size);
  }

  const response = await Fetch(`/api/backtest-results/?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get backtest results");
  }

  return response.json();
};

/**
 * Get backtest results for a specific strategy
 * @param {string} strategyStatementId - The strategy ID
 * @param {Object} params - Query parameters
 * @param {number} [params.page] - Page number for pagination
 * @param {number} [params.page_size] - Results per page
 */
export const getStrategyBacktestResults = async (strategyStatementId, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) {
    queryParams.append('page', params.page);
  }
  if (params.page_size) {
    queryParams.append('page_size', params.page_size);
  }

  const response = await Fetch(`/api/strategies/${strategyStatementId}/backtest-results/?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get strategy backtest results");
  }

  return response.json();
};

/**
 * Get detailed backtest result by ID
 * @param {string} backtestId - The backtest result ID
 */
export const getBacktestResultDetail = async (backtestId) => {
  const response = await Fetch(`/api/backtest-results/${backtestId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get backtest result detail");
  }

  return response.json();
};

/**
 * Delete a backtest result
 * @param {string} backtestId - The backtest result ID to delete
 */
export const deleteBacktestResult = async (backtestId) => {
  const response = await Fetch(`/api/backtest-results/${backtestId}/delete/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete backtest result");
  }

  return response.json();
};

