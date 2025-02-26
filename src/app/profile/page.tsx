import { ProfileClient } from './client'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: 'Profile | Oyster AI',
  description: 'Manage your Oyster AI account',
}

export default function ProfilePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <ProfileClient />
      </main>
      <SiteFooter />
    </div>
  )
} 