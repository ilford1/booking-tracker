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
import { updatePayment, updatePaymentStatus } from '@/lib/actions/payments'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Payment, PaymentStatus } from '@/types'
import { toast } from 'sonner'
import { 
  Calendar,
  DollarSign,
  User,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface PaymentViewDialogProps {
  payment: Payment
  trigger: React.ReactNode
  onUpdate?: () => void
}

export function PaymentViewDialog({ payment, trigger, onUpdate }: PaymentViewDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            Payment record for {payment.booking?.creator?.name || 'Unknown Creator'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Creator</Label>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-gray-400" />
                <span>{payment.booking?.creator?.name || 'Unknown'}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Campaign</Label>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4 text-gray-400" />
                <span>{payment.booking?.campaign?.name || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Amount</Label>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="font-mono text-lg">
                  {payment.amount ? formatCurrency(payment.amount) : '-'}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {payment.status === 'paid' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {payment.status === 'waiting_payment' && <Clock className="h-4 w-4 text-yellow-500" />}
                {payment.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                {payment.status === 'unconfirmed' && <AlertCircle className="h-4 w-4 text-gray-500" />}
                <span className="capitalize">{payment.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Due Date</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{payment.due_date ? formatDate(payment.due_date) : 'Not set'}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Paid Date</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{payment.paid_at ? formatDate(payment.paid_at) : 'Not paid'}</span>
              </div>
            </div>
          </div>

          {/* Method and Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Method</Label>
              <p className="mt-1 capitalize">{payment.payment_method || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Transaction ID</Label>
              <p className="mt-1 font-mono text-sm">{payment.transaction_id || 'Not available'}</p>
            </div>
          </div>

          {payment.notes && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Notes</Label>
              <p className="mt-1 text-sm text-gray-600">{payment.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PaymentEditDialogProps {
  payment: Payment
  trigger: React.ReactNode
  onUpdate?: () => void
}

export function PaymentEditDialog({ payment, trigger, onUpdate }: PaymentEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: payment.amount || 0,
    status: payment.status,
    payment_method: payment.payment_method || '',
    due_date: payment.due_date || '',
    notes: payment.notes || '',
    transaction_id: payment.transaction_id || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updatePayment(payment.id, formData)
      toast.success('Payment updated successfully')
      onUpdate?.()
      setOpen(false)
    } catch (error) {
      toast.error('Failed to update payment')
      console.error('Update error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: PaymentStatus) => {
    setLoading(true)
    try {
      await updatePaymentStatus(payment.id, newStatus)
      toast.success(`Payment marked as ${newStatus.replace('_', ' ')}`)
      onUpdate?.()
      setOpen(false)
    } catch (error) {
      toast.error('Failed to update payment status')
      console.error('Status update error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogDescription>
            Update payment details for {payment.booking?.creator?.name || 'Unknown Creator'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                placeholder="e.g., Bank Transfer, PayPal"
              />
            </div>
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

          <DialogFooter className="gap-2">
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStatusChange('paid')}
                  disabled={loading || payment.status === 'paid'}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark Paid
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Payment'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
