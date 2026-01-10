import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Dashboard from '../pages/Dashboard'
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

// Materials
import MaterialList from '../pages/materials/MaterialList'
import MaterialForm from '../pages/materials/MaterialForm'

// Vendors
import VendorList from '../pages/vendors/VendorList'
import VendorForm from '../pages/vendors/VendorForm'

// Material Requisitions
import MaterialRequisitionList from '../pages/materialRequisitions/MaterialRequisitionList'
import MaterialRequisitionForm from '../pages/materialRequisitions/MaterialRequisitionForm'

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

        {/* Procurement - Material Requisitions */}
        <Route path="procurement/requisitions" element={<MaterialRequisitionList />} />
        <Route path="procurement/requisitions/new" element={<MaterialRequisitionForm />} />
        <Route path="procurement/vendors" element={<VendorList />} />

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
        <Route path="operations/equipment" element={<EquipmentList />} />
        <Route path="operations/equipment/new" element={<EquipmentForm />} />
        <Route path="operations/equipment/rentals" element={<EquipmentRentals />} />
        <Route path="operations/equipment/rentals/new" element={<RentalForm />} />
        <Route path="operations/equipment/rentals/:rentalId/breakdown" element={<BreakdownForm />} />

        {/* Finance - Expenses */}
        <Route path="finance/expenses" element={<ExpenseList />} />
        <Route path="finance/expenses/new" element={<ExpenseForm />} />

        {/* Drawings */}
        <Route path="drawings" element={<DrawingList />} />
        <Route path="drawings/new" element={<DrawingForm />} />
        <Route path="drawings/:id" element={<DrawingForm />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
