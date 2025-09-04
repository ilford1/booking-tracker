// Use client-side rendering to avoid server-side connectivity issues - force redeploy
import ClientDashboard from './dashboard-client'

export default function Dashboard() {
  return <ClientDashboard />
}
