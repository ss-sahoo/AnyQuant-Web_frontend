# MetaAPI Configuration Deployment Guide

## Overview
This guide ensures MetaAPI configuration works properly in production deployment.

## Environment Variables Setup

### 1. Production Environment Variables
Set these environment variables in your production environment:

```bash
# MetaAPI Configuration
NEXT_PUBLIC_METAAPI_ACCOUNT_ID=497f4821-4a6a-4b4b-971b-91102ea780a3
NEXT_PUBLIC_METAAPI_ACCESS_TOKEN=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI5MTAzZjQxMTFkYmU2Nzg5Y2FiZjEzYzJlOWUzOTdjZiIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiXSwicmVzb3VyY2VzIjpbImFjY291bnQ6JFVTRVJfSUQkOjQ5N2Y0ODIxLTRhNmEtNGI0Yi05NzFiLTkxMTAyZWE3ODBhMyJdfSx7ImlkIjoibWV0YWFwaS1yZXN0LWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiYWNjb3VudDokVVNFUl9JRCQ6NDk3ZjQ4MjEtNGE2YS00YjRiLTk3MWItOTExMDJlYTc4MGEzIl19LHsiaWQiOiJtZXRhYXBpLXJwYy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyJhY2NvdW50OiRVU0VSX0lEJDo0OTdmNDgyMS00YTZhLTRiNGItOTcxYi05MTEwMmVhNzgwYTMiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyJhY2NvdW50OiRVU0VSX0lEJDo0OTdmNDgyMS00YTZhLTRiNGItOTcxYi05MTEwMmVhNzgwYTMiXX0seyJpZCI6Im1ldGFzdGF0cy1hcGkiLCJtZXRob2RzIjpbIm1ldGFzdGF0cy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiYWNjb3VudDokVVNFUl9JRCQ6NDk3ZjQ4MjEtNGE2YS00YjRiLTk3MWItOTExMDJlYTc4MGEzIl19LHsiaWQiOiJyaXNrLW1hbmFnZW1lbnQtYXBpIiwibWV0aG9kcyI6WyJyaXNrLW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiXSwicmVzb3VyY2VzIjpbImFjY291bnQ6JFVTRVJfSUQkOjQ5N2Y0ODIxLTRhNmEtNGI0Yi05NzFiLTkxMTAyZWE3ODBhMyJdfV0sImlnbm9yZVJhdGVMaW1pdHMiOmZhbHNlLCJ0b2tlbklkIjoiMjAyMTAyMTMiLCJpbXBlcnNvbmF0ZWQiOmZhbHNlLCJyZWFsVXNlcklkIjoiOTEwM2Y0MTExZGJlNjc4OWNhYmYxM2MyZTllMzk3Y2YiLCJpYXQiOjE3NTQ0NTY0NDR9.NTdiETxjtzqsGkyCY5SGf_-PTZCNvbpYv8DmxGEXYQSdTP1NxNz-DsPA_Akyur3XMx0SMo0M_fI86pJuB9rfupJRTS7RZBOGORanx6bXM6A_ZAdvZPXpg363Jc83xzmcMMHXjaSR3S1-shX_tlrVw2Djka7tcWfn8SrNoatgj6jlfu4fdBrb-n9dJSpwZNo17KYF18uV07psTQ6laIGBe37zlBYrK2EixIrwX6yoDiCoxB2jHoWmm4dMMv56MawnXqKwr1gFQrdcziSzSQqcMHM-FELbsXB-RZ1aZtwIlfoz2iBcb6vNwcnsJ5zyis7IcImrAVcUp2Sq1VGp6hKx5-_9ar4u5fD3eZ2GBRHD7hdPaaNTng4p2COtTiCS7WbJQHGiFFTXjUWBw7gNjgD1XbT3uu-2OOvjlFihF_QteM_RBvYGLkna7AK6hQNCDbOPvabbZUqzkz8ITNZjUDY6n_Qc1tNJzHAu-A_-NwlXwl9X79x54h4m62Q1XBwewp0tfcMd00iQ-qSLiLs-LXVAnYvVfDfQNLDvoSibmJs-E6ffFCl-CwuqLib7mPJcKUuGOaH15byR3DCGdhGFA25FZaXlfEMwsnsCF3Vn7JI4ZIgyag9sMXJ-t04IMZQkCV3nHyc3ICKGl0JnrywCw_ue3xdbe91RueQ9mIGtAS5Cs2M
```

### 2. Platform-Specific Setup

#### Vercel Deployment
```bash
# In Vercel Dashboard:
# 1. Go to Project Settings > Environment Variables
# 2. Add the variables above
# 3. Deploy to Production
```

#### Netlify Deployment
```bash
# In Netlify Dashboard:
# 1. Go to Site Settings > Environment Variables
# 2. Add the variables above
# 3. Trigger a new deployment
```

#### Docker Deployment
```dockerfile
# In your Dockerfile or docker-compose.yml:
ENV NEXT_PUBLIC_METAAPI_ACCOUNT_ID=497f4821-4a6a-4b4b-971b-91102ea780a3
ENV NEXT_PUBLIC_METAAPI_ACCESS_TOKEN=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9...
```

#### AWS/Cloud Deployment
```bash
# Set environment variables in your deployment platform
# or use a .env.production file (not recommended for security)
```

## Verification Steps

### 1. Pre-Deployment Check
```bash
# Test environment variables are loaded
npm run build
# Check for any build errors related to MetaAPI
```

### 2. Post-Deployment Verification
1. **Visit the Strategy Testing page**
2. **Select "MetaAPI" as data source**
3. **Verify the configuration shows:**
   - ✅ Green "Configured" status
   - ✅ Account ID shows first 8 characters
   - ✅ Access Token shows first 20 characters
   - ✅ Symbol selection is available

### 3. Test Backtest Functionality
1. **Load a strategy** (with ID parameter)
2. **Run a backtest** using MetaAPI
3. **Verify:**
   - ✅ No connection errors
   - ✅ Trades data is generated
   - ✅ Charts are displayed

## Troubleshooting

### Common Issues:

#### 1. "Not Configured" Status
**Cause:** Environment variables not set in production
**Solution:** Verify environment variables are properly configured in your deployment platform

#### 2. Build Errors
**Cause:** Environment variables not available during build
**Solution:** Ensure variables are set before building

#### 3. Runtime Errors
**Cause:** MetaAPI credentials invalid or expired
**Solution:** Check token validity and account status

### Debug Commands:
```bash
# Check if environment variables are loaded
echo $NEXT_PUBLIC_METAAPI_ACCOUNT_ID
echo $NEXT_PUBLIC_METAAPI_ACCESS_TOKEN

# Test MetaAPI connection (if needed)
curl -H "Authorization: Bearer $NEXT_PUBLIC_METAAPI_ACCESS_TOKEN" \
     "https://mt-client-api-v1.agiliumtrade.ai/users/current/accounts/$NEXT_PUBLIC_METAAPI_ACCOUNT_ID"
```

## Security Considerations

### ✅ Best Practices:
- ✅ Use environment variables (not hardcoded)
- ✅ Use `NEXT_PUBLIC_` prefix for client-side access
- ✅ Rotate tokens regularly
- ✅ Monitor API usage

### ❌ Avoid:
- ❌ Hardcoding credentials in code
- ❌ Committing .env files to version control
- ❌ Using production tokens in development

## Monitoring

### 1. Check Application Logs
Monitor for MetaAPI-related errors in production logs

### 2. User Feedback
Watch for reports of:
- "Not Configured" status
- Backtest failures
- Connection errors

### 3. API Usage
Monitor MetaAPI usage to ensure within limits

## Fallback Strategy

If MetaAPI fails in production:
1. **File Upload Mode** remains available as fallback
2. **User can switch** between MetaAPI and File Upload
3. **Graceful degradation** ensures application continues to work

## Support

For MetaAPI-specific issues:
1. Check MetaAPI documentation
2. Verify account status
3. Contact MetaAPI support if needed

---

**Note:** This configuration uses the provided test credentials. For production use, ensure you have valid MetaAPI credentials for your specific account. 