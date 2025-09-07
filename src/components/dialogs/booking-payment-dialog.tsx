'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createPayment } from '@/lib/actions/payments'
import { formatCurrency } from '@/lib/utils'
import type { PaymentStatus, Booking } from '@/types'
import { toast } from 'sonner'
import { 
  CreditCard,
  User,
  Building,
  Hash,
  DollarSign,
  Info
} from 'lucide-react'

interface BookingPaymentDialogProps {
  booking: Booking
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function BookingPaymentDialog({ booking, trigger, onSuccess }: BookingPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Pre-populate with booking data - use creator rate or booking amounts as fallback
  const creatorRate = booking.creator?.rate_card ? Object.values(booking.creator.rate_card)[0] as number : null
  const defaultAmount = creatorRate || booking.agreed_amount || booking.offer_amount || 0

  const [formData, setFormData] = useState({
    amount: defaultAmount,
    status: 'unconfirmed' as PaymentStatus,
    due_date: '',
    notes: '',
    transaction_id: ''
  })

  // Extract bank account information
  const bankAccount = booking.creator?.bank_account
  const bankInfo = bankAccount ? {
    accountHolder: (bankAccount as any).account_holder || '',
    bankName: (bankAccount as any).bank_name || '',
    accountNumber: (bankAccount as any).account_number || '',
    routingNumber: (bankAccount as any).routing_number || ''
  } : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    setLoading(true)
    try {
      await createPayment({
        booking_id: booking.id,
        amount: formData.amount,
        status: formData.status,
        payment_method: 'bank',
        due_date: formData.due_date || null,
        notes: formData.notes || null,
        transaction_id: formData.transaction_id || null,
        currency: booking.currency || 'VND'
      })
      toast.success('Payment created successfully')
      onSuccess?.()
      setOpen(false)
      // Reset form
      setFormData({
        amount: defaultAmount,
        status: 'unconfirmed',
        due_date: '',
        notes: '',
        transaction_id: ''
      })
    } catch (error) {
      toast.error('Failed to create payment')
      console.error('Create payment error:', error)
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <CreditCard className="h-4 w-4" />
      Create Payment
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Payment</DialogTitle>
          <DialogDescription>
            Create a payment record for this booking
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Payment Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {creatorRate 
                        ? 'Amount auto-filled from creator\'s rate card • Payment via bank transfer'
                        : 'Payment will be processed via bank transfer'
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: PaymentStatus) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                          <SelectItem value="pending_invoice">Pending Invoice</SelectItem>
                          <SelectItem value="waiting_payment">Waiting Payment</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="transaction_id">Transaction ID</Label>
                    <Input
                      id="transaction_id"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                      placeholder="Transaction reference or ID"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any additional notes about this payment..."
                      rows={3}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Payment'}
                    </Button>
                  </DialogFooter>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking & Creator Info */}
          <div className="space-y-4">
            {/* Booking Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Booking Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Creator</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{booking.creator?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Campaign</Label>
                    <div className="text-sm mt-1">{booking.campaign?.name || 'No Campaign'}</div>
                  </div>
                </div>
                
                {creatorRate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Creator Rate</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-mono">
                        {formatCurrency(creatorRate)}
                      </span>
                      <span className="text-xs text-gray-500">from profile</span>
                    </div>
                  </div>
                )}
                

              </CardContent>
            </Card>

            {/* Bank Account Information */}
            {bankInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Bank Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Account Holder</Label>
                    <div className="text-sm mt-1 p-2 bg-gray-50 rounded font-mono">
                      {bankInfo.accountHolder || 'Not provided'}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Bank Name</Label>
                    <div className="text-sm mt-1 p-2 bg-gray-50 rounded">
                      {bankInfo.bankName || 'Not provided'}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Account Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Hash className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-mono p-2 bg-gray-50 rounded flex-1">
                        {bankInfo.accountNumber || 'Not provided'}
                      </span>
                    </div>
                  </div>
                  
                  {bankInfo.routingNumber && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Routing Number</Label>
                      <div className="text-sm mt-1 p-2 bg-gray-50 rounded font-mono">
                        {bankInfo.routingNumber}
                      </div>
                    </div>
                  )}

                  {!bankInfo.accountHolder && !bankInfo.bankName && !bankInfo.accountNumber && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No bank account information available for this creator
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
