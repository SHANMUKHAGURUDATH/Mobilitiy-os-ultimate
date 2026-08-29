import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ModeProvider } from './context/ModeContext'
import DashboardLayout from './layouts/DashboardLayout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import LiveMap from './pages/LiveMap'
import NavigationPage from './pages/Navigation'
import Vehicles from './pages/Vehicles'
import PublicTransport from './pages/PublicTransport'
import MyVehicles from './pages/MyVehicles'
import Documents from './pages/Documents'
import Safety from './pages/Safety'
import Emergency from './pages/Emergency'
import Parking from './pages/Parking'
import FuelEV from './pages/FuelEV'
import Hazardous from './pages/Hazardous'
import RoadReports from './pages/RoadReports'
import Verification from './pages/Verification'
import Assistant from './pages/Assistant'
import DigitalTwin from './pages/DigitalTwin'
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'
import Privacy from './pages/Privacy'
import Settings from './pages/Settings'
import System from './pages/System'

export default function App() {
  return (
    <AuthProvider>
      <ModeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="live-map" element={<LiveMap />} />
            <Route path="navigation" element={<NavigationPage />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="public-transport" element={<PublicTransport />} />
            <Route path="my-vehicles" element={<MyVehicles />} />
            <Route path="documents" element={<Documents />} />
            <Route path="safety" element={<Safety />} />
            <Route path="emergency" element={<Emergency />} />
            <Route path="parking" element={<Parking />} />
            <Route path="fuel-ev" element={<FuelEV />} />
            <Route path="hazardous" element={<Hazardous />} />
            <Route path="road-reports" element={<RoadReports />} />
            <Route path="verification" element={<Verification />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="digital-twin" element={<DigitalTwin />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="settings" element={<Settings />} />
            <Route path="system" element={<System />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ModeProvider>
    </AuthProvider>
  )
}
