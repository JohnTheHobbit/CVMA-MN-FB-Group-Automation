# CVMA Facebook Group Automation — Business Overview

## The Problem

Managing Facebook group membership for the CVMA is a time-consuming manual process that falls on the Public Relations Officer, and Region Reps. Today, the PRO must:

- **Manually identify and add new members** to the Facebook group when they join the organization
- **Manually remove departing members** from the group — often without knowing when someone has left, or what their Facebook name is if it differs from their name in organizational records
- **Cross-reference** the organization's membership roster with Facebook group membership by memory or manual lookup

This creates delays in onboarding, gaps in offboarding, and an unsustainable workload as membership grows.

## The Solution

This system automates the communication and record-keeping around Facebook group membership so the PRO's role is reduced to two simple actions: approving join requests and removing departed members — both with the right information at their fingertips.

### What Changes for New Members

**Before:** A new member had to find the Facebook group on their own, or the PRO had to remember to invite them.

**After:**
1. When a new member is added to the organization's membership roster, they automatically receive a welcome email
2. The email contains a link to the Facebook group and a link to a simple profile setup page
3. On the profile setup page, the member can log in with Facebook (one click) to link their Facebook identity to their membership record — or paste their profile URL manually
4. The member requests to join the Facebook group
5. The PRO sees the join request and can instantly verify it against the linked Facebook profile in the membership database
6. The PRO approves the request

The member's Facebook display name and profile link are now stored alongside their membership record permanently.

### What Changes for Departing Members

**Before:** The PRO had to manually discover that someone left, figure out their Facebook name, find them in the group, and remove them.

**After:**
1. When a member's status changes to Inactive in the roster, the PRO automatically receives an email
2. The email contains the member's real name, their Facebook display name, a direct link to their Facebook profile, and a link to the group's member management page
3. The PRO clicks the links, confirms the identity, and removes them from the group

No more guessing, searching, or discovering months later that a former member is still in the group.

### What the PRO Still Does

Two actions remain manual because Facebook does not allow any software to add or remove group members on behalf of an admin:

1. **Approve join requests** in the Facebook group (now with profile data to verify identity)
2. **Remove departed members** from the Facebook group (now with an immediate alert and direct profile link)

## What Members Experience

New members receive a single welcome email with two simple steps:

1. Click a link to request to join the Facebook group
2. Click a second link and either log in with Facebook (recommended, one click) or paste their profile URL

The Facebook login only accesses their public name and profile ID. It **cannot** post on their behalf, see their private information, access their friends list, or do anything beyond reading the name they already display publicly.

Members who are already in the Facebook group before this system was deployed receive the same email and can link their profiles at their convenience. This is optional for existing members but helps the PRO identify them in the future.

## Implementation Requirements

### What an Implementing Chapter Needs

| Requirement | Purpose | Cost |
|---|---|---|
| **Membership database** with API access | Store member roster and Facebook profile data | Varies — the organization's existing member database can be extended with the necessary fields. No new database purchase is required. |
| **Workflow automation platform** | Run the three automated workflows (onboarding, profile linking, departure alerts) | Free or low-cost options available (n8n, Zapier free tier, Google Apps Script, etc.) |
| **Email sending capability** | Send onboarding and departure alert emails | Can use an existing organizational email account (Google Workspace, Microsoft 365, etc.) at no additional cost |
| **Static website hosting** | Host the Facebook profile setup page | Free options available (GitHub Pages, Cloudflare Pages, etc.) |
| **Facebook Developer App** | Enable the "Log in with Facebook" feature on the profile setup page | Free to create and operate. No fees, no App Review required. |

### Cost Summary

This system can be implemented with **zero additional software costs** if the chapter already has:

- An email account for sending automated messages
- A membership database that can be extended with additional fields
- Access to any free workflow automation tool
- Access to any free static hosting platform

No paid subscriptions, licenses, or third-party services are required.

### Database Fields Required

The existing membership database needs to support these additional fields per member:

| Field | What It Stores |
|---|---|
| Facebook User ID | The member's numeric Facebook identifier |
| Facebook Display Name | The name shown on their Facebook profile |
| Facebook Profile URL | A direct link to their Facebook profile |
| Facebook Group Status | Where the member is in the process (Not Invited → Invited → Joined → Removed) |
| Invite Sent Date | When the welcome email was sent |
| Onboarding Token | A unique code linking the member to their profile setup page |

These fields are added to existing member records. No new tables, databases, or systems are required.

### Personnel Requirements

| Role | Responsibility | Effort |
|---|---|---|
| **PRO** | Approve Facebook join requests, remove departed members, update group status in database | Reduced from current workload — now reactive (respond to alerts) rather than proactive (remember and search) |
| **Technical administrator** (one-time setup) | Configure the automation workflows, create the Facebook App, deploy the profile setup page, extend the database | One-time effort, approximately 8–10 hours |
| **Technical administrator** (ongoing) | Monitor automation logs, update Facebook API version annually | Minimal — less than 1 hour per month |

### Privacy and Compliance

- **Minimal data collection.** The system only captures a member's Facebook numeric ID and display name — the same information visible to anyone who views their Facebook profile.
- **No access to private data.** The system cannot see a member's posts, photos, friends, messages, or any private Facebook content.
- **No posting capability.** The system cannot post anything on behalf of the member.
- **Data stored internally.** Facebook profile data is stored only in the chapter's membership database, accessible only to chapter leadership. It is not shared with any external parties.
- **Privacy policy and data deletion process** are published and linked in the Facebook App configuration, as required by Meta.
- **Members have a choice.** If a member prefers not to use the Facebook login, they can manually paste their profile URL instead. The system works with either method.

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Facebook changes the login API | Low (login is a core Facebook product) | Would require updating the profile setup page | Facebook provides multi-year deprecation windows for API changes |
| Automation platform experiences downtime | Low | Onboarding emails delayed temporarily | Polling-based triggers automatically catch up when service resumes |
| Member doesn't complete profile linking | Medium | PRO can't cross-reference their Facebook identity | Reminder emails can be added; PRO can still manage the group manually |
| PRO doesn't act on departure alerts | Low | Former member remains in group | Periodic reconciliation reports can flag overdue removals |

### What This System Does NOT Do

To set clear expectations:

- **It does not automatically add members to the Facebook group.** Facebook does not allow this for any software. Members must still click "Join Group" and the PRO must approve.
- **It does not automatically remove members from the Facebook group.** Facebook does not allow this for any software. The PRO must still perform the removal, but now receives immediate alerts with all the information needed.
- **It does not replace the membership database.** It extends whatever database the chapter already uses with a few additional fields.
- **It does not require members to have Facebook accounts.** Members without Facebook simply won't be added to the group, which is the same as today.

## Summary

This system transforms Facebook group management from a manual, memory-dependent process into an automated, notification-driven workflow. The PRO goes from "remember to check, search, and guess" to "receive an alert, click two links, done." Implementation uses only free tools and can be completed in under two days of technical work.
