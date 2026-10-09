# Changelog — Booking Portal

All notable changes to `apps/booking`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions: [SemVer](https://semver.org/).

## [0.1.0] - 2026-10-08
First release: the reference build before the final design. Not deployed yet.

### Added
- Next.js portal with a BFF: backend tokens stay on the server, the browser holds only an encrypted session cookie.
- Trips: list by date range, summary cards, booking and editing with Google Maps routes and address suggestions, round trips, cancel selected, export report.
- Live trip list, notification bell and trip tracking with the vehicle under way.
- English and Spanish, remembered per user.
- User menu with password change.
- Provider catalogue: contracted providers, contract and remove from the list, a Provider on each trip.
- Notifications tab with tabs by event, trip search and highlight of the trip.
- Admin tab for clinic admins: users, organization with its API key, and billing.
- Portal version shown in the sidebar and the user menu.

### Changed
- Provisional redesign with a shared UI kit and Bootstrap Icons.

### Fixed
- Export Report is always visible, disabled when there is nothing to export.
