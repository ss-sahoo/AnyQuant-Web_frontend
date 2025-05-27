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



export const fetchStatement = async () => {
  const accountId = localStorage.getItem("user_id")

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

  const filteredData = data.filter((strategy) => strategy.account == accountId)

  return filteredData
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
    const response = await Fetch(`/api/strategies/${id}/edit/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        TradingType: {
          nTrade_max: tradingtype.nTrade_max,
          margin: tradingtype.margin,
          lot: tradingtype.lot,
          cash: tradingtype.cash,
        },
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

