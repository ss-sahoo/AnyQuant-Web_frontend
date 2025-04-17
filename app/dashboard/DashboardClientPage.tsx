import ClientOnly from "@/components/ClientOnly"
import { ResponsiveExpandedDashboard } from "@/components/responsive-expanded-dashboard"
// import AuthGuard from "@/components/AuthGuard"
// import ResponsiveTradingPlatform from "@/components/ResponsiveTradingPlatform" // your actual content

export default function DashboardClientPage() {
  return (
    <ClientOnly>
      {/* <AuthGuard> */}
      <ResponsiveExpandedDashboard />
      {/* </AuthGuard> */}
    </ClientOnly>
  )
}
