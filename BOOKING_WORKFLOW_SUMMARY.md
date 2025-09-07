# Booking Workflow System - Simplified

## Overview
The booking system has been simplified from a complex deliverable-based workflow to a streamlined status-based system focused on the core booking lifecycle.

## Status Flow
The new booking status flow is linear and straightforward:

```
pending → deal → delivered → content_submitted → approved → completed
```

### Status Definitions

1. **Pending** - Initial state when booking is created
   - Action: Confirm deal details
   - Next: `deal`

2. **Deal** - Deal confirmed, ready for delivery preparation  
   - Action: Prepare and ship goods with tracking number
   - Next: `delivered`

3. **Delivered** - Goods shipped to creator with tracking
   - Action: Creator confirms receipt
   - Next: `content_submitted`

4. **Content Submitted** - Creator has submitted content for review
   - Action: Review and approve/request revision
   - Next: `approved`

5. **Approved** - Content approved and ready
   - Action: Mark as completed
   - Next: `completed`

6. **Completed** - Booking fully finished
   - Final state

## Key Features

### Delivery Tracking
- **Tracking Number**: Added to bookings when goods are shipped
- **Delivered At**: Timestamp when package is marked as delivered
- **Status Integration**: Delivery status affects workflow progression

### UI Tabs Structure
1. **Overview** - Basic booking information and progress
2. **Delivery & Tracking** - Handle shipping and delivery confirmation
3. **Creator Submissions** - Manage content review and approval
4. **Timeline** - Track booking history and status changes
5. **Comments** - Internal notes and communications

### Database Changes

#### New Columns Added to `bookings`:
- `tracking_number` (TEXT) - Shipping tracking number
- `delivered_at` (TIMESTAMPTZ) - Delivery timestamp
- `scheduled_date` (DATE) - When content should be ready

#### Status Constraint Updated:
```sql
CHECK (status IN ('pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed'))
```

### Removed Features
- **Deliverables System**: Simplified to single booking workflow
- **Files Tab**: Removed to focus on core workflow
- **Canceled Status**: Removed as bookings should progress through completion
- **Complex Revision Tracking**: Simplified to approval/revision flow

## Benefits

1. **Simplified Workflow**: Linear progression makes status clearer
2. **Delivery Focus**: Built-in tracking for physical goods delivery
3. **Reduced Complexity**: Fewer entities to manage and track
4. **Clear Progression**: Each status has clear next steps
5. **Better UX**: Focused interface with relevant actions per status

## Technical Implementation

### Status Colors
- `pending`: Yellow (awaiting action)
- `deal`: Blue (confirmed, preparing)
- `delivered`: Orange (shipped, in transit)
- `content_submitted`: Purple (awaiting review)
- `approved`: Green (ready for completion)
- `completed`: Emerald (finished)

### Progress Calculation
```typescript
const weights = {
  pending: 10,
  deal: 20,
  delivered: 40,
  content_submitted: 70,
  approved: 90,
  completed: 100
}
```

### Calendar Integration
- Events generated based on booking status and dates
- Delivery tracking events for shipped packages
- Content review reminders for submitted content

## Migration Notes
- Existing `in_process` bookings converted to `deal`
- Existing `canceled` bookings converted to `pending`
- All booking constraints updated to new status flow
- Indexes created for performance optimization
