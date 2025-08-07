# Production Deployment Checklist - MetaAPI Issue

## 🔍 Current Issue
**Error**: `Failed to authorize user due to invalid auth-token header`

## 📋 Deployment Platform Checklist

### **Vercel Deployment**
1. **Environment Variables Setup:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add these variables:
     ```
     NEXT_PUBLIC_METAAPI_ACCOUNT_ID=497f4821-4a6a-4b4b-971b-91102ea780a3
     NEXT_PUBLIC_METAAPI_ACCESS_TOKEN=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9...
     ```
   - Make sure to select **Production** environment
   - Redeploy after adding variables

### **Netlify Deployment**
1. **Environment Variables Setup:**
   - Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
   - Add the same variables as above
   - Trigger a new deployment

### **AWS/Cloud Deployment**
1. **Environment Variables Setup:**
   - Set environment variables in your deployment configuration
   - Ensure they're available at build time

## 🔧 Debugging Steps

### **Step 1: Verify Environment Variables**
1. **Check Browser Console:**
   - Open your deployed app
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for debug messages starting with 🔍

2. **Expected Console Output:**
   ```
   🔍 MetaAPI Token available: true
   🔍 MetaAPI Account ID available: true
   🔍 MetaAPI Debug Info: { tokenLength: 1234, accountId: "497f4821...", ... }
   ```

### **Step 2: Check Backend API**
The error suggests the backend is calling MetaAPI with wrong credentials. Check:

1. **Backend Logs:**
   - Check your backend server logs
   - Look for MetaAPI-related errors

2. **API Endpoint:**
   - The error shows: `mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai`
   - This looks like a malformed URL (double `agiliumtrade`)

### **Step 3: Test Environment Variables**
Add this temporary debug code to your deployed app:

```javascript
// Add this to your browser console to test
console.log('Environment Variables Test:');
console.log('Account ID:', process.env.NEXT_PUBLIC_METAAPI_ACCOUNT_ID);
console.log('Token Length:', process.env.NEXT_PUBLIC_METAAPI_ACCESS_TOKEN?.length);
console.log('Token Prefix:', process.env.NEXT_PUBLIC_METAAPI_ACCESS_TOKEN?.substring(0, 20));
```

## 🚨 Common Issues & Solutions

### **Issue 1: Environment Variables Not Loading**
**Symptoms:** Console shows `undefined` for environment variables
**Solution:** 
- Verify variables are set in deployment platform
- Ensure variables start with `NEXT_PUBLIC_`
- Redeploy after adding variables

### **Issue 2: Backend API Error**
**Symptoms:** Error shows malformed MetaAPI URL
**Solution:**
- Check backend code for MetaAPI integration
- Verify backend is using correct MetaAPI endpoints
- Check backend environment variables

### **Issue 3: Token Format Issue**
**Symptoms:** "Invalid auth-token header"
**Solution:**
- Verify token is not truncated
- Check if token needs "Bearer " prefix
- Ensure token is valid and not expired

## 🔄 Temporary Workaround

If MetaAPI continues to fail in production:

1. **Use File Upload Mode:**
   - Users can still use the file upload feature
   - This provides a working fallback

2. **Contact Backend Team:**
   - The issue might be in the backend MetaAPI integration
   - Check backend logs for detailed error information

## 📞 Support Information

### **For Frontend Issues:**
- Check browser console for 🔍 debug messages
- Verify environment variables are loaded
- Test with file upload mode

### **For Backend Issues:**
- Check backend server logs
- Verify MetaAPI endpoint URLs
- Check backend environment variables

### **For MetaAPI Issues:**
- Verify token is valid and not expired
- Check MetaAPI account status
- Contact MetaAPI support if needed

## ✅ Success Criteria

Your deployment is working correctly when:
1. ✅ Environment variables load in browser console
2. ✅ MetaAPI configuration shows "Configured" status
3. ✅ Backtest runs without authorization errors
4. ✅ Trades data is generated successfully

---

**Note:** The current error suggests a backend issue with MetaAPI integration, not a frontend problem. The frontend is correctly sending the credentials to the backend. 