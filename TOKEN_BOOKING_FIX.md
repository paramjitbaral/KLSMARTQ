# Token Booking Fix - Complete Guide

## Issues Fixed

### 1. **BookTokenPage Component Issues**
- ❌ **Before**: `bookToken()` was called without awaiting, navigation happened immediately before token was saved
- ✅ **After**: Properly async/await the booking operation with error handling

### 2. **AppContext bookToken Function Issues**
- ❌ **Before**: Called non-existent RPC function `create_new_token`
- ✅ **After**: Direct database insertion with proper error handling and state updates

### 3. **Real-time Sync Issues**
- ✅ Fixed: Now properly updates local token state after booking
- ✅ Added: Real-time subscription listeners for tokens table changes

## Changes Made

### File 1: `components/student/BookTokenPage.tsx`
```typescript
// CHANGES:
1. Made handleSubmit async
2. Added proper await for bookToken()
3. Added loading state management
4. Added comprehensive error handling
5. Only navigate after successful booking
6. Updated button with loading indicator
```

### File 2: `context/AppContext.tsx`
```typescript
// CHANGES in bookToken function:
1. Replaced RPC call with direct insert
2. Added proper error logging
3. Added data validation (checks if data returned)
4. Updates local token state immediately
5. Better error messages

// NEW CODE:
const bookToken = async (officeId: string, purpose: string, priority: Priority) => {
  if (!currentUser) throw new Error("User not logged in");
  
  try {
    const { data, error } = await supabase.from('tokens').insert({
      student_id: currentUser.id,
      office_id: officeId,
      purpose: purpose,
      priority: priority,
      status: TokenStatus.WAITING,
      is_checked_in: false,
      created_at: new Date().toISOString(),
    }).select();

    if (error) {
      console.error("Token booking error:", error);
      throw new Error(error.message || "Failed to book token");
    }

    if (!data || data.length === 0) {
      throw new Error("Token booking failed - no data returned");
    }

    const newToken = formatToken(data[0]);
    setTokens(prev => [...prev, newToken]);
    
  } catch (err: any) {
    console.error("Error in bookToken:", err);
    throw err;
  }
};
```

## Supabase Setup Steps

### Step 1: Run SQL Schema
1. Go to Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire content from `SUPABASE_SCHEMA.sql`
5. Click **Run**

### Step 2: Verify Tables Created
Check these tables exist in Supabase:
- ✅ `profiles`
- ✅ `offices`
- ✅ `tokens`
- ✅ `notifications`

### Step 3: Verify RLS Policies
Check SQL Editor for created policies - you should see policies for each table.

### Step 4: Test Token Booking
1. Login as a student
2. Go to "Book a New Token"
3. Select an office
4. Enter purpose
5. Click "Get Token"
6. Check browser console for logs
7. Verify token appears on dashboard

## Troubleshooting

### Token still not booking?

**Check 1: Browser Console**
```
Open DevTools (F12) → Console tab
Look for error messages
```

**Check 2: Network Requests**
```
DevTools → Network tab
Look for failed requests to Supabase
Check POST requests to /tokens
```

**Check 3: RLS Policies**
```
Are policies enabled on tokens table?
Does student have INSERT permission?
Run: SELECT * FROM auth.users WHERE id = 'your_student_id'
```

**Check 4: Database Permissions**
```
In Supabase, check:
- Table exists: offices, tokens, profiles
- Columns exist: student_id, office_id, purpose, priority, status
- student_id matches auth.users.id
```

### Common Errors

**Error: "User not logged in"**
- Student hasn't logged in yet
- Session expired
- Check if currentUser is null

**Error: "Failed to book token - no data returned"**
- Insert succeeded but SELECT failed
- Check RLS policies allow SELECT after INSERT
- Verify .select() is in the chain

**Error: "Column X does not exist"**
- Table schema mismatch
- Run the SQL schema setup again
- Check column names are in snake_case in DB

## Real-time Features

The app now includes real-time subscription for:
- ✅ New tokens being booked
- ✅ Token status changes
- ✅ Token completion notifications

Check browser console:
```
Look for: "Token subscription created"
Look for: "Token changed" when updates happen
```

## Performance Improvements

- ✅ Added database indexes for faster queries
- ✅ Efficient state updates
- ✅ Proper error handling prevents infinite loading
- ✅ Timeout mechanism (15 seconds) on auth initialization

## Next Steps

1. Test token booking with different users
2. Verify real-time updates work
3. Check StudentDashboard shows new tokens
4. Test token history page
5. Test staff view of tokens
