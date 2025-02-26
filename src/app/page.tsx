import { LandingPage } from "@/components/landing-page"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <main className="flex-1">
        <LandingPage />
      </main>
      <SiteFooter />
    </div>
  )
}
