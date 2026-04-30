# Example Workflows

## 1) New Inbound Lead

1. Lead sends message from WhatsApp.
2. n8n or channel webhook posts event to `/api/events/inbound`.
3. Orchestrator checks compliance and next best action.
4. Lead Response + Qualification run.
5. Writer polishes outbound copy.
6. Sales QA scores output.
7. Message is sent and memory updated.
8. Follow-up task is scheduled if conversion not immediate.

## 2) Objection Handling

1. Inbound message includes objection text (`too expensive`).
2. Orchestrator routes to Objection Handling Agent.
3. Objection type is classified (PRICE).
4. Response reframes risk and asks commitment-friendly question.
5. Objection is stored in `ObjectionRecord`.
6. If buying signal appears, handoff to Closer.

## 3) Missed Call Follow-Up

1. Call outcome stored as `NO_ANSWER`.
2. Follow-up engine schedules touch within 6-24h based on lead temperature.
3. Message sent with context + easy rebooking CTA.
4. No-show and missed-call recovery metrics updated.

## 4) Cold Lead Revival

1. Lead has no response for 14+ days and not opted-out.
2. Follow-Up Agent selects low-pressure value angle.
3. Sends reactivation message with new proof/case study.
4. If no response, sequence spacing increases.
5. If negative intent appears, outreach pauses.

## 5) Ready-to-Close Lead

1. Lead score and intent pass threshold.
2. Orchestrator routes to Closer Agent.
3. Closer sends direct CTA with two scheduling options.
4. Call Assist prepares script for closer/human rep.
5. Post-call transcript analyzed and next action generated.
