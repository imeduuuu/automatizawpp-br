/**
 * N8N Workflows Reference
 * Maps to /n8n/* workflows that are the actual Camada 2 execution
 */

export const WORKFLOWS = {
  inbound_bridge: {
    id: "sales-os-inbound-bridge-v1",
    name: "Sales OS Inbound Bridge",
    path: "/n8n/workflow-sales-os-inbound-bridge.json",
  },
  followups_cron: {
    id: "sales-os-followups-cron-v1",
    name: "Sales OS Follow-Ups Runner",
    path: "/n8n/workflow-sales-os-followups-cron.json",
  },
  bird_email: {
    id: "5834942B",
    name: "Bird Email → Sales OS",
    path: "/n8n/workflow-bird-email-sales-os.json",
  },
} as const;

export async function triggerN8NWorkflow(
  workflowId: keyof typeof WORKFLOWS,
  payload: unknown
) {
  // Implementation would call n8n API to trigger workflow
  return { success: false, error: "N8N trigger not yet implemented" };
}
