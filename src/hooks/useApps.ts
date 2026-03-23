import { useEffect } from 'react'
import { useAppStore, type App } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'

// Local catalog used when Supabase is not configured
const LOCAL_APPS: App[] = [
  { id: '1',  name: 'Objection Response Generator', slug: '01-objection-response-generator', icon: '🎯', category: 'Outreach',      priceCents: 0,    description: 'AI-powered responses to common sales objections.',                  features: ['Real-time objection analysis','Tone & context controls','Multiple response strategies'], status: 'approved', securityScore: 95, version: '1.0.0', totalInstalls: 1240, avgRating: 4.8, reviewCount: 86, developerName: 'SalesAI' },
  { id: '2',  name: 'CRM Note Summarizer',          slug: '02-crm-note-summarizer',          icon: '📝', category: 'Productivity',   priceCents: 1900, description: 'Summarize messy CRM notes into clean, actionable briefs.',            features: ['Paste any CRM notes','Key action extraction','Export-ready summaries'], status: 'approved', securityScore: 92, version: '1.0.0', totalInstalls: 980,  avgRating: 4.7, reviewCount: 64, developerName: 'SalesAI' },
  { id: '3',  name: 'ICP Match Scorer',              slug: '03-icp-match-scorer',              icon: '🎯', category: 'Prospecting',   priceCents: 2900, description: 'Score leads against your ideal customer profile instantly.',           features: ['Custom ICP criteria','Weighted scoring','Batch processing'], status: 'approved', securityScore: 94, version: '1.0.0', totalInstalls: 870,  avgRating: 4.6, reviewCount: 52, developerName: 'SalesAI' },
  { id: '4',  name: 'Contact Enricher',              slug: '04-contact-enricher',              icon: '🔍', category: 'Prospecting',   priceCents: 4900, description: 'Enrich contact records with company and role data.',                  features: ['Company lookup','Role detection','LinkedIn integration'], status: 'approved', securityScore: 91, version: '1.0.0', totalInstalls: 1100, avgRating: 4.5, reviewCount: 71, developerName: 'SalesAI' },
  { id: '5',  name: 'Cold Email Writer',             slug: '05-cold-email-writer',             icon: '📧', category: 'Outreach',      priceCents: 2900, description: 'Generate personalized cold emails that get replies.',                 features: ['Persona targeting','Subject line variants','A/B suggestions'], status: 'approved', securityScore: 93, version: '1.0.0', totalInstalls: 1560, avgRating: 4.9, reviewCount: 112, developerName: 'SalesAI' },
  { id: '6',  name: 'LinkedIn Message Crafter',      slug: '06-linkedin-message-crafter',      icon: '💼', category: 'Outreach',      priceCents: 1900, description: 'Craft LinkedIn connection requests and InMails that convert.',       features: ['Profile-aware messaging','Follow-up sequences','Tone control'], status: 'approved', securityScore: 90, version: '1.0.0', totalInstalls: 920,  avgRating: 4.6, reviewCount: 58, developerName: 'SalesAI' },
  { id: '7',  name: 'Commission Calculator',         slug: '07-commission-calculator',         icon: '💰', category: 'Productivity',  priceCents: 0,    description: 'Calculate commissions across complex comp plans.',                   features: ['Tiered structures','Accelerators & decelerators','What-if scenarios'], status: 'approved', securityScore: 96, version: '1.0.0', totalInstalls: 2100, avgRating: 4.9, reviewCount: 145, developerName: 'SalesAI' },
  { id: '8',  name: 'Email-to-CRM Logger',           slug: '08-email-to-crm-logger',           icon: '📥', category: 'Productivity',  priceCents: 3900, description: 'Parse emails and log structured data to your CRM.',                  features: ['Email parsing','Field mapping','Auto-tagging'], status: 'approved', securityScore: 89, version: '1.0.0', totalInstalls: 760,  avgRating: 4.4, reviewCount: 42, developerName: 'SalesAI' },
  { id: '9',  name: 'Account Briefing Builder',      slug: '09-account-briefing-builder',      icon: '📊', category: 'Meeting Prep',  priceCents: 4900, description: 'Build executive-ready account briefs in seconds.',                   features: ['Company research','Recent news','Stakeholder mapping'], status: 'approved', securityScore: 93, version: '1.0.0', totalInstalls: 680,  avgRating: 4.7, reviewCount: 38, developerName: 'SalesAI' },
  { id: '10', name: 'Discovery Question Generator',  slug: '10-discovery-question-generator',  icon: '❓', category: 'Meeting Prep',  priceCents: 0,    description: 'Generate targeted discovery questions for any prospect.',             features: ['Industry-specific questions','MEDDIC/BANT frameworks','Conversation flow'], status: 'approved', securityScore: 94, version: '1.0.0', totalInstalls: 1340, avgRating: 4.8, reviewCount: 93, developerName: 'SalesAI' },
  { id: '11', name: 'Seller Actions',                slug: '11-seller-actions',                icon: '🎯', category: 'Prospecting',   priceCents: 9900, description: 'AI priority engine — ranks accounts by impact with win/churn scores.', features: ['Account upload (CSV/JSON)','Win probability model','Churn risk scoring','Market intelligence'], status: 'approved', securityScore: 97, version: '1.0.0', totalInstalls: 420,  avgRating: 4.9, reviewCount: 28, developerName: 'SalesAI' },
]

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  return Boolean(url && !url.includes('placeholder'))
}

// Fetch, filter, and sort marketplace apps
export function useApps() {
  const { apps, loading, setApps, setLoading } = useAppStore()

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      if (apps.length === 0) setApps(LOCAL_APPS)
      return
    }

    // Fetch from Supabase
    setLoading(true)
    supabase
      .from('apps')
      .select('*, developer_profiles(company_name)')
      .eq('status', 'approved')
      .then(({ data, error }) => {
        if (error || !data?.length) {
          // Fallback to local catalog
          setApps(LOCAL_APPS)
        } else {
          // Map snake_case DB columns to camelCase App type
          const mapped: App[] = data.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            name: row.name as string,
            slug: row.slug as string,
            icon: row.icon as string,
            category: row.category as App['category'],
            priceCents: row.price_cents as number,
            description: row.description as string,
            longDescription: (row.long_description as string) || undefined,
            features: typeof row.features === 'string' ? JSON.parse(row.features as string) : (row.features as string[]) || [],
            status: row.status as string,
            securityScore: (row.security_score as number) || undefined,
            version: row.version as string,
            totalInstalls: (row.total_installs as number) || 0,
            avgRating: (row.avg_rating as number) || 0,
            reviewCount: (row.review_count as number) || 0,
            developerName: (row.developer_profiles as Record<string, string>)?.company_name || 'Unknown',
          }))
          setApps(mapped)
        }
      })
  }, [])

  return { apps, loading, error: null }
}
