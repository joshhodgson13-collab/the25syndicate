# The 2.5 Syndicate - PRD

## Original Problem Statement
Build a football betting tips app called "The 2.5 Syndicate" with admin section, 5 tabs, VIP subscription, and dark theme with gold accents.

## User Personas
- **Bettors**: Football enthusiasts looking for expert Over/Under 2.5 goals tips
- **VIP Subscribers**: Premium users paying £9.99/month for exclusive tips
- **Admin**: App owner who posts daily tips and updates results

## Core Requirements
- 5 tabs: Home, Results, VIP, About, My Account
- JWT-based authentication (email/password)
- Hidden admin panel (5 logo clicks + code)
- Stripe VIP subscription (£9.99/month)
- Dark theme with gold accents

## What's Been Implemented (Feb 4, 2026)
- ✅ Full authentication system (register/login/logout)
- ✅ Home page with today's betting tips (stake indicator, odds, kick-off time)
- ✅ Results page showing historical won/lost bets with scores
- ✅ VIP section with Stripe checkout integration
- ✅ About page with service information
- ✅ My Account page with user profile
- ✅ Hidden admin panel (5 logo clicks + code: syndicate2024)
- ✅ Admin can add bets, mark results (won/lost), delete bets
- ✅ Stats display (win rate, total tips)
- ✅ Dark theme with gold accents matching user screenshots
- ✅ Mobile-responsive design

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI
- Backend: FastAPI, MongoDB
- Payments: Stripe (emergentintegrations)
- Auth: JWT with bcrypt

## Admin Credentials
- Access: Click logo 5 times, enter code: `syndicate2024`
- Test admin: admin@syndicate.com / admin123

## Prioritized Backlog
### P0 (Critical) - Done
- [x] Core betting tips display
- [x] User authentication
- [x] Admin panel
- [x] VIP subscription

### P1 (Next Phase)
- [ ] Push notifications for new tips
- [ ] Email notifications for VIP users
- [ ] Monthly performance reports

### P2 (Future)
- [ ] Social sharing of tips
- [ ] Leaderboard/community features
- [ ] Multiple subscription tiers
