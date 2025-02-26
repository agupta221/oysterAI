import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: 'Pricing | Oyster AI',
  description: 'Choose the right plan for your learning journey',
}

interface PricingTierProps {
  name: string
  price: string
  description: string
  features: string[]
  buttonText: string
  popular?: boolean
}

function PricingTier({ 
  name, 
  price, 
  description, 
  features, 
  buttonText, 
  popular = false 
}: PricingTierProps) {
  return (
    <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${
      popular ? 'border-primary ring-2 ring-primary/20' : ''
    }`}>
      <div className="flex flex-col p-6 space-y-2">
        {popular && (
          <div className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full self-start mb-2">
            Most Popular
          </div>
        )}
        <h3 className="text-2xl font-bold">{name}</h3>
        <div className="mt-2">
          <span className="text-4xl font-bold">{price}</span>
          {price !== 'Free' && <span className="text-muted-foreground ml-1">/month</span>}
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="p-6 pt-0 space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-4 w-4 text-primary mr-2" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 pt-0">
        <Button className="w-full" variant={popular ? "default" : "outline"}>
          {buttonText}
        </Button>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for you and start your personalized learning journey today.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingTier
              name="Free"
              price="Free"
              description="Perfect for trying out Oyster AI"
              features={[
                "5 AI-generated courses",
                "Basic course customization",
                "Community support",
                "7-day course history"
              ]}
              buttonText="Get Started"
            />
            
            <PricingTier
              name="Pro"
              price="$19"
              description="For serious learners who want more"
              features={[
                "Unlimited AI-generated courses",
                "Advanced course customization",
                "Priority support",
                "30-day course history",
                "Download courses as PDF"
              ]}
              buttonText="Subscribe to Pro"
              popular={true}
            />
            
            <PricingTier
              name="Teams"
              price="$49"
              description="Perfect for small teams and educators"
              features={[
                "Everything in Pro",
                "Up to 5 team members",
                "Team analytics dashboard",
                "Collaborative learning tools",
                "Dedicated account manager",
                "API access"
              ]}
              buttonText="Contact Sales"
            />
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Need a custom plan?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              We offer custom plans for larger teams and organizations. Contact us to discuss your needs.
            </p>
            <Button variant="outline" size="lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
} 