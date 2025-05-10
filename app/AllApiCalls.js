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
  const token = localStorage.getItem("auth_token")
  if (!token) {
    throw new Error("Auth token not found")
  }

  const response = await fetch(`http://127.0.0.1:8000/api/profile/${userId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`, // ✅ Token should not be undefined
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


// AllApiCalls.ts
export const createStatement = async ({ account, statement }) => {
  const payload = {
    account,
    side: statement.side,
    saveresult: statement.saveresult,
    strategy: statement.strategy,
  }

  // Add 'equity' only if it's provided
  if (statement.Equity !== undefined && statement.Equity !== null) {
    payload.Equity = statement.Equity
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


export const fetchStatement = async () => {
  const accountId = localStorage.getItem("account_id")

  if (!accountId) {
    throw new Error("Account ID not found")
  }

  const response = await Fetch(`/api/strategies/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch strategy")
  }

  const data = await response.json()

  const filteredData = data.filter((strategy) => strategy.account === accountId)

  return filteredData
}

export const fetchStatementDetail = async (statement_id) => {
  const response = await Fetch(`/api/strategies/${statement_id}/`, {
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
export const updateStrategy = async (
  strategyId,
  accountId,
  side,
  saveResult,
  strID,
  nTradeMax = 1,
  margin = 0.02,
  lot = "mini",
  cash = 10000,
) => {
  try {
    // Parse the strategy JSON if it's a string
    let strategyData = typeof strID === "string" ? JSON.parse(strID) : strID

    // Add TradingType to the strategy data
    strategyData = {
      ...strategyData,
      TradingType: {
        nTrade_max: nTradeMax,
        margin: margin,
        lot: lot,
        cash: cash,
      },
    }

    const response = await fetch(`http://127.0.0.1:8000/api/strategies/${strategyId}/edit/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account: accountId,
        side: side,
        saveresult: saveResult,
        strategy: strategyData,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating strategy:", error)
    throw error
  }
}
