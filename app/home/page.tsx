// "use client"
// import { ResponsiveTradingPlatform } from "@/components/responsive-trading-platform"
// import { useAuthGuard } from "@/hooks/useAuthGuard"

// export default function HomePage() {
//   useAuthGuard()
//   console.log("hiii",  )
//   return <ResponsiveTradingPlatform />
// }

// ✅ app/home/page.tsx
import HomeClientPage from "./HomeClientPage"

export default function HomePage() {
  return <HomeClientPage />
}
