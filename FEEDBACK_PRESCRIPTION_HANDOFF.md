# WOOF Feedback And Prescription Handoff

## Purpose

The Feedback module is now designed as a closed-loop prescription system. Generated recommendations can become active prescriptions, active prescriptions can be ended with Helpful or Not Helpful feedback, and completed feedback is stored for historical tracking and future model recalibration.

## Source Of Truth Tables

### `public.prescription_drafts`

Stores generated but undeployed prescriptions.

Current intended sources:
- AI-Predicted Bundle Opportunities from Bundle Simulator.
- Bundle campaign drafts from `campaign_drafts`.
- PetHub / Activation campaign drafts when available.
- Future staffing, traffic, forecast, or promo recommendations before user acceptance.

Important behavior:
- Bundle opportunity drafts use deterministic keys in the format `bundle_recommendation:bundle-<item-a-slug>-<item-b-slug>`.
- Bundle item slugs are sorted before the key is built, so `A + B` and `B + A` do not create separate drafts.
- When the same generated bundle appears again, WOOF updates only `generated_at` and `updated_at`.
- Existing draft status is preserved, so regenerated rows do not reset a `deployed`, `rejected`, or reviewed draft back to `pending`.

### `public.active_prescriptions`

Stores accepted/deployed prescriptions that should appear in Feedback under Active Prescription.

Current intended sources:
- Deployed AI-Predicted Bundle Opportunities.
- Accepted Staffing Recommendations.
- Activated Dynamic Happy Hour promos.
- PetHub / Activation campaigns when activated, queued, approved, or published depending on the activation flow.

### `public.recommendation_feedback`

Stores completed prescription feedback history.

This table should contain completed prescriptions only. It is the durable Completed Promotions / Completed Prescription history table for:
- Feedback result: `helpful` or `not-helpful`.
- Completed date and deployment metadata.
- Source category and source ID.
- Notes and metadata needed for future recalibration.

### `public.bundle_archives`

Still keeps bundle-specific archive records for the Bundle Archives section in Bundle Simulator.

When a bundle prescription is ended:
- The completed feedback history is stored in `recommendation_feedback`.
- The bundle archive copy is stored in `bundle_archives`.

## Current User Flow

### Bundle Prescription

1. Bundle Simulator generates AI-Predicted Bundle Opportunities.
2. Each generated bundle is synced into `prescription_drafts`.
3. User clicks `Deploy`.
4. Backend inserts or updates the matching row in `active_prescriptions`.
5. Matching draft in `prescription_drafts` is marked `deployed`.
6. Feedback page shows it under Active Prescription.
7. User clicks `End Promotion`.
8. User chooses `Yes, Helpful` or `No, Not Helpful`.
9. Backend marks the active prescription completed.
10. Backend writes completed history into `recommendation_feedback`.
11. Backend writes the bundle archive record into `bundle_archives`.
12. Future bundle model recalibration should consume the feedback result.

### Staffing Recommendation

1. AI Simulation generates staffing recommendations.
2. User clicks a subtle `Accept Recommendation` button on a specific sector card.
3. Backend stores that accepted recommendation in `active_prescriptions`.
4. Feedback page shows it under Active Prescription.
5. User ends it later and records Helpful or Not Helpful.
6. Completed history is stored in `recommendation_feedback`.
7. Future staffing/traffic model recalibration should consume the feedback result.

### Dynamic Promo / Happy Hour

1. User activates a Dynamic Happy Hour promo.
2. Backend stores the promo in its existing promo source table.
3. Backend mirrors the active promo into `active_prescriptions`.
4. Feedback page shows it under Active Prescription.
5. User ends it and records Helpful or Not Helpful.
6. Completed history is stored in `recommendation_feedback`.
7. Future dynamic promo model recalibration should consume the feedback result.

### PetHub / Activation Campaign

1. User creates, approves, queues, or publishes an Activation campaign.
2. Backend mirrors the campaign state into `prescription_drafts` and/or `active_prescriptions`.
3. Feedback page shows active campaigns under Active Prescription.
4. User ends the prescription.
5. Backend attempts PetHub takedown when the campaign is linked to PetHub.
6. Backend stores completed feedback in `recommendation_feedback`.
7. Future campaign/promotion model recalibration should consume the feedback result.

## Feedback Page Behavior

Active Prescription pulls from `active_prescriptions` first.

Completed Promotions pulls durable completed records from `recommendation_feedback`.

Fallback behavior remains in place so older source records can still be read when the source-of-truth tables are unavailable or empty. The fallback should not replace the canonical source-of-truth tables.

## Recalibration And Retraining Prompt

Use this prompt as the working specification for the next implementation phase:

```text
Implement WOOF's Feedback Recalibration Loop.

Goal:
Every accepted/deployed prescription must become a learning signal after the user ends it and marks it Helpful or Not Helpful. The signal must be routed back to the specific model or AI feature that generated the prescription, so future prescriptions improve over time.

Required workflow:
1. A prescription is generated by its source model or feature.
2. The generated prescription is stored in public.prescription_drafts if it is not yet deployed.
3. When the user accepts or deploys it, store it in public.active_prescriptions and mark the matching draft as deployed.
4. Feedback page displays active rows from public.active_prescriptions.
5. User clicks End Promotion / End Prescription.
6. User selects Yes, Helpful or No, Not Helpful.
7. Backend marks the active prescription completed.
8. Backend stores the completed history in public.recommendation_feedback.
9. Backend creates a recalibration event from the completed feedback.
10. The recalibration event is routed by category/source_type:
   - bundle or bundle_recommendation -> Bundle prescription / cross-sell model.
   - staffing or traffic_staffing_recommendation -> Staffing and traffic optimizer model.
   - happy_hour or dynamic_promo -> Dynamic Happy Hour / promo timing model.
   - pethub_campaign or activation_campaign -> Campaign Activation / PetHub campaign recommendation model.
   - forecast -> Forecast recommendation logic.
   - general -> Shared WOOF recommendation weighting.
11. Helpful feedback should reinforce the feature weights, confidence assumptions, and recommendation pattern that produced the accepted prescription.
12. Not Helpful feedback should trigger recalibration by lowering confidence for similar future prescriptions, recording the reason/notes, and adjusting category-specific heuristics or training examples.
13. Store recalibration records in a durable table or archive so retraining is auditable.
14. If a model cannot retrain immediately, enqueue the event and mark it pending instead of losing the feedback.

Expected output:
- A backend recalibration service that reads completed recommendation_feedback rows.
- A category/source_type router that sends each row to the correct model-specific recalibration handler.
- Model-specific handlers for bundle, staffing/traffic, dynamic promo, PetHub campaign, forecast, and general recommendations.
- Durable status tracking for recalibration events: pending, processed, failed.
- Safe fallbacks so Feedback completion still succeeds even if recalibration fails.
- Updated WORKLOG.md and validation steps.
```

## Suggested Future Recalibration Table

If a durable recalibration queue is needed, create a table similar to:

```sql
create table if not exists public.prescription_recalibration_events (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid references public.recommendation_feedback(id) on delete set null,
  category text not null,
  source_type text not null,
  source_id text,
  feedback text not null check (feedback in ('helpful', 'not-helpful')),
  notes text,
  target_model text not null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists prescription_recalibration_events_status_idx
  on public.prescription_recalibration_events (status);

create index if not exists prescription_recalibration_events_model_idx
  on public.prescription_recalibration_events (target_model);

notify pgrst, 'reload schema';
```

This table is not required for the current Feedback page UI, but it is the clean next step for automatic retraining and auditability.

## Validation Notes

Current validated behavior:
- Backend production build passes.
- Frontend production build passes.
- Bundle generated draft sync is duplicate-safe by deterministic key.
- Staffing recommendations can be accepted into Active Prescription.
- Feedback completion writes completed history into `recommendation_feedback`.
