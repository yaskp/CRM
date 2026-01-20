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
import ProjectDetails from '../pages/projects/ProjectDetails'

// Store Transactions
import GRNList from '../pages/storeTransactions/GRNList'
import GRNForm from '../pages/storeTransactions/GRNForm'
import STNList from '../pages/storeTransactions/STNList'
import STNForm from '../pages/storeTransactions/STNForm'
import SRNList from '../pages/storeTransactions/SRNList'
import SRNForm from '../pages/storeTransactions/SRNForm'
import StockReport from '../pages/inventory/StockReport'

// DPR
import DPRList from '../pages/dpr/DPRList'
import DPRForm from '../pages/dpr/DPRForm'
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

// Materials
import MaterialList from '../pages/materials/MaterialList'
import MaterialForm from '../pages/materials/MaterialForm'
import WorkItemTypeList from '../pages/master/WorkItemTypeList'
import UnitList from '../pages/master/UnitList' // Import new page

// Vendors
import VendorList from '../pages/vendors/VendorList'
import VendorForm from '../pages/vendors/VendorForm'

// Clients
import ClientList from '../pages/clients/ClientList'
import ClientForm from '../pages/clients/ClientForm'
import ClientDetails from '../pages/clients/ClientDetails'

// Procurement
import MaterialRequisitionList from '../pages/materialRequisitions/MaterialRequisitionList'
import MaterialRequisitionForm from '../pages/materialRequisitions/MaterialRequisitionForm'
import PurchaseOrderList from '../pages/purchase-orders/PurchaseOrderList'
import PurchaseOrderForm from '../pages/purchase-orders/PurchaseOrderForm'

// Leads
import LeadList from '../pages/leads/LeadList'
import LeadForm from '../pages/leads/LeadForm'

// Quotations
import QuotationList from '../pages/quotations/QuotationList'
import QuotationForm from '../pages/quotations/QuotationForm'

// Work Orders
import WorkOrderList from '../pages/workOrders/WorkOrderList'
import WorkOrderForm from '../pages/workOrders/WorkOrderForm'

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
        <Route path="sales/leads/:id" element={<LeadForm />} />
        <Route path="sales/quotations" element={<QuotationList />} />
        <Route path="sales/quotations/new" element={<QuotationForm />} />
        <Route path="sales/quotations/:id" element={<QuotationForm />} />
        <Route path="sales/projects" element={<ProjectList />} />
        <Route path="sales/projects/new" element={<ProjectCreate />} />
        <Route path="sales/projects/:id" element={<ProjectDetails />} />
        <Route path="sales/clients" element={<ClientList />} />
        <Route path="sales/clients/new" element={<ClientForm />} />
        <Route path="sales/clients/:id" element={<ClientDetails />} />
        <Route path="sales/clients/:id/edit" element={<ClientForm />} />

        {/* Master Data */}
        <Route path="master/materials" element={<MaterialList />} />
        <Route path="master/materials/new" element={<MaterialForm />} />
        <Route path="master/materials/:id" element={<MaterialForm />} />
        <Route path="master/warehouses" element={<WarehouseList />} />
        <Route path="master/warehouses/new" element={<WarehouseForm />} />
        <Route path="master/warehouses/:id" element={<WarehouseForm />} />
        <Route path="master/vendors" element={<VendorList />} />
        <Route path="master/vendors/new" element={<VendorForm />} />
        <Route path="master/vendors/:id" element={<VendorForm />} />
        <Route path="master/equipment" element={<EquipmentList />} />
        <Route path="master/equipment/new" element={<EquipmentForm />} />
        <Route path="master/equipment/:id" element={<EquipmentForm />} />
        <Route path="master/work-item-types" element={<WorkItemTypeList />} />
        <Route path="master/units" element={<UnitList />} />

        {/* Procurement - Material Requisitions */}
        <Route path="procurement/requisitions" element={<MaterialRequisitionList />} />
        <Route path="procurement/requisitions/new" element={<MaterialRequisitionForm />} />
        <Route path="procurement/requisitions/:id" element={<MaterialRequisitionForm />} /> {/* View/Edit handled by form for now or make View component later */}
        <Route path="procurement/requisitions/:id/edit" element={<MaterialRequisitionForm />} />

        {/* Aliases for legacy/user typed URLs */}
        <Route path="material-requisitions/create" element={<MaterialRequisitionForm />} />
        <Route path="material-requisitions" element={<MaterialRequisitionList />} />

        <Route path="procurement/purchase-orders" element={<PurchaseOrderList />} />
        <Route path="procurement/purchase-orders/new" element={<PurchaseOrderForm />} />
        <Route path="purchase-orders" element={<PurchaseOrderList />} />
        <Route path="purchase-orders/new" element={<PurchaseOrderForm />} />

        {/* Inventory - Store Transactions */}
        <Route path="inventory/grn" element={<GRNList />} />
        <Route path="inventory/grn/new" element={<GRNForm />} />
        <Route path="inventory/grn/:id" element={<GRNForm />} />
        <Route path="inventory/stn" element={<STNList />} />
        <Route path="inventory/stn/new" element={<STNForm />} />
        <Route path="inventory/stn/:id" element={<STNForm />} />
        <Route path="inventory/srn" element={<SRNList />} />
        <Route path="inventory/srn/new" element={<SRNForm />} />
        <Route path="inventory/srn/:id" element={<SRNForm />} />

        {/* Stock Report */}
        <Route path="inventory/stock" element={<StockReport />} />

        {/* Operations - DPR */}
        <Route path="operations/dpr" element={<DPRList />} />
        <Route path="operations/dpr/new" element={<DPRForm />} />
        <Route path="operations/dpr/:id" element={<DPRDetails />} />
        <Route path="operations/dpr/:id/edit" element={<DPRForm />} />

        {/* Operations */}
        <Route path="operations/work-orders" element={<WorkOrderList />} />
        <Route path="operations/work-orders/new" element={<WorkOrderForm />} />
        <Route path="operations/work-orders/:id" element={<WorkOrderForm />} />
        <Route path="operations/bar-bending" element={<BarBendingScheduleList />} />
        <Route path="operations/bar-bending/new" element={<BarBendingScheduleForm />} />
        <Route path="operations/bar-bending/:id" element={<BarBendingScheduleForm />} />

        <Route path="operations/equipment/rentals" element={<EquipmentRentals />} />
        <Route path="operations/equipment/rentals/new" element={<RentalForm />} />
        <Route path="operations/equipment/rentals/:rentalId/breakdown" element={<BreakdownForm />} />

        {/* Finance - Expenses */}
        <Route path="finance/expenses" element={<ExpenseList />} />
        <Route path="finance/expenses/new" element={<ExpenseForm />} />
        <Route path="finance/project-consumption" element={<ProjectConsumptionReport />} />

        {/* Reports */}
        <Route path="reports/project" element={<ProjectConsumptionReport />} />

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
