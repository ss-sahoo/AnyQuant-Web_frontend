// import { ResponsiveExpandedDashboard } from "@/components/responsive-expanded-dashboard"

// export default function DashboardPage() {
//   return <ResponsiveExpandedDashboard />
// }

import AuthGuard from "@/hooks/useAuthGuard"
import DashboardClientPage from "./DashboardClientPage"

export default function HomePage() {
 
  return <DashboardClientPage />
  
}
