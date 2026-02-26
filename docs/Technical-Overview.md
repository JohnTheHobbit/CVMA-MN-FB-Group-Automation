# CVMA Facebook Group Automation — Technical Overview

## Problem Statement

Managing Facebook group membership for the CVMA is a manual, error-prone process. The Public Relations Officer must manually add new members to the group and remove departed members — often without knowing when someone has left the organization or what their Facebook display name is if it differs from their legal name.

## Constraint: Facebook Groups API Deprecation

As of April 2024, Meta fully deprecated all third-party API access to Facebook Groups. There is **no programmatic method** to:

- Add or remove members from a Facebook group
- List current group members
- Generate group invite links via API

This constraint is permanent and applies to all developers regardless of scale or partnership status. Any solution must work within this limitation.

## Solution Architecture

This system uses a semi-automated, ToS-compliant approach that minimizes manual effort while staying within Facebook's platform rules. The only manual steps that remain are actions that Facebook requires a human group admin to perform: approving join requests and removing members.

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MEMBER DATABASE                              │
│           (any system with API access or webhook support)           │
└──────────┬──────────────────────────────────────┬───────────────────┘
           │ New Active Member                    │ Status → Inactive
           ▼                                      ▼
┌─────────────────────┐              ┌──────────────────────────────┐
│ AUTOMATION ENGINE    │              │ AUTOMATION ENGINE             │
│ Workflow 1: Onboard  │              │ Workflow 3: Departure Alert   │
│                      │              │                               │
│ 1. Detect new member │              │ 1. Detect status change       │
│ 2. Generate unique   │              │ 2. Look up FB profile from DB │
│    onboarding token  │              │ 3. Email PRO with:            │
│ 3. Store token in DB │              │    - Member name              │
│ 4. Send welcome email│              │    - FB display name          │
│    with group link + │              │    - FB profile link          │
│    profile collector │              │    - Group admin link         │
│    link              │              │ 4. Mark "Pending Removal"     │
│ 5. Mark "Invited"    │              │    in DB                      │
└─────────┬────────────┘              └──────────────────────────────┘
          │
          │ Member clicks profile collector link
          ▼
┌──────────────────────────────────────────────┐
│ PROFILE COLLECTOR (static web app)           │
│                                              │
│ Hosted on any static hosting platform        │
│ (GitHub Pages, S3, Cloudflare Pages, etc.)   │
│                                              │
│ Option A: Facebook OAuth Login               │
│   - Uses Facebook JavaScript SDK             │
│   - Requests only "public_profile" scope     │
│   - Captures: FB User ID, Display Name       │
│   - Constructs profile URL from numeric ID   │
│                                              │
│ Option B: Manual URL Entry (fallback)        │
│   - Member pastes their FB profile URL       │
│   - Validated client-side (facebook.com/*)   │
│                                              │
│ Submits data via POST to webhook endpoint    │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│ AUTOMATION ENGINE                            │
│ Workflow 2: Profile Data Receiver            │
│                                              │
│ 1. Receive POST from profile collector       │
│ 2. Validate token against database           │
│ 3. Store FB User ID, Display Name,           │
│    Profile URL in member record              │
│ 4. Return success/error to collector page    │
└──────────────────────────────────────────────┘
```

### Component Descriptions

**Member Database** — Any database system that stores member roster data and supports the following fields:

| Field | Type | Purpose |
|---|---|---|
| Member Name | Text | Legal/roster name |
| Email | Email | For sending onboarding emails |
| Member Status | Enum | Active, Inactive |
| FB User ID | Text | Numeric Facebook user ID from OAuth |
| FB Display Name | Text | Name as it appears on Facebook |
| FB Profile URL | URL | Direct link to the member's Facebook profile |
| FB Group Status | Enum | Not Invited, Invited, Joined, Pending Removal, Removed |
| FB Invite Sent Date | Date | When the onboarding email was sent |
| FB Onboarding Token | Text | Unique token linking the member to their profile collector URL |

The database must support either:
- Polling (the automation engine queries for changes periodically), or
- Webhooks/triggers (the database notifies the automation engine on record changes)

**Automation Engine** — Any workflow automation platform capable of:
- Polling or receiving webhooks from the member database
- Sending emails via SMTP or an email API
- Receiving inbound HTTP webhooks
- Executing simple code/logic (filtering, token generation)
- Updating records in the member database via API

Examples: n8n, Zapier, Make (Integromat), Apache Airflow, custom scripts, cloud functions.

**Profile Collector** — A static web application consisting of HTML, CSS, and JavaScript. No server-side runtime is required. It needs:
- A Facebook App (free to create at developers.facebook.com) with Facebook Login for Web enabled
- Static file hosting with HTTPS (any provider works)
- Connectivity to the automation engine's webhook endpoint

**Email Service** — Any email sending capability. Can be:
- An organizational email account (Google Workspace, Microsoft 365)
- A transactional email service (SendGrid, Mailgun, SES)
- An SMTP server

### Facebook App Requirements

A Facebook App is required for the OAuth login flow on the profile collector page. Configuration:

| Setting | Value |
|---|---|
| App Type | Consumer |
| Product | Facebook Login for Web |
| Permissions | `public_profile` only (default, no App Review required) |
| JavaScript SDK Login | Enabled |
| Allowed JS SDK Domains | The domain hosting the profile collector |
| Valid OAuth Redirect URIs | The profile collector page URL |
| Privacy Policy URL | Must be publicly accessible (required for Live mode) |
| Data Deletion Instructions URL | Must be publicly accessible (required for Live mode) |

The `public_profile` permission is granted by default to all Facebook Apps and provides access to only the user's numeric ID and display name. No App Review process is required. The app must be switched from Development to Live mode for general use.

### Security Model

- **No secrets in client-side code.** The Facebook App ID is inherently public (embedded in every site using Facebook Login). The webhook URL is a POST endpoint that validates tokens server-side.
- **Token-based authentication.** Each member receives a unique, randomly generated token in their onboarding URL. The webhook validates this token against the database before accepting any data. Invalid tokens are rejected with a 400 response.
- **Minimal data collection.** Only the Facebook user ID and display name are captured via OAuth. No access to posts, friends, photos, or any other Facebook data.
- **No Facebook access tokens are stored.** The short-lived OAuth token is used immediately in the browser to call the `/me` endpoint and is never transmitted to the server.

### Resilience Characteristics

| Concern | Mitigation |
|---|---|
| Onboarding email fails to send | Record stays as "Not Invited" and is retried on the next automation cycle |
| Member doesn't complete profile linking | PRO can still approve group requests manually; reminders can be added |
| Webhook receives invalid token | Returns 400; no database modification occurs |
| Automation engine downtime | Polling-based triggers catch up automatically when service resumes |
| Facebook SDK version deprecated | Meta provides ~2 year deprecation windows; update the API version string in config |
| Member uses manual URL entry | PRO gets a URL instead of a numeric ID; still sufficient to identify the member |

### Remaining Manual Steps

These steps cannot be automated due to the Facebook Groups API deprecation:

1. **PRO approves Facebook group join requests** — The onboarding email directs the member to request to join the group. The PRO can cross-reference the request with the Facebook profile data now stored in the database.
2. **PRO removes departed members** — The departure alert email provides the member's Facebook profile link and a direct link to the group members page. The PRO removes them and updates the database status to "Removed."

### Monitoring Recommendations

- Review automation execution logs periodically for failed runs
- Create a database view/report for records stuck in "Invited" status longer than 7 days (members who received the email but haven't linked their profile)
- Create a database view/report for records in "Pending Removal" status longer than 3 days (PRO hasn't acted on the departure alert yet)
- Track the Facebook Graph API version lifecycle and update the config before the current version is deprecated

### Potential Enhancements

- **Reminder emails** — A fourth workflow that sends follow-up emails to members who haven't completed profile linking after N days
- **Reconciliation reports** — Periodic digest email to the PRO listing all pending actions (unlinked profiles, pending removals)
- **Token expiration** — Add an expiration date to onboarding tokens and reject expired tokens at the webhook
- **Airtable automation triggers** — Replace polling with database-native automation triggers for true real-time processing where supported
