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
      Authorization: `Bearer ${token}`, // Include token if your API is protected
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
