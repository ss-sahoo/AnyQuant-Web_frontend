import { redirect } from "next/navigation"

// The app has no landing page of its own: "/" (logout, logo, "Back to Home") opens the app home.
export default function Home() {
  redirect("/home")
}
