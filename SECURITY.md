# Security

CoHost handles student availability, private club constraints, event commitments, and volunteer assignments. A working UI is not proof of backend authorization.

## Required production boundaries

- Supabase Auth establishes identity. Never authorize through a client-selected profile or user-editable user_metadata.
- Database membership determines who may act for a club. Club creation may grant the creator leadership of that new club only; joining another club must not grant leadership.
- Private briefs are separate from shared event messages, protected by row-level security and least-privilege grants.
- Leaders may approve only their club's contribution for the current proposal version. Changing terms invalidates prior approvals. Agents cannot approve on behalf of students.
- Only the organizer can publish volunteer openings, after all required current-version approvals exist.
- Student confirmations bind to the authenticated student; bookings enforce capacity and schedule conflicts atomically. Cancellation changes only the student's own commitment and never auto-enrolls replacements.
- Privileged keys never enter browser code, Git, logs, or demo state. Browser publishable keys do not replace RLS.
- Demo account switching is isolated from real authentication and real data.
- Agent messages are untrusted proposals, not instructions that grant permissions or trigger irreversible actions.

## Verification before release

Run negative permission tests as anon and multiple unrelated authenticated accounts, not just the database owner. Verify private-brief isolation, role spoofing denial, stale approval rejection, organizer-only publication, concurrent last-seat booking, overlapping shifts, cancellation ownership, and safe rendering of user content. Check Supabase security advisors, production HTTP security headers, and dependency audit results.

Record what actually ran in the release verification report. Until the real backend and production deployment are tested, security remains unverified.

## Reporting

Do not place credentials or students' private information in issues. Report security concerns privately to the repository owner.
