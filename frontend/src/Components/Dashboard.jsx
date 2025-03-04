import React, { useState, useEffect, useCallback } from "react";
import AddTransaction from "./Widgets/AddTransaction";
import UpcomingPayment from "./Widgets/UpcomingPayment";
import Modal from "./Widgets/Modal";
import BarChart from "./BarChart";
import DoughnutChart from "./DoughnutChart";
import axiosInstance from "../api/axiosInstance";
import { IoMdWallet, IoMdPerson, IoMdBasket, IoMdCheckmark, IoMdCalendar } from "react-icons/io";
import { useBalanceStore } from "../stores/balance.store";
import { toast, ToastContainer } from "react-toastify";

// Reusable Card Component
const Card = ({ title, icon: Icon, value, bgColor }) => (
  <div className={`flex flex-col items-start p-5 rounded-lg shadow-md ${bgColor} text-white`}>
    <div className="flex items-center space-x-4">
      <Icon size={32} className="text-white" />
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <div className="mt-3">
      <h4 className="text-2xl font-bold">{value}</h4>
    </div>
  </div>
);

export default function Dashboard({ onSectionChange }) {
  const [modalType, setModalType] = useState(null);
  const [user, setUser] = useState(null);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // Zustand State
  const income = useBalanceStore((state) => state.income);
  const expenses = useBalanceStore((state) => state.expenses);
  const fetchTransactionStats = useBalanceStore((state) => state.fetchTransactionStats);
  const monthlyStats = useBalanceStore((state) => state.monthlyStats);
  
  // Balance Calculation
  const balance = income - expenses;

  const handleLoginRedirect = () => {
    onSectionChange("Account");
  };

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/auth/current", { withCredentials: true });
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Authentication check failed:", error.response?.data?.message || error.message);
      setUser(null);
      setIsAuthenticated(false);
      // Toast removed to avoid showing on initial load
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user & transaction stats on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch transaction data when authentication status changes
  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        try {
          await fetchTransactionStats();
          
          const paymentResponse = await axiosInstance.get("/payments", { withCredentials: true });
          setUpcomingPayments(paymentResponse.data);
        } catch (error) {
          console.error("❌ Error fetching data:", error.response?.data?.message || error.message);
          toast.error("Failed to load transaction data");
        }
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchTransactionStats]);

  // Mark Payment as Paid
  const markPaymentAsPaid = async (id) => {
    try {
      await axiosInstance.delete(`/payments/${id}`, { withCredentials: true });
      
      setUpcomingPayments((prevPayments) =>
        prevPayments.filter((payment) => payment._id !== id)
      );
      
      toast.success("Payment marked as paid");
    } catch (error) {
      console.error("❌ Error marking payment as paid:", error.response?.data?.message || error.message);
      toast.error("Failed to update payment status");
    }
  };

  // If loading, show loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (isAuthenticated === false) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-5 bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <p className="text-gray-700 text-center font-semibold text-lg">
          Please log in to access your transactions.
        </p>
        <button
          onClick={handleLoginRedirect}
          className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        {/* User Welcome Message */}
        <h1 className="text-xl sm:text-3xl font-bold text-[#0F172A] text-center sm:text-left">
          {user ? `Welcome back, ${user.username} 👋` : "Welcome Back 👋"}
        </h1> 
        <ToastContainer
          className="!font-sans"
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName="relative flex p-3 min-h-[64px] rounded-md justify-between overflow-hidden cursor-pointer bg-white shadow-md my-2 max-w-[60vw] md:max-w-[350px]"
          bodyClassName="text-sm font-medium text-gray-800 flex items-center"
          icon={true}
        />
        {/* Action Buttons */}
        <div className="flex space-x-4">
          {/* Add Transaction Button */}
          <button
            className="px-4 py-2 bg-[#2563EB] text-white rounded-md shadow hover:bg-[#1E40AF] transition-all w-full sm:w-auto"
            onClick={() => setModalType("transaction")}
          >
            + Add Transaction
          </button>

          {/* Add Upcoming Payment Button */}
          <button
            className="px-4 py-2 bg-[#2563EB] text-white rounded-md shadow hover:bg-[#1E40AF] transition-all w-full sm:w-auto"
            onClick={() => setModalType("upcoming")}
          >
            + Add Payment
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
        <Card title="Balance" icon={IoMdWallet} value={`Rp. ${balance.toLocaleString("id-ID")}`} bgColor="bg-gradient-to-r from-[#1E40AF] to-[#2563EB]" />
        <Card title="Expenses" icon={IoMdBasket} value={`Rp. ${expenses.toLocaleString("id-ID")}`} bgColor="bg-gradient-to-r from-[#DC2626] to-[#EF4444]" />
        <Card title="Income" icon={IoMdPerson} value={`Rp. ${income.toLocaleString("id-ID")}`} bgColor="bg-gradient-to-r from-[#059669] to-[#10B981]" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg sm:text-xl font-medium text-[#0F172A] mb-4">Yearly Summary</h2>
          <BarChart monthlyStats={monthlyStats} />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg sm:text-xl font-medium text-[#0F172A] mb-4">Total Report</h2>
          <DoughnutChart income={income} expenses={expenses} />
        </div>
      </div>

      {/* Upcoming Payments Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg sm:text-xl font-medium text-[#0F172A] mb-4">Upcoming Payments</h2>

        {upcomingPayments.length > 0 ? (
          <ul className="space-y-4">
            {upcomingPayments.map((payment) => (
              <li
                key={payment._id}
                className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-100 rounded-lg shadow-sm"
              >
                {/* Left Side: Date & Title */}
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
                  {/* Date with Calendar Icon */}
                  <div className="flex items-center space-x-2 text-gray-600 text-sm">
                    <IoMdCalendar size={18} />
                    <span>{new Date(payment.dueDate).toDateString()}</span>
                  </div>

                  {/* Payment Title */}
                  <span className="text-gray-900 font-medium truncate">{payment.title}</span>
                </div>

                {/* Right Side: Amount & Button */}
                <div className="mt-2 md:mt-0 flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
                  {/* Amount */}
                  <span className="text-red-500 font-semibold">Rp. {payment.amount.toLocaleString("id-ID")}</span>

                  {/* Paid Button */}
                  <button
                    className="px-3 py-1 bg-green-500 text-white rounded-md shadow hover:bg-green-600 transition-all flex items-center space-x-1"
                    onClick={() => markPaymentAsPaid(payment._id)}
                  >
                    <IoMdCheckmark size={18} />
                    <span>Paid</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No upcoming payments</p>
        )}
      </div>

      {/* Global Modals */}
      <Modal isOpen={modalType === "transaction"} onClose={() => setModalType(null)} title="Add Transaction">
        {modalType === "transaction" && <AddTransaction />}
      </Modal>

      <Modal isOpen={modalType === "upcoming"} onClose={() => setModalType(null)} title="Add Upcoming Payment">
        {modalType === "upcoming" && <UpcomingPayment />}
      </Modal>
    </div>
  );
}
