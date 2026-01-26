import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Dashboard from '../pages/Dashboard'
import Profile from '../pages/Profile'
import Layout from '../components/layout/Layout'

// Projects
import ProjectList from '../pages/projects/ProjectList'
import ProjectCreate from '../pages/projects/ProjectCreate'
import ProjectEdit from '../pages/projects/ProjectEdit'
import ProjectDetails from '../pages/projects/ProjectDetails'

// Store Transactions
import GRNList from '../pages/storeTransactions/GRNList'
import GRNForm from '../pages/storeTransactions/GRNForm'
import GRNDetails from '../pages/storeTransactions/GRNDetails'
import STNList from '../pages/storeTransactions/STNList'
import STNForm from '../pages/storeTransactions/STNForm'
import STNDetails from '../pages/storeTransactions/STNDetails'
import SRNList from '../pages/storeTransactions/SRNList'
import SRNForm from '../pages/storeTransactions/SRNForm'
import SRNDetails from '../pages/storeTransactions/SRNDetails'
import UnifiedDailyReport from '../pages/dpr/UnifiedDailyReport'
import DailyWorkLogList from '../pages/storeTransactions/DailyWorkLogList'
import DailyWorkLogDetails from '../pages/storeTransactions/DailyWorkLogDetails'
import StockAdjustmentForm from '../pages/storeTransactions/StockAdjustmentForm'
import StockReport from '../pages/inventory/StockReport'
import InventoryDashboard from '../pages/inventory/InventoryDashboard'

// DPR
import DPRList from '../pages/dpr/DPRList'
import DPRDetails from '../pages/dpr/DPRDetails'

// Equipment
import EquipmentList from '../pages/equipment/EquipmentList'
import EquipmentForm from '../pages/equipment/EquipmentForm'
import EquipmentRentals from '../pages/equipment/EquipmentRentals'
import RentalForm from '../pages/equipment/RentalForm'
import BreakdownForm from '../pages/equipment/BreakdownForm'

// Expenses
import ExpenseList from '../pages/expenses/ExpenseList'
import ExpenseForm from '../pages/expenses/ExpenseForm'
import ProjectConsumptionReport from '../pages/reports/ProjectConsumptionReport'
import ProcurementStatusReport from '../pages/reports/ProcurementStatusReport'

// Materials
import MaterialList from '../pages/materials/MaterialList'
import MaterialForm from '../pages/materials/MaterialForm'
import BranchList from '../pages/master/BranchList'
import BranchForm from '../pages/master/BranchForm'
import WorkItemTypeList from '../pages/master/WorkItemTypeList'
import UnitList from '../pages/master/UnitList'
import AnnexureList from '../pages/master/AnnexureList'


// Vendors
import VendorList from '../pages/vendors/VendorList'
import VendorForm from '../pages/vendors/VendorForm'
import VendorDetails from '../pages/vendors/VendorDetails'

// Clients
import ClientList from '../pages/clients/ClientList'
import ClientForm from '../pages/clients/ClientForm'
import ClientDetails from '../pages/clients/ClientDetails'
import ClientGroupsList from '../pages/clients/ClientGroupsList'

// Procurement
import MaterialRequisitionList from '../pages/materialRequisitions/MaterialRequisitionList'
import MaterialRequisitionForm from '../pages/materialRequisitions/MaterialRequisitionForm'
import MaterialRequisitionDetails from '../pages/materialRequisitions/MaterialRequisitionDetails'
import PurchaseOrderList from '../pages/purchase-orders/PurchaseOrderList'
import PurchaseOrderForm from '../pages/purchase-orders/PurchaseOrderForm'
import PurchaseOrderDetails from '../pages/purchase-orders/PurchaseOrderDetails'

// Leads
import LeadList from '../pages/leads/LeadList'
import LeadForm from '../pages/leads/LeadForm'
import LeadDetails from '../pages/leads/LeadDetails'

// Quotations
import QuotationList from '../pages/quotations/QuotationList'
import QuotationForm from '../pages/quotations/QuotationForm'
import QuotationDetails from '../pages/quotations/QuotationDetails'

// Work Orders
import WorkOrderList from '../pages/workOrders/WorkOrderList'
import WorkOrderForm from '../pages/workOrders/WorkOrderForm'
import WorkOrderDetails from '../pages/workOrders/WorkOrderDetails'
import WorkOrderPrint from '../pages/workOrders/WorkOrderPrint'

// Warehouses
import WarehouseList from '../pages/warehouses/WarehouseList'
import WarehouseForm from '../pages/warehouses/WarehouseForm'

// Drawings
import DrawingList from '../pages/drawings/DrawingList'
import DrawingForm from '../pages/drawings/DrawingForm'

// Bar Bending Schedule
import BarBendingScheduleList from '../pages/barBendingSchedule/BarBendingScheduleList'
import BarBendingScheduleForm from '../pages/barBendingSchedule/BarBendingScheduleForm'

// Admin
import UserList from '../pages/admin/UserList'
import UserForm from '../pages/admin/UserForm'
import RoleList from '../pages/admin/RoleList'
import RoleForm from '../pages/admin/RoleForm'
import Settings from '../pages/admin/Settings'
import BudgetDashboard from '../pages/finance/BudgetDashboard'

const AppRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route
        path="/*"
        element={user ? <Layout /> : <Navigate to="/login" />}
      >
        {/* Dashboard */}
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />

        {/* Sales & CRM */}
        <Route path="sales/leads" element={<LeadList />} />
        <Route path="sales/leads/new" element={<LeadForm />} />
        <Route path="sales/leads/:id" element={<LeadDetails />} />
        <Route path="sales/leads/:id/edit" element={<LeadForm />} />
        <Route path="sales/quotations" element={<QuotationList />} />
        <Route path="sales/quotations/new" element={<QuotationForm />} />
        <Route path="sales/quotations/:id" element={<QuotationDetails />} />
        <Route path="sales/quotations/:id/edit" element={<QuotationForm />} />
        <Route path="sales/projects" element={<ProjectList />} />
        <Route path="sales/projects/new" element={<ProjectCreate />} />
        <Route path="sales/projects/:id" element={<ProjectDetails />} />
        <Route path="sales/projects/:id/edit" element={<ProjectEdit />} />
        <Route path="sales/clients" element={<ClientList />} />
        <Route path="sales/clients/new" element={<ClientForm />} />
        <Route path="sales/clients/:id" element={<ClientDetails />} />
        <Route path="sales/clients/:id/edit" element={<ClientForm />} />
        <Route path="sales/client-groups" element={<ClientGroupsList />} />

        {/* Master Data */}
        <Route path="master/materials" element={<MaterialList />} />
        <Route path="master/materials/new" element={<MaterialForm />} />
        <Route path="master/materials/:id" element={<MaterialForm />} />
        <Route path="master/warehouses" element={<WarehouseList />} />
        <Route path="master/warehouses/new" element={<WarehouseForm />} />
        <Route path="master/warehouses/:id" element={<WarehouseForm />} />
        <Route path="master/vendors" element={<VendorList />} />
        <Route path="master/vendors/new" element={<VendorForm />} />
        <Route path="master/vendors/:id" element={<VendorDetails />} />
        <Route path="master/vendors/:id/edit" element={<VendorForm />} />
        <Route path="master/equipment" element={<EquipmentList />} />
        <Route path="master/equipment/new" element={<EquipmentForm />} />
        <Route path="master/equipment/:id" element={<EquipmentForm />} />
        <Route path="master/work-item-types" element={<WorkItemTypeList />} />
        <Route path="master/units" element={<UnitList />} />
        <Route path="master/branches" element={<BranchList />} />
        <Route path="master/branches/new" element={<BranchForm />} />
        <Route path="master/branches/:id" element={<BranchForm />} />
        <Route path="master/annexure" element={<AnnexureList />} />

        {/* Procurement - Material Requisitions */}
        <Route path="procurement/requisitions" element={<MaterialRequisitionList />} />
        <Route path="procurement/requisitions/new" element={<MaterialRequisitionForm />} />
        <Route path="procurement/requisitions/:id" element={<MaterialRequisitionDetails />} />
        <Route path="procurement/requisitions/:id/edit" element={<MaterialRequisitionForm />} />

        {/* Aliases for legacy/user typed URLs */}
        <Route path="material-requisitions/create" element={<MaterialRequisitionForm />} />
        <Route path="material-requisitions" element={<MaterialRequisitionList />} />

        <Route path="procurement/purchase-orders" element={<PurchaseOrderList />} />
        <Route path="procurement/purchase-orders/new" element={<PurchaseOrderForm />} />
        <Route path="procurement/purchase-orders/:id" element={<PurchaseOrderDetails />} />
        <Route path="procurement/purchase-orders/:id/edit" element={<PurchaseOrderForm />} />


        {/* Inventory - Store Transactions */}
        <Route path="inventory/grn" element={<GRNList />} />
        <Route path="inventory/grn/new" element={<GRNForm />} />
        <Route path="inventory/grn/:id" element={<GRNDetails />} />
        <Route path="inventory/stn" element={<STNList />} />
        <Route path="inventory/stn/new" element={<STNForm />} />
        <Route path="inventory/stn/:id" element={<STNDetails />} />
        <Route path="inventory/stn/:id/edit" element={<STNForm />} />
        <Route path="inventory/srn" element={<SRNList />} />
        <Route path="inventory/srn/new" element={<SRNForm />} />
        <Route path="inventory/srn/:id" element={<SRNDetails />} />
        <Route path="inventory/srn/:id/edit" element={<SRNForm />} />
        <Route path="inventory/consumption/new" element={<UnifiedDailyReport />} />
        <Route path="inventory/daily-work-log" element={<UnifiedDailyReport />} />
        <Route path="inventory/daily-work-log/history" element={<DailyWorkLogList />} />
        <Route path="inventory/daily-work-log/:id" element={<DailyWorkLogDetails />} />
        <Route path="inventory/adjustment/new" element={<StockAdjustmentForm />} />

        {/* Stock Report */}
        <Route path="inventory/dashboard" element={<InventoryDashboard />} />
        <Route path="inventory/stock" element={<StockReport />} />

        {/* Operations - DPR */}
        <Route path="operations/dpr" element={<DPRList />} />
        <Route path="operations/dpr/new" element={<UnifiedDailyReport />} />
        <Route path="operations/dpr/:id" element={<DPRDetails />} />
        <Route path="operations/dpr/:id/edit" element={<UnifiedDailyReport />} />

        {/* Operations */}
        <Route path="operations/work-orders" element={<WorkOrderList />} />
        <Route path="operations/work-orders/new" element={<WorkOrderForm />} />
        <Route path="operations/work-orders/:id" element={<WorkOrderDetails />} />
        <Route path="operations/work-orders/:id/edit" element={<WorkOrderForm />} />
        <Route path="operations/work-orders/:id/print" element={<WorkOrderPrint />} />
        <Route path="operations/bar-bending" element={<BarBendingScheduleList />} />
        <Route path="operations/bar-bending/new" element={<BarBendingScheduleForm />} />
        <Route path="operations/bar-bending/:id" element={<BarBendingScheduleForm />} />

        <Route path="operations/equipment/rentals" element={<EquipmentRentals />} />
        <Route path="operations/equipment/rentals/new" element={<RentalForm />} />
        <Route path="operations/equipment/rentals/:rentalId/breakdown" element={<BreakdownForm />} />

        {/* Equipment Operations Routes */}
        <Route path="operations/equipment" element={<EquipmentList />} />
        <Route path="operations/equipment/new" element={<EquipmentForm />} />
        <Route path="operations/equipment/:id/edit" element={<EquipmentForm />} />

        import BudgetDashboard from '../pages/finance/BudgetDashboard'

        // ...

        {/* Finance - Expenses */}
        <Route path="finance/expenses" element={<ExpenseList />} />
        <Route path="finance/expenses/new" element={<ExpenseForm />} />
        <Route path="finance/budget" element={<BudgetDashboard />} />
        <Route path="finance/project-consumption" element={<ProjectConsumptionReport />} />

        {/* Reports */}
        <Route path="reports/project" element={<ProjectConsumptionReport />} />
        <Route path="reports/procurement-status" element={<ProcurementStatusReport />} />

        {/* Drawings */}
        <Route path="drawings" element={<DrawingList />} />
        <Route path="drawings/new" element={<DrawingForm />} />
        <Route path="drawings/new" element={<DrawingForm />} />
        <Route path="drawings/:id" element={<DrawingForm />} />

        {/* Administration - Mapped to Master Data as well */}
        <Route path="master/users" element={<UserList />} />
        <Route path="master/users/new" element={<UserForm />} />
        <Route path="master/users/:id" element={<UserForm />} />
        <Route path="master/roles" element={<RoleList />} />
        <Route path="master/roles/new" element={<RoleForm />} />
        <Route path="master/roles/:id" element={<RoleForm />} />

        {/* Administration */}
        <Route path="admin/users" element={<UserList />} />
        <Route path="admin/users/new" element={<UserForm />} />
        <Route path="admin/users/:id" element={<UserForm />} />
        <Route path="admin/roles" element={<RoleList />} />
        <Route path="admin/roles/new" element={<RoleForm />} />
        <Route path="admin/roles/:id" element={<RoleForm />} />
        <Route path="admin/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
