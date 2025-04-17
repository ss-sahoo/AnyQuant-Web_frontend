import ClientOnly from "@/components/ClientOnly"
import { ResponsiveTradingPlatform } from "@/components/responsive-trading-platform"
// import AuthGuard from "@/components/AuthGuard"
// import ResponsiveTradingPlatform from "@/components/ResponsiveTradingPlatform" // your actual content

export default function HomePage() {
  return (
    <ClientOnly>
      {/* <AuthGuard> */}
      <ResponsiveTradingPlatform />
      {/* </AuthGuard> */}
    </ClientOnly>
  )
}
