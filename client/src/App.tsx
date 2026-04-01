import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Tenants from "./pages/Tenants";
import Meters from "./pages/Meters";
import Bills from "./pages/Bills";
import BillDetail from "./pages/BillDetail";
import Packages from "./pages/Packages";
import Reports from "./pages/Reports";
import TenantPortal from "./pages/TenantPortal";
import TenantBillDetail from "./pages/TenantBillDetail";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/tenants" component={Tenants} />
      <Route path="/meters" component={Meters} />
      <Route path="/bills" component={Bills} />
      <Route path="/bills/:id" component={BillDetail} />
      <Route path="/packages" component={Packages} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/portal" component={TenantPortal} />
      <Route path="/portal/bills/:id" component={TenantBillDetail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
