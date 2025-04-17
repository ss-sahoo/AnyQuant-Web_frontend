import ClientOnly from "@/components/ClientOnly"
import { ProfilePage } from "@/components/profile-page"
// import AuthGuard from "@/components/AuthGuard"
// import ResponsiveTradingPlatform from "@/components/ResponsiveTradingPlatform" // your actual content

export default function ProfileClientPage() {
  return (
    <ClientOnly>
      {/* <AuthGuard> */}
      <ProfilePage />
      {/* </AuthGuard> */}
    </ClientOnly>
  )
}
