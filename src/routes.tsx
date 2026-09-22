import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { PaymentFlowProvider } from "./state/PaymentFlowContext";
import { useAppData } from "./state/AppDataContext";
import { LoginPage } from "./pages/auth/LoginPage";
import { VerifyPage } from "./pages/auth/VerifyPage";
import { WelcomePage } from "./pages/auth/WelcomePage";
import { GroupCreatePage } from "./pages/groups/create/GroupCreatePage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { GroupDetailPage } from "./pages/groups/detail/GroupDetailPage";
import { PayoutOrderPage } from "./pages/groups/payout-order/PayoutOrderPage";
import { PayoutDisbursePage } from "./pages/groups/payout/PayoutDisbursePage";
import { PayoutReceiptPage } from "./pages/groups/payout/PayoutReceiptPage";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { CheckoutConfirmPage } from "./pages/checkout/CheckoutConfirmPage";
import { CheckoutReturnPage } from "./pages/checkout/CheckoutReturnPage";
import { CheckoutSuccessPage } from "./pages/checkout/CheckoutSuccessPage";
import { CheckoutFailedPage } from "./pages/checkout/CheckoutFailedPage";
import { PayoutSetupPage } from "./pages/settings/PayoutSetupPage";
import { PayoutSetupReturnPage } from "./pages/settings/PayoutSetupReturnPage";

function PaymentFlowLayout() {
  return (
    <PaymentFlowProvider>
      <Outlet />
    </PaymentFlowProvider>
  );
}

function RequireAuth() {
  const { state } = useAppData();
  if (state.loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!state.currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/groups/new" element={<GroupCreatePage />} />

        <Route element={<AppShell />}>
          <Route path="/home" element={<DashboardPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
          <Route path="/groups/:groupId/payout-order" element={<PayoutOrderPage />} />
          <Route path="/groups/:groupId/payout/:round" element={<PayoutDisbursePage />} />
          <Route path="/groups/:groupId/payout/:round/receipt" element={<PayoutReceiptPage />} />

          <Route path="/settings/payout" element={<PayoutSetupPage />} />
          <Route path="/settings/payout/return" element={<PayoutSetupReturnPage />} />
          <Route path="/settings/payout/refresh" element={<PayoutSetupReturnPage />} />

          <Route element={<PaymentFlowLayout />}>
            <Route path="/pay/:groupId/:round" element={<CheckoutPage />} />
            <Route path="/pay/:groupId/:round/return" element={<CheckoutReturnPage />} />
            <Route path="/pay/confirm" element={<CheckoutConfirmPage />} />
            <Route path="/pay/success" element={<CheckoutSuccessPage />} />
            <Route path="/pay/failed" element={<CheckoutFailedPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
