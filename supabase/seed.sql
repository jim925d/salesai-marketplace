-- SalesAI Marketplace — Seed Script
-- Run this in Supabase SQL Editor AFTER all migrations are complete.
--
-- This creates:
--   1. An admin user (linked to your Firebase UID)
--   2. A SalesAI developer profile
--   3. All 11 first-party app records
--
-- BEFORE RUNNING: Replace 'YOUR_FIREBASE_UID' below with your actual
-- Firebase UID. You can find it in:
--   Firebase Console → Authentication → Users → copy the "User UID"
--
-- If you haven't set up Firebase yet, use a placeholder like 'dev-admin-local'
-- and update it later.

-- ─── 1. Create admin user ────────────────────────────────────────────
INSERT INTO users (id, firebase_uid, email, name, role)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'YOUR_FIREBASE_UID',
  'admin@salesai.dev',
  'SalesAI Admin',
  'admin'
) ON CONFLICT (firebase_uid) DO NOTHING;

-- ─── 2. Create SalesAI developer profile ─────────────────────────────
INSERT INTO developer_profiles (id, user_id, company_name, verified, stripe_onboarded, bio)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'SalesAI',
  true,
  true,
  'First-party AI sales tools built by the SalesAI team.'
) ON CONFLICT DO NOTHING;

-- ─── 3. Insert all apps ──────────────────────────────────────────────

INSERT INTO apps (developer_id, name, slug, icon, category, price_cents, description, long_description, features, file_path, status, security_score, version, total_installs, avg_rating, review_count, published_at)
VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'Objection Response Generator',
  '01-objection-response-generator',
  '🎯',
  'Outreach',
  0,
  'AI-powered responses to common sales objections.',
  'Paste an email thread and get 2 strategic response options with negotiation tactics. Supports 8 tactics including anchoring, social proof, and urgency. Adjust tone and context for any situation.',
  '["Real-time objection analysis", "8 negotiation tactics", "Tone & context controls", "2 strategic response options", "Thread analysis"]',
  '/apps/01-objection-response-generator.html',
  'approved',
  95,
  '1.0.0',
  1240,
  4.8,
  86,
  now()
),
(
  'b0000000-0000-0000-0000-000000000001',
  'CRM Note Summarizer',
  '02-crm-note-summarizer',
  '📝',
  'Productivity',
  1900,
  'Summarize messy CRM notes into clean, actionable briefs.',
  'Paste any CRM notes — call logs, meeting notes, email threads — and get a structured summary with key actions, next steps, and follow-up dates extracted automatically.',
  '["Paste any CRM notes", "Key action extraction", "Next step identification", "Export-ready summaries"]',
  '/apps/02-crm-note-summarizer.html',
  'approved',
  92,
  '1.0.0',
  980,
  4.7,
  64,
  now()
),
(
  'b0000000-0000-0000-0000-000000000001',
  'ICP Match Scorer',
  '03-icp-match-scorer',
  '🎯',
  'Prospecting',
  2900,
  'Score leads against your ideal customer profile instantly.',
  'Define your ICP criteria with custom weights, then score any lead against it. Supports firmographic, technographic, and behavioral signals. Process leads individually or in batch.',
  '["Custom ICP criteria", "Weighted scoring model", "Batch processing", "Fit breakdown report"]',
  '/apps/03-icp-match-scorer.html',
  'approved',
  94,
  '1.0.0',
  870,
  4.6,
  52,
  now()
),
(
  'b0000000-0000-0000-0000-000000000001',
  'Contact Enricher',
  '04-contact-enricher',
  '🔍',
  'Prospecting',
  4900,
  'Enrich contact records with company and role data.',
  'Enter a name or email and get enriched company data, role detection, LinkedIn profile matching, and org chart positioning. Integrates with your CRM for auto-updates.',
  '["Company lookup", "Role detection", "LinkedIn integration", "Org chart positioning"]',
  '/apps/04-contact-enricher.html',
  'approved',
  91,
  '1.0.0',
  1100,
  4.5,
  71,
  now()
),
(
  'b0000000-0000-0000-0000-000000000001',
  'Cold Email Writer',
  '05-cold-email-writer',
  '📧',
  'Outreach',
  2900,
  'Generate personalized cold emails that get replies.',
  'Enter prospect details and get hyper-personalized cold emails with multiple subject line variants, A/B testing suggestions, and follow-up sequences. Optimized for deliverability.',
  '["Persona targeting", "Subject line variants", "A/B suggestions", "Follow-up sequences", "Deliverability optimization"]',
  '/apps/05-cold-email-writer.html',
  'approved',
  93,
  '1.0.0',
  1560,
  4.9,
  112,
  now()
),
(
  'b0000000-0000-0000-0000-000000000001',
  'LinkedIn Message Crafter',
  '06-linkedin-message-crafter',
  '💼',
  'Outreach',
  1900,
  'Craft LinkedIn connection requests and InMails that convert.',
  'Generate profile-aware LinkedIn messages that feel personal, not templated. Supports connection requests, InMails, and follow-up sequences with tone control.',
  '["Profile-aware messaging", "Follow-up sequences", "Tone control", "Connection request templates"]',
  '/apps/06-linkedin-message-crafter.html',
  'approved',
  90,
  '1.0.0',
  920,
  4.6,
  58,
  now()
),
(
  'b0000000-0000-0000-0000-000000000001',
  'Commission Calculator',
  '07-commission-calculator',
  '💰',
  'Productivity',
  0,
  'Calculate commissions across complex comp plans.',
  'Model any commission structure — tiered rates, accelerators, decelerators, SPIFs, and team overrides. Run what-if scenarios to see how deal outcomes affect your payout.',
  '["Tiered structures", "Accelerators & decelerators", "What-if scenarios", "Team overrides", "SPIF modeling"]',
  '/apps/07-commission-calculator.html',
  'approved',
  96,
  '1.0.0',
  2100,
  4.9,
  145,
  now()
),
(
  'b0000000-0000-0000-0000-000000000001',
  'Email-to-CRM Logger',
  '08-email-to-crm-logger',
  '📥',
  'Productivity',
  3900,
  'Parse emails and log structured data to your CRM.',
  'Paste any sales email and get structured CRM-ready data: contact info, company, deal stage, next steps, and custom field mapping. Auto-tags and categorizes for your pipeline.',
  '["Email parsing", "Field mapping", "Auto-tagging", "Deal stage detection"]',
  '/apps/08-email-to-crm-logger.html',
  'approved',
  89,
  '1.0.0',
  760,
  4.4,
  42,
  now()
),
(
  'b0000000-0000-0000-0000-000000000001',
  'Account Briefing Builder',
  '09-account-briefing-builder',
  '📊',
  'Meeting Prep',
  4900,
  'Build executive-ready account briefs in seconds.',
  'Enter an account name and get a comprehensive brief: company overview, recent news, key stakeholders, competitive landscape, and talking points. Perfect for QBRs and exec meetings.',
  '["Company research", "Recent news aggregation", "Stakeholder mapping", "Competitive intelligence", "Talking points"]',
  '/apps/09-account-briefing-builder.html',
  'approved',
  93,
  '1.0.0',
  680,
  4.7,
  38,
  now()
),
(
  'b0000000-0000-0000-0000-000000000001',
  'Discovery Question Generator',
  '10-discovery-question-generator',
  '❓',
  'Meeting Prep',
  0,
  'Generate targeted discovery questions for any prospect.',
  'Enter prospect details and get tailored discovery questions organized by framework (MEDDIC, BANT, SPIN, Challenger). Industry-specific and conversation-flow aware.',
  '["Industry-specific questions", "MEDDIC/BANT/SPIN frameworks", "Conversation flow", "Objection anticipation"]',
  '/apps/10-discovery-question-generator.html',
  'approved',
  94,
  '1.0.0',
  1340,
  4.8,
  93,
  now()
),
(
  'b0000000-0000-0000-0000-000000000001',
  'Seller Actions',
  '11-seller-actions',
  '🎯',
  'Prospecting',
  9900,
  'AI priority engine — ranks accounts by impact with win/churn scores.',
  'Upload your account list (CSV/JSON) and get AI-ranked priority actions across Prospecting, Growth, and Retention modes. Includes win probability modeling, churn risk scoring, and market intelligence.',
  '["Account upload (CSV/JSON)", "Win probability model", "Churn risk scoring", "Market intelligence", "Local data storage"]',
  '/apps/11-seller-actions.html',
  'approved',
  97,
  '1.0.0',
  420,
  4.9,
  28,
  now()
);

-- ─── Done ────────────────────────────────────────────────────────────
-- Verify: SELECT name, slug, status FROM apps;
-- You should see 11 rows, all with status = 'approved'
