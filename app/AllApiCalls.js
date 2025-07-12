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

/**
 * Run optimisation (async or sync)
 * @param {Object} params
 * @param {Object} params.statement - The strategy statement
 * @param {Object} params.files - The files to upload
 * @param {string|null} [params.strategy_statement_id] - Optional strategy statement ID
 * @param {boolean} [params.wait] - If true, wait for completion and return result in response
 */
export const runOptimisation = async ({ statement, files, strategy_statement_id = null, wait = false }) => {
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

  // Attach each file using its timeframe key
  for (const [timeframe, file] of Object.entries(files)) {
    formData.append(timeframe, file)
  }
  try {
    const response = await Fetch("/api/run-optimisation/", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error?.error || "Failed to start optimisation")
    }
    const data = await response.json();
    console.log("Optimisation response:", data);
    return data;
  } catch (err) {
    console.error("Optimisation request failed:", err);
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



export const fetchStatement = async (page = 1, pageSize = 10) => {
  const accountId = localStorage.getItem("user_id")
  if (!accountId) throw new Error("Account ID not found")

  const response = await Fetch(
    `/api/strategies/?page=${page}&page_size=${pageSize}&account=${accountId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )

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
export async function updateStrategyTradingType(id, tradingtype) {
  try {
    // Create the base trading type object
    const tradingTypeObj = {
      NewTrade: tradingtype.NewTrade,
      commission: 0.0002,
      margin: tradingtype.margin,
      lot: tradingtype.lot,
      cash: tradingtype.cash,
    }

    // Only include nTrade_max if it exists in the tradingtype object
    if (tradingtype.nTrade_max !== undefined) {
      tradingTypeObj.nTrade_max = tradingtype.nTrade_max
    }

    const response = await Fetch(`/api/strategies/${id}/edit/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        TradingType: tradingTypeObj,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update tradingtype: ${response.status}`)
    }

    return await response.json()
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

    return await response.json()
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

export const runWalkForwardOptimisation = async ({ statement, files, strategy_statement_id = null, wait = false, walk_forward_setting = null }) => {
  const formData = new FormData()

  // Log the payload being sent
  console.log("🚀 WALK FORWARD OPTIMIZATION PAYLOAD:");
  console.log("📋 Statement:", statement);
  console.log("📁 Files:", Object.keys(files));
  console.log("🆔 Strategy Statement ID:", strategy_statement_id);
  console.log("⏳ Wait:", wait);
  console.log("⚙️ Walk Forward Settings:", walk_forward_setting);

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

  // Attach each file using its timeframe key
  for (const [timeframe, file] of Object.entries(files)) {
    formData.append(timeframe, file)
    console.log(`📎 Attached file: ${timeframe} -> ${file.name} (${file.size} bytes)`);
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

