import React, { useState, useEffect } from 'react';
import { DollarSign, Check, X, Calendar, User, Clock, FileText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const PaymentTracking = () => {
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [markingPaid, setMarkingPaid] = useState({});
  const [showPaymentForm, setShowPaymentForm] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    notes: ''
  });

  // Only show to admins
  if (!user || user.role !== 'admin') {
    return null;
  }

  useEffect(() => {
    fetchPaymentData();
  }, [selectedWeek]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const params = selectedWeek ? { week: selectedWeek } : {};
      const response = await axios.get('/api/payments/weekly', { params });
      setPaymentData(response.data);
    } catch (error) {
      console.error('Failed to fetch payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (childId) => {
    if (showPaymentForm === childId) {
      // Submit the payment
      try {
        setMarkingPaid(prev => ({ ...prev, [childId]: true }));
        
        const payload = {
          user_id: childId,
          week: selectedWeek || undefined,
          amount: paymentForm.amount ? parseFloat(paymentForm.amount) : 0,
          notes: paymentForm.notes.trim() || null
        };

        await axios.post('/api/payments/mark-paid', payload);
        
        toast.success('Payment marked successfully! 💰');
        setShowPaymentForm(null);
        setPaymentForm({ amount: '', notes: '' });
        await fetchPaymentData();
      } catch (error) {
        const message = error.response?.data?.error || 'Failed to mark payment';
        toast.error(message);
      } finally {
        setMarkingPaid(prev => ({ ...prev, [childId]: false }));
      }
    } else {
      // Show the payment form
      setShowPaymentForm(childId);
    }
  };

  const handleUnmarkPaid = async (paymentId, childName) => {
    if (!confirm(`Remove payment record for ${childName}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/payments/${paymentId}`);
      toast.success('Payment record removed');
      await fetchPaymentData();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to remove payment';
      toast.error(message);
    }
  };

  const getCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const formatWeekRange = (startDate) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900">Payment Tracking</h2>
          </div>
          
          {/* Week selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedWeek || getCurrentWeek()}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {paymentData && (
          <div className="text-sm text-gray-600">
            Week of {formatWeekRange(paymentData.week_start)} • {paymentData.paid_count || 0} of {paymentData.total_kids || 0} kids paid
          </div>
        )}
      </div>

      <div className="p-6">
        {!paymentData ? (
          <div className="text-center text-gray-500 py-8">
            <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No payment data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Paid children */}
            {paymentData.payments && paymentData.payments.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  Paid This Week ({paymentData.payments.length})
                </h3>
                <div className="space-y-2">
                  {paymentData.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.child_name}</p>
                          <p className="text-sm text-gray-600">
                            <span className="flex items-center space-x-2">
                              <User className="w-3 h-3" />
                              <span>Paid by {payment.paid_by_name}</span>
                              <Clock className="w-3 h-3 ml-2" />
                              <span>{new Date(payment.paid_at).toLocaleDateString()}</span>
                            </span>
                          </p>
                          {payment.amount > 0 && (
                            <p className="text-sm text-green-600 font-medium">
                              Amount: ${parseFloat(payment.amount).toFixed(2)}
                            </p>
                          )}
                          {payment.notes && (
                            <p className="text-sm text-gray-600 flex items-center space-x-1">
                              <FileText className="w-3 h-3" />
                              <span>{payment.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnmarkPaid(payment.id, payment.child_name)}
                        className="btn-danger-outline text-sm px-3 py-1"
                        title="Remove payment record"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unpaid children */}
            {paymentData.unpaid_kids && paymentData.unpaid_kids.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <X className="w-5 h-5 text-orange-500 mr-2" />
                  Not Yet Paid ({paymentData.unpaid_kids.length})
                </h3>
                <div className="space-y-2">
                  {paymentData.unpaid_kids.map((child) => (
                    <div key={child.id}>
                      <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{child.display_name}</p>
                            <p className="text-sm text-gray-600">@{child.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleMarkPaid(child.id)}
                          disabled={markingPaid[child.id]}
                          className="btn-success text-sm px-4 py-2 flex items-center space-x-2"
                        >
                          {markingPaid[child.id] ? (
                            <>
                              <div className="spinner w-4 h-4"></div>
                              <span>Marking...</span>
                            </>
                          ) : showPaymentForm === child.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Confirm Payment</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4" />
                              <span>Mark as Paid</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Payment form */}
                      {showPaymentForm === child.id && (
                        <div className="mt-2 p-4 bg-gray-50 border rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (optional)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                className="input-field text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (optional)
                              </label>
                              <input
                                type="text"
                                placeholder="Payment notes..."
                                value={paymentForm.notes}
                                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                className="input-field text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setShowPaymentForm(null)}
                              className="btn-secondary text-sm px-3 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No kids in family */}
            {(!paymentData.payments || paymentData.payments.length === 0) &&
             (!paymentData.unpaid_kids || paymentData.unpaid_kids.length === 0) && (
              <div className="text-center text-gray-500 py-8">
                <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No kids in your family yet</p>
                <p className="text-sm">Add family members to start tracking payments</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentTracking;