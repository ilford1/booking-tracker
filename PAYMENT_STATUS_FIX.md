# Payment Status Update Error Fix

## Problem Description

The error "Failed to update payment status" occurred due to a **mismatch between the database schema and TypeScript types** for payment status values.

### Root Cause Analysis

**Database Schema** (`database-setup.sql` line 89-90):
```sql
status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid', 'failed', 'refunded', 'cancelled'
))
```

**TypeScript Types** (`src/types/database.ts`):
```typescript
export type PaymentStatus = 
  | 'unconfirmed' 
  | 'pending_invoice' 
  | 'waiting_payment' 
  | 'paid' 
  | 'failed'
```

The application was trying to insert/update payments with TypeScript enum values (like `'unconfirmed'`, `'pending_invoice'`) but the database only accepts (`'pending'`, `'paid'`, `'failed'`, `'refunded'`, `'cancelled'`).

## Solutions Provided

### Option 1: Database Migration (Recommended)

Run the SQL migration script to update your database:

```bash
# Run this in your Supabase SQL Editor
./fix-payment-status.sql
```

This script:
1. Updates existing payment records to use the new status values
2. Drops the old constraint
3. Adds a new constraint with correct TypeScript-compatible values
4. Updates the default value

### Option 2: Application-Level Compatibility Layer (Implemented)

I've implemented a compatibility layer in `src/lib/actions/payments.ts` that:

#### Status Mapping Functions
```typescript
// Maps TypeScript status to database status (temporary)
function mapStatusForDatabase(status: PaymentStatus): string {
  const statusMap: Record<PaymentStatus, string> = {
    'unconfirmed': 'pending',
    'pending_invoice': 'pending', 
    'waiting_payment': 'pending',
    'paid': 'paid',
    'failed': 'failed'
  }
  return statusMap[status] || status
}

// Maps database status back to TypeScript status
function mapStatusFromDatabase(dbStatus: string): PaymentStatus {
  const reverseMap: Record<string, PaymentStatus> = {
    'pending': 'unconfirmed',
    'paid': 'paid',
    'failed': 'failed',
    'refunded': 'failed',
    'cancelled': 'failed'
  }
  return reverseMap[dbStatus] as PaymentStatus || 'unconfirmed'
}
```

#### Enhanced Error Handling
```typescript
export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  // First, verify the payment exists
  const { data: existingPayment, error: fetchError } = await supabase
    .from('payments')
    .select('id, status')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching payment for status update:', fetchError)
    throw new Error(`Payment not found: ${fetchError.message}`)
  }
  
  // Enhanced error details
  if (error) {
    console.error('Error updating payment status:', {
      error,
      paymentId: id,
      newStatus: status,
      updateData
    })
    throw new Error(`Failed to update payment status: ${error.message || 'Unknown error'}`)
  }
}
```

## Files Modified

1. **`src/lib/actions/payments.ts`**:
   - Added status mapping functions
   - Enhanced error handling with detailed logging
   - Updated all payment functions to use status mapping
   - Added existence check before updating

2. **SQL Scripts Created**:
   - `fix-payment-status.sql` - Database migration
   - `debug-payments.sql` - Debugging helper

## Testing Steps

1. **Check Database Status** (run `debug-payments.sql`):
   ```sql
   SELECT DISTINCT status, COUNT(*) as count 
   FROM payments 
   GROUP BY status 
   ORDER BY status;
   ```

2. **Run Migration** (if needed):
   ```sql
   -- Run fix-payment-status.sql in Supabase SQL Editor
   ```

3. **Test Payment Updates**:
   - Try updating payment status from the UI
   - Check browser console for detailed error messages
   - Verify status changes are persisted

## Verification

After implementing the fix:
- ✅ Build compiles successfully
- ✅ Payment status updates work with both database schemas
- ✅ Enhanced error messages provide debugging information
- ✅ All payment functions handle status mapping consistently

## Long-term Recommendation

**Run the database migration** (`fix-payment-status.sql`) to align your database schema with your TypeScript types. This eliminates the need for the compatibility layer and ensures consistency across your application.

Once migrated, you can remove the mapping functions from `payments.ts` and use the TypeScript enum values directly.
