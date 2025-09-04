'use client'

import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getPayments, getTotalPaymentsByStatus } from '@/lib/actions/payments'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Payment, PaymentStatus } from '@/types'
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  FileText
} from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentTotals, setPaymentTotals] = useState<Record<PaymentStatus, { count: number; amount: number }>>({} as any)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'all'>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentsData, totalsData] = await Promise.all([
          getPayments(),
          getTotalPaymentsByStatus()
        ])
        setPayments(paymentsData)
        setPaymentTotals(totalsData)
      } catch (error) {
        console.error('Error fetching payments:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'waiting_payment': return 'bg-yellow-100 text-yellow-800'
      case 'pending_invoice': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'unconfirmed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return CheckCircle2
      case 'waiting_payment': return Clock
      case 'pending_invoice': return FileText
      case 'failed': return XCircle
      case 'unconfirmed': return AlertCircle
      default: return Clock
    }
  }

  const filteredPayments = selectedStatus === 'all' 
    ? payments 
    : payments.filter(p => p.status === selectedStatus)

  const totalPaid = Object.values(paymentTotals).reduce((sum, total) => 
    sum + (total?.amount || 0), 0
  )

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading payments...</p>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
              <p className="text-gray-500 mt-1">
                Track payment status, invoices, and financial management
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Payment
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Payments
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Paid
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(paymentTotals.paid?.amount || 0)}
              </div>
              <div className="text-xs text-gray-500">
                {paymentTotals.paid?.count || 0} payments
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(paymentTotals.waiting_payment?.amount || 0)}
              </div>
              <div className="text-xs text-gray-500">
                {paymentTotals.waiting_payment?.count || 0} payments
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.length > 0
                  ? Math.round(((paymentTotals.paid?.count || 0) / payments.length) * 100)
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button 
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('all')}
          >
            All ({payments.length})
          </Button>
          {Object.entries(paymentTotals).map(([status, data]) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(status as PaymentStatus)}
            >
              {status.replace('_', ' ')} ({data.count})
            </Button>
          ))}
        </div>

        {/* Payments Table */}
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                <p className="text-gray-500 mb-4">
                  {selectedStatus === 'all' 
                    ? 'No payments have been created yet.'
                    : `No payments with status "${selectedStatus.replace('_', ' ')}" found.`
                  }
                </p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Payment Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const StatusIcon = getStatusIcon(payment.status)
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.booking?.creator?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {payment.booking?.campaign?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="font-mono">
                          {payment.amount ? formatCurrency(payment.amount) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.method || '-'}
                        </TableCell>
                        <TableCell>
                          {payment.due_date ? formatDate(payment.due_date) : '-'}
                        </TableCell>
                        <TableCell>
                          {payment.paid_at ? formatDate(payment.paid_at) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button size="sm">
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
