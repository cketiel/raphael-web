# Changelog — Booking Portal

All notable changes to `apps/booking`. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions: [SemVer](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-10-18

**Needs:** Raphael.Backend **2.3.0** or later (in production since 2026-10-17): Rejected status,
external Providers, provider users and the live position channel. The `provider_disabled` message
shows once the backend with RE-055 reaches production; until then nothing changes.

### Added
- **Final design, light and dark.** New login with the brand panel, IBM Plex and its own language
  (it follows the browser, and the portal adopts it at first sign-in). The theme follows the system
  until one is chosen, with no flash on load.
- **New frame**: foldable sidebar and rail (remembered), header with tabs, bottom bar, view switch,
  theme, language, bell and user menu.
- **Trips** in two views, Table and Timeline, with a summary band, cancel dialog, toasts and list
  states. Two-line rows with a status chip and the live ETA; a Date column only for multi-day ranges.
- **Trip tracking page** (`/trips/{id}`): live ETA, route times, map and satellite, driven and
  remaining route, and a progress bar pickup → drop-off. Finished and not-started trips use the same
  card (ride time from the route or the cached leg: no new Google request).
- **Live by server signals, no polling**: lists stay in memory across navigation and refresh only
  when the server says something changed. Changing the language never reloads the trips.
- **Trips export to CSV** in the SafeRide2 format the Desktop imports.
- **Filter the trips by Provider** (All, Raphael, the clinic's assignable Providers), for clinic
  users; list, timeline, counters, panels and exports follow it without a new request.
- **External Provider portal**: Provider users see Trips (follow, export, production report without
  funding sources) and an Integrator catalog (contact edits only); accept one or the selected trips,
  complete, no-show and reject with guided dialogs; exports carry only accepted trips.
- **Provider users for clinics**: in a Provider's file the clinic admin creates and switches off its
  users; whether the Provider can be given trips is shown.
- **Forced password change** while the password is someone else's; changing it ends the session.
- **Rejected status**: its own colour, shown live; rejected trips first in Needs attention; the
  clinic must change the Provider of a rejected trip, cannot change it once accepted, and can only
  cancel a trip accepted outside Raphael.
- **Rejected tab in notifications**, written in the reader's language.
- **Sign-in refused for a deactivated company** (RE-055): "Your company's access is disabled"
  (`provider_disabled`), not "account disabled". Users of a disabled integrator also get their own
  message.

### Changed
- **Sign-in page** (RE-058): "© Raphael · NEMT" is now Raphael's slogan, "Raphael Driving Health —
  The Rider’s Angel".
- Login fields and button spacing back to the portal's form style.

### Fixed
- The login logo was broken: brand assets no longer go through the session proxy.
- Dark theme on the screens and modals not yet redesigned (legacy tokens, tints, native controls).
- Wording of trips rejected by Raphael in notices and Needs attention.
- The tracking map framed the trip before its box had a size.

## [0.1.1] - 2026-10-09

### Fixed
- Signing in answered "Forbidden" on Azure: the CSRF check compared the page's Origin with the
  server's internal address behind the App Service front end. It now compares it with the host
  the browser called, as Next does for its Server Actions.

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
