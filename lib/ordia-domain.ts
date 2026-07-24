export type FieldKind =
  | "text"
  | "longText"
  | "number"
  | "money"
  | "date"
  | "time"
  | "boolean"
  | "select"
  | "person"
  | "place"
  | "document"
  | "relationship"
  | "list";

export type FieldDefinition = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  help?: string;
  options?: string[];
};

export type EntityDefinition = {
  type: string;
  label: string;
  family: string;
  description: string;
  fields: FieldDefinition[];
  capabilities: string[];
  lifecycle: string[];
  relationships: string[];
  generates: string[];
  completionWritesBack?: string[];
};

const common = {
  documents: "Attach and classify documents",
  history: "Retain a dated activity and outcome history",
  reminders: "Run a configurable reminder and escalation policy",
  access: "Apply household, personal or emergency visibility",
};

export const entityRegistry: EntityDefinition[] = [
  {
    type: "person",
    label: "Household member",
    family: "People & care",
    description: "A person whose needs, commitments and household context are represented.",
    fields: [
      { key: "name", label: "Name", kind: "text", required: true },
      { key: "role", label: "Household role", kind: "select", options: ["Adult", "Child", "Dependant adult"] },
      { key: "dateOfBirth", label: "Date of birth", kind: "date" },
      { key: "needs", label: "Needs and restrictions", kind: "list" },
    ],
    capabilities: [common.documents, common.history, common.access, "Own, perform or receive work", "Hold preferences, sizes and requirements"],
    lifecycle: ["active", "temporarily away", "inactive", "archived"],
    relationships: ["member of household", "attends organisation", "covered by policy", "requires medication", "included in trip"],
    generates: ["personal checks", "appointments", "renewals", "packing requirements"],
  },
  {
    type: "pet",
    label: "Pet",
    family: "People & care",
    description: "An animal with feeding, care, medical and emergency needs.",
    fields: [
      { key: "name", label: "Name", kind: "text", required: true },
      { key: "species", label: "Species", kind: "text" },
      { key: "microchip", label: "Microchip number", kind: "text" },
      { key: "diet", label: "Diet", kind: "longText" },
    ],
    capabilities: [common.documents, common.history, common.reminders, "Track feeding and medication", "Surface emergency care instructions"],
    lifecycle: ["active", "boarding", "missing", "deceased", "archived"],
    relationships: ["registered with vet", "insured by", "cared for by", "consumes supply"],
    generates: ["feeding checks", "vaccination renewals", "medication administrations", "stock actions"],
  },
  {
    type: "property",
    label: "Property",
    family: "Places & home",
    description: "A home or property with utilities, access, maintenance and compliance obligations.",
    fields: [
      { key: "name", label: "Name", kind: "text", required: true },
      { key: "address", label: "Address", kind: "longText" },
      { key: "occupancy", label: "Occupancy", kind: "select", options: ["Owned", "Mortgaged", "Rented", "Other"] },
      { key: "emergencyInfo", label: "Emergency information", kind: "longText" },
    ],
    capabilities: [common.documents, common.history, "Contain rooms, assets and supplies", "Hold utilities, access and emergency plans"],
    lifecycle: ["prospective", "occupied", "vacant", "moving", "disposed", "archived"],
    relationships: ["occupied by", "insured by", "supplied by utility", "contains room"],
    generates: ["maintenance", "safety checks", "bill reviews", "moving workflows"],
  },
  {
    type: "room",
    label: "Room or zone",
    family: "Places & home",
    description: "A physical zone used to locate, contain and maintain household things.",
    fields: [
      { key: "name", label: "Name", kind: "text", required: true },
      { key: "purpose", label: "Purpose", kind: "text" },
      { key: "access", label: "Access notes", kind: "longText" },
    ],
    capabilities: [common.history, "Contain assets, supplies and storage locations", "Carry cleaning and safety routines"],
    lifecycle: ["active", "being changed", "unused", "archived"],
    relationships: ["part of property", "contains asset", "contains storage location"],
    generates: ["room checks", "cleaning routines", "project work"],
  },
  {
    type: "storageLocation",
    label: "Storage location",
    family: "Places & home",
    description: "A precise place where an item can be found and replenished.",
    fields: [
      { key: "name", label: "Name", kind: "text", required: true },
      { key: "photo", label: "Location photo", kind: "document" },
      { key: "restrictions", label: "Safety or access restrictions", kind: "longText" },
    ],
    capabilities: ["Contain inventory", "Show last verified location", "Support move history"],
    lifecycle: ["active", "full", "unavailable", "archived"],
    relationships: ["inside room", "stores item", "accessible by person"],
    generates: ["inventory checks", "relocation actions"],
  },
  {
    type: "vehicle",
    label: "Vehicle",
    family: "Assets & equipment",
    description: "A vehicle with legal, maintenance, driver and journey obligations.",
    fields: [
      { key: "registration", label: "Registration", kind: "text", required: true },
      { key: "makeModel", label: "Make and model", kind: "text" },
      { key: "mileage", label: "Current mileage", kind: "number" },
      { key: "motExpiry", label: "MOT expiry", kind: "date" },
      { key: "taxExpiry", label: "Tax expiry", kind: "date" },
    ],
    capabilities: [common.documents, common.history, common.reminders, "Track mileage-triggered maintenance", "Hold legal compliance", "Manage faults and repairs"],
    lifecycle: ["prospective", "active", "off road", "under repair", "for sale", "disposed", "archived"],
    relationships: ["owned by", "driven by", "insured by", "serviced by", "uses consumable"],
    generates: ["MOT workflow", "service booking", "tax renewal", "fault response"],
    completionWritesBack: ["appointment date", "service mileage", "new expiry", "certificate", "cost"],
  },
  {
    type: "appliance",
    label: "Appliance",
    family: "Assets & equipment",
    description: "A household machine with model-specific maintenance, supplies, warranty and fault handling.",
    fields: [
      { key: "name", label: "Name", kind: "text", required: true },
      { key: "manufacturer", label: "Manufacturer", kind: "text" },
      { key: "model", label: "Model", kind: "text" },
      { key: "serial", label: "Serial number", kind: "text" },
      { key: "installed", label: "Installed or purchased", kind: "date" },
    ],
    capabilities: [common.documents, common.history, "Consume compatible supplies", "Run maintenance", "Open fault, repair and replacement workflows", "Surface warranty in emergencies"],
    lifecycle: ["prospective", "active", "faulty", "under repair", "retired", "disposed", "archived"],
    relationships: ["located in", "uses consumable", "covered by warranty", "repaired by", "purchased from"],
    generates: ["maintenance checks", "supply purchases", "repair workflows", "replacement decisions"],
  },
  {
    type: "safetyEquipment",
    label: "Safety equipment",
    family: "Assets & equipment",
    description: "Safety-critical equipment whose readiness must be checked and evidenced.",
    fields: [
      { key: "name", label: "Equipment", kind: "text", required: true },
      { key: "location", label: "Location", kind: "place" },
      { key: "expiry", label: "Expiry or replace-by", kind: "date" },
      { key: "testCadence", label: "Test cadence", kind: "text" },
    ],
    capabilities: [common.history, common.reminders, "Require evidenced inspection", "Use critical escalation"],
    lifecycle: ["ready", "test due", "failed", "expired", "replaced", "archived"],
    relationships: ["located at", "protects property", "uses battery"],
    generates: ["test check", "replace battery", "replace equipment"],
  },
  {
    type: "consumable",
    label: "Consumable supply",
    family: "Stock & supplies",
    description: "A replenishable item whose compatibility, stock and purchase history matter.",
    fields: [
      { key: "name", label: "Supply", kind: "text", required: true },
      { key: "quantity", label: "Quantity on hand", kind: "number" },
      { key: "minimum", label: "Restock threshold", kind: "number" },
      { key: "unit", label: "Unit", kind: "text" },
      { key: "preferredRetailer", label: "Preferred retailer", kind: "relationship" },
      { key: "usualPrice", label: "Usual price", kind: "money" },
    ],
    capabilities: [common.history, "Track quantity and consumption", "Suggest acceptable substitutes", "Add itself to shopping"],
    lifecycle: ["in stock", "low", "out of stock", "ordered", "discontinued", "archived"],
    relationships: ["compatible with asset", "stored at", "bought from", "substituted by product"],
    generates: ["stock check", "shopping-list item", "purchase action"],
    completionWritesBack: ["quantity", "price", "retailer", "purchase date"],
  },
  {
    type: "foodStock",
    label: "Food stock",
    family: "Stock & supplies",
    description: "Food held by the household with quantity, storage, expiry and recipe demand.",
    fields: [
      { key: "name", label: "Food", kind: "text", required: true },
      { key: "quantity", label: "Quantity", kind: "number" },
      { key: "expiry", label: "Use by / best before", kind: "date" },
      { key: "opened", label: "Opened date", kind: "date" },
      { key: "storage", label: "Storage", kind: "place" },
    ],
    capabilities: ["Suppress unnecessary shopping", "Feed recipe availability", "Track leftovers and waste"],
    lifecycle: ["available", "low", "reserved", "opened", "expired", "used", "discarded"],
    relationships: ["ingredient in recipe", "stored at", "purchased in transaction", "reserved for meal"],
    generates: ["use-soon suggestion", "shopping item", "waste record"],
  },
  {
    type: "medicationStock",
    label: "Medication stock",
    family: "Stock & supplies",
    description: "Safety-sensitive medication inventory with refill and expiry behaviour.",
    fields: [
      { key: "medicine", label: "Medicine", kind: "relationship", required: true },
      { key: "quantity", label: "Quantity remaining", kind: "number" },
      { key: "minimumSafe", label: "Minimum safe stock", kind: "number" },
      { key: "expiry", label: "Expiry", kind: "date" },
    ],
    capabilities: [common.access, common.reminders, "Calculate refill window", "Prevent silent stockout"],
    lifecycle: ["sufficient", "refill soon", "critical", "ordered", "expired", "disposed"],
    relationships: ["stock of medication", "for person", "dispensed by pharmacy"],
    generates: ["repeat prescription", "collection errand", "critical stock alert"],
  },
  {
    type: "container",
    label: "Bag, case or container",
    family: "Containers & lists",
    description: "A real container with a standard expected state that can be packed and checked repeatedly.",
    fields: [
      { key: "name", label: "Name", kind: "text", required: true },
      { key: "purpose", label: "Purpose", kind: "text" },
      { key: "owner", label: "For", kind: "person" },
      { key: "location", label: "Usually kept", kind: "place" },
    ],
    capabilities: [common.history, "Use a persistent contents template", "Create disposable packing/check occurrences", "Resolve conditional requirements"],
    lifecycle: ["ready", "needs checking", "in use", "incomplete", "lost", "retired"],
    relationships: ["belongs to person", "used for activity", "contains item", "uses packing template"],
    generates: ["packing occurrence", "missing-item action", "restock action"],
  },
  {
    type: "listTemplate",
    label: "Reusable list template",
    family: "Containers & lists",
    description: "A persistent definition of what good looks like, without being completed itself.",
    fields: [
      { key: "name", label: "Template name", kind: "text", required: true },
      { key: "items", label: "Requirements", kind: "list", required: true },
      { key: "conditions", label: "Conditional rules", kind: "list" },
    ],
    capabilities: ["Version requirements", "Instantiate occurrences", "Apply per-person quantities", "Accept improvements from completed occurrences"],
    lifecycle: ["draft", "active", "superseded", "archived"],
    relationships: ["used by container", "used by routine", "used by trip"],
    generates: ["checklist occurrence", "packing occurrence"],
  },
  {
    type: "checkOccurrence",
    label: "Check occurrence",
    family: "Work & execution",
    description: "One dated inspection against an expected state, with structured outcomes.",
    fields: [
      { key: "scheduledFor", label: "Scheduled for", kind: "date", required: true },
      { key: "items", label: "Resolved checks", kind: "list" },
      { key: "completedBy", label: "Checked by", kind: "person" },
      { key: "outcome", label: "Outcome", kind: "select", options: ["Ready", "Issues resolved", "Incomplete", "Skipped"] },
    ],
    capabilities: [common.history, common.reminders, "Record each item without modifying template", "Generate remediation from failures"],
    lifecycle: ["scheduled", "due", "in progress", "blocked", "complete", "missed", "skipped"],
    relationships: ["instance of template", "checks container", "performed by person", "creates action"],
    generates: ["missing-item action", "exception", "history outcome"],
    completionWritesBack: ["last checked", "readiness", "missing item history"],
  },
  {
    type: "task",
    label: "Action",
    family: "Work & execution",
    description: "A concrete change that someone must make, carrying all context required to do it.",
    fields: [
      { key: "title", label: "Action", kind: "text", required: true },
      { key: "assignee", label: "Assignee", kind: "person" },
      { key: "actionWindow", label: "Can start", kind: "date" },
      { key: "deadline", label: "Must be done by", kind: "date" },
      { key: "completion", label: "Completion requirements", kind: "list" },
    ],
    capabilities: [common.history, common.reminders, "Carry source context", "Snooze, defer, block, reassign and reopen", "Capture structured outcome"],
    lifecycle: ["not ready", "available", "due", "in progress", "waiting", "blocked", "complete", "cancelled", "overdue"],
    relationships: ["belongs to area", "generated by rule", "concerns entity", "assigned to person", "blocked by work"],
    generates: ["follow-up task", "outcome", "notification"],
    completionWritesBack: ["source state", "dates", "stock", "documents", "next workflow stage"],
  },
  {
    type: "decision",
    label: "Decision",
    family: "Work & execution",
    description: "A choice that must be resolved and remembered with its reasoning.",
    fields: [
      { key: "question", label: "Decision", kind: "text", required: true },
      { key: "options", label: "Options", kind: "list" },
      { key: "criteria", label: "Criteria", kind: "list" },
      { key: "deadline", label: "Decide by", kind: "date" },
    ],
    capabilities: [common.history, common.reminders, "Compare options", "Record contributors and rationale", "Launch downstream work"],
    lifecycle: ["open", "researching", "ready", "decided", "reconsidering", "closed"],
    relationships: ["concerns project", "uses quote", "made by person", "creates purchase"],
    generates: ["research task", "approval", "purchase or project"],
  },
  {
    type: "routine",
    label: "Routine",
    family: "Schedules & workflows",
    description: "A persistent rule that creates time-specific occurrences and resolves variants and exceptions.",
    fields: [
      { key: "name", label: "Routine", kind: "text", required: true },
      { key: "cadence", label: "Cadence", kind: "text", required: true },
      { key: "activeWindow", label: "Active period", kind: "text" },
      { key: "exceptions", label: "Exceptions", kind: "list" },
      { key: "steps", label: "Relative steps", kind: "list" },
    ],
    capabilities: ["Generate occurrences", "Skip closure dates", "Rotate variants", "Offset steps before/after event", "Apply reminder policies"],
    lifecycle: ["draft", "active", "paused", "seasonal", "retired", "archived"],
    relationships: ["belongs to area", "uses template", "affected by closure", "owned by person"],
    generates: ["task", "check occurrence", "event", "follow-up"],
  },
  {
    type: "workflow",
    label: "Workflow",
    family: "Schedules & workflows",
    description: "A state-driven sequence with stages, branching, prerequisites and write-back.",
    fields: [
      { key: "name", label: "Workflow", kind: "text", required: true },
      { key: "stages", label: "Stages", kind: "list", required: true },
      { key: "deadline", label: "Overall deadline", kind: "date" },
    ],
    capabilities: [common.history, common.reminders, "Branch on outcomes", "Wait for external response", "Require evidence", "Start next stage automatically"],
    lifecycle: ["not started", "active", "waiting", "blocked", "complete", "abandoned", "reopened"],
    relationships: ["concerns entity", "contains work", "uses document", "fulfilled by appointment"],
    generates: ["tasks", "approvals", "appointments", "documents"],
  },
  {
    type: "rotation",
    label: "Rotation",
    family: "Schedules & workflows",
    description: "An ordered repeating sequence such as alternating bins or rotating responsibilities.",
    fields: [
      { key: "variants", label: "Variants in order", kind: "list", required: true },
      { key: "current", label: "Current position", kind: "number" },
      { key: "cadence", label: "Advance every", kind: "text" },
    ],
    capabilities: ["Advance, skip or substitute variants", "Generate variant-specific steps", "Recover after exceptions"],
    lifecycle: ["active", "paused", "out of sequence", "retired"],
    relationships: ["drives routine", "affected by calendar exception"],
    generates: ["resolved occurrence variant"],
  },
  {
    type: "event",
    label: "Event",
    family: "Dates & commitments",
    description: "Something happening at a defined time that may require preparation and follow-up.",
    fields: [
      { key: "title", label: "Event", kind: "text", required: true },
      { key: "starts", label: "Starts", kind: "date", required: true },
      { key: "place", label: "Place", kind: "place" },
      { key: "attendees", label: "People", kind: "list" },
    ],
    capabilities: [common.reminders, "Generate preparation", "Link packing, tickets and travel", "Create follow-up"],
    lifecycle: ["proposed", "confirmed", "changed", "cancelled", "completed", "missed"],
    relationships: ["attended by", "held at", "requires booking", "uses packing occurrence"],
    generates: ["preparation workflow", "travel action", "follow-up"],
  },
  {
    type: "appointment",
    label: "Appointment",
    family: "Dates & commitments",
    description: "A booked service interaction with preparation, attendance and outcome.",
    fields: [
      { key: "purpose", label: "Purpose", kind: "text", required: true },
      { key: "dateTime", label: "Date and time", kind: "date", required: true },
      { key: "provider", label: "Provider", kind: "relationship" },
      { key: "reference", label: "Booking reference", kind: "text" },
      { key: "preparation", label: "Preparation", kind: "list" },
    ],
    capabilities: [common.documents, common.reminders, "Support reschedule and cancellation", "Capture service outcome", "Generate follow-up"],
    lifecycle: ["requested", "booked", "confirmed", "attended", "cancelled", "missed", "rescheduled"],
    relationships: ["for person or asset", "provided by", "fulfils requirement", "produces certificate"],
    generates: ["preparation", "travel", "follow-up", "outcome"],
    completionWritesBack: ["result", "next review", "cost", "certificate", "new due date"],
  },
  {
    type: "deadline",
    label: "Deadline",
    family: "Dates & commitments",
    description: "A hard boundary with an action window, urgency curve and consequence.",
    fields: [
      { key: "due", label: "Hard deadline", kind: "date", required: true },
      { key: "opens", label: "Action window opens", kind: "date" },
      { key: "preferred", label: "Preferred completion", kind: "date" },
      { key: "consequence", label: "If missed", kind: "longText" },
    ],
    capabilities: [common.reminders, "Change urgency over time", "Escalate and remain visible", "Trigger consequence workflow"],
    lifecycle: ["future", "open", "needs attention", "urgent", "met", "missed", "waived"],
    relationships: ["governs task", "derived from document", "satisfied by outcome"],
    generates: ["task availability", "escalation", "overdue response"],
  },
  {
    type: "document",
    label: "Document",
    family: "Documents & evidence",
    description: "A classified piece of evidence with validity, subject and access rules.",
    fields: [
      { key: "title", label: "Document", kind: "text", required: true },
      { key: "file", label: "File", kind: "document" },
      { key: "issued", label: "Issue date", kind: "date" },
      { key: "expires", label: "Expiry", kind: "date" },
      { key: "number", label: "Reference number", kind: "text" },
    ],
    capabilities: [common.access, common.history, "Establish validity", "Supply evidence to claims, renewals and appointments", "Surface in emergency view"],
    lifecycle: ["draft", "valid", "expiring", "expired", "superseded", "revoked", "archived"],
    relationships: ["belongs to entity", "issued by organisation", "evidences outcome", "required by workflow"],
    generates: ["renewal", "review", "response action"],
  },
  {
    type: "insurancePolicy",
    label: "Insurance policy",
    family: "Agreements & cover",
    description: "A contract that covers defined subjects and provides a claim route.",
    fields: [
      { key: "provider", label: "Provider", kind: "relationship", required: true },
      { key: "policyNumber", label: "Policy number", kind: "text" },
      { key: "premium", label: "Premium", kind: "money" },
      { key: "renewal", label: "Renewal date", kind: "date" },
      { key: "coverage", label: "Coverage", kind: "longText" },
      { key: "excess", label: "Excess", kind: "money" },
    ],
    capabilities: [common.documents, common.reminders, "Cover multiple subjects", "Open claim workflow", "Compare renewal options", "Surface emergency contact"],
    lifecycle: ["quote", "active", "renewal open", "lapsed", "cancelled", "superseded", "archived"],
    relationships: ["covers person, property or asset", "provided by", "paid through account", "receives claim"],
    generates: ["renewal workflow", "payment", "claim"],
  },
  {
    type: "warranty",
    label: "Warranty",
    family: "Agreements & cover",
    description: "Time-limited cover for an asset with evidence and a repair or replacement route.",
    fields: [
      { key: "provider", label: "Provider", kind: "relationship" },
      { key: "starts", label: "Starts", kind: "date" },
      { key: "ends", label: "Ends", kind: "date" },
      { key: "terms", label: "Coverage and exclusions", kind: "longText" },
    ],
    capabilities: [common.documents, "Validate active cover", "Open claim from fault", "Gather receipt and serial evidence"],
    lifecycle: ["active", "expiring", "expired", "claim open", "fulfilled", "void"],
    relationships: ["covers asset", "provided by retailer or manufacturer", "uses receipt", "receives fault"],
    generates: ["expiry notice", "warranty claim", "repair or replacement"],
  },
  {
    type: "subscription",
    label: "Subscription",
    family: "Agreements & cover",
    description: "A recurring paid service with usage, renewal and cancellation behaviour.",
    fields: [
      { key: "service", label: "Service", kind: "relationship", required: true },
      { key: "price", label: "Price", kind: "money" },
      { key: "cadence", label: "Billing cadence", kind: "text" },
      { key: "renewal", label: "Next billing or renewal", kind: "date" },
      { key: "notice", label: "Cancellation notice", kind: "text" },
    ],
    capabilities: [common.reminders, "Track price changes and usage", "Open cancellation or review window", "Generate payment"],
    lifecycle: ["trial", "active", "paused", "review due", "cancelling", "cancelled", "expired"],
    relationships: ["provided by", "used by person", "paid through account"],
    generates: ["payment", "review decision", "cancellation workflow"],
  },
  {
    type: "invoice",
    label: "Invoice",
    family: "Money & obligations",
    description: "A payable request with review, approval, payment and evidence.",
    fields: [
      { key: "issuer", label: "Issuer", kind: "relationship", required: true },
      { key: "amount", label: "Amount", kind: "money", required: true },
      { key: "due", label: "Due date", kind: "date" },
      { key: "lines", label: "Charges", kind: "list" },
      { key: "file", label: "Original invoice", kind: "document" },
    ],
    capabilities: [common.documents, common.reminders, "Require review or approval", "Allocate payment", "Dispute and correct"],
    lifecycle: ["received", "reviewing", "approved", "due", "paid", "disputed", "void", "overdue"],
    relationships: ["issued by organisation", "concerns service", "paid by payment", "approved by person"],
    generates: ["review", "approval", "payment", "dispute workflow"],
    completionWritesBack: ["payment date", "amount paid", "confirmation", "account balance"],
  },
  {
    type: "purchase",
    label: "Purchase",
    family: "Shopping & acquisition",
    description: "An acquisition that updates stock or ownership and creates evidence and return rights.",
    fields: [
      { key: "retailer", label: "Retailer", kind: "relationship" },
      { key: "date", label: "Purchased", kind: "date" },
      { key: "items", label: "Items", kind: "list" },
      { key: "total", label: "Total", kind: "money" },
      { key: "receipt", label: "Receipt", kind: "document" },
    ],
    capabilities: [common.history, "Increase stock or create asset", "Create warranty evidence", "Open return/refund window"],
    lifecycle: ["planned", "ordered", "paid", "delivered", "part returned", "returned", "refunded", "complete"],
    relationships: ["bought from", "contains product", "paid by payment", "creates asset or stock"],
    generates: ["delivery", "stock update", "warranty", "return deadline"],
  },
  {
    type: "recipe",
    label: "Recipe",
    family: "Food & meals",
    description: "A scalable preparation definition connected to stock, preferences and meal planning.",
    fields: [
      { key: "name", label: "Recipe", kind: "text", required: true },
      { key: "servings", label: "Serves", kind: "number" },
      { key: "ingredients", label: "Ingredients", kind: "list", required: true },
      { key: "method", label: "Method", kind: "list" },
      { key: "adaptations", label: "Person-specific adaptations", kind: "list" },
    ],
    capabilities: ["Scale ingredient demand", "Compare with stock", "Generate shopping suggestions", "Create leftovers", "Respect preferences"],
    lifecycle: ["draft", "active", "favourite", "needs improvement", "retired", "archived"],
    relationships: ["uses ingredient", "liked by person", "planned by meal entry", "requires equipment"],
    generates: ["ingredient demand", "shopping items", "cooking checklist", "leftover batch"],
  },
  {
    type: "mealPlanEntry",
    label: "Meal plan entry",
    family: "Food & meals",
    description: "A dated meal commitment resolving people, portions, stock and leftovers.",
    fields: [
      { key: "date", label: "Date", kind: "date", required: true },
      { key: "slot", label: "Meal", kind: "select", options: ["Breakfast", "Lunch", "Dinner", "Snack"] },
      { key: "meal", label: "Meal or recipe", kind: "relationship" },
      { key: "people", label: "Eating", kind: "list" },
    ],
    capabilities: ["Calculate portions", "Reserve stock", "Generate shopping demand", "Substitute meal", "Use leftovers"],
    lifecycle: ["planned", "ingredients missing", "ready", "cooked", "substituted", "skipped"],
    relationships: ["uses recipe", "feeds person", "uses leftover", "creates ingredient demand"],
    generates: ["shopping suggestions", "prep action", "leftover batch"],
  },
  {
    type: "condition",
    label: "Health condition",
    family: "Health & care",
    description: "A health condition with care, warning signs, treatment and emergency significance.",
    fields: [
      { key: "subject", label: "Person or pet", kind: "relationship", required: true },
      { key: "name", label: "Condition", kind: "text", required: true },
      { key: "status", label: "Status", kind: "select", options: ["Suspected", "Active", "Managed", "Resolved"] },
      { key: "warningSigns", label: "Warning signs", kind: "list" },
      { key: "care", label: "Care instructions", kind: "longText" },
    ],
    capabilities: [common.access, common.documents, common.history, "Surface emergency plan", "Link observations, medication and appointments"],
    lifecycle: ["suspected", "diagnosed", "active", "managed", "resolved", "historical"],
    relationships: ["affects person", "managed by clinician", "treated by medication", "observed by measurement"],
    generates: ["care checks", "appointment", "medication", "escalation"],
  },
  {
    type: "medication",
    label: "Medication",
    family: "Health & care",
    description: "A prescribed or managed medicine with schedule, administration and refill logic.",
    fields: [
      { key: "name", label: "Medication", kind: "text", required: true },
      { key: "subject", label: "For", kind: "person", required: true },
      { key: "dose", label: "Dose", kind: "text" },
      { key: "schedule", label: "Schedule", kind: "text" },
      { key: "instructions", label: "Instructions", kind: "longText" },
    ],
    capabilities: [common.access, common.history, common.reminders, "Generate administrations", "Handle missed doses", "Connect to stock/refill"],
    lifecycle: ["planned", "active", "paused", "course complete", "discontinued", "historical"],
    relationships: ["for person", "treats condition", "prescribed by", "has stock"],
    generates: ["administration occurrence", "refill workflow", "review appointment"],
  },
  {
    type: "childcarePlacement",
    label: "Nursery or childcare placement",
    family: "Childcare & education",
    description: "A child-specific placement combining attendance, departures, closures, invoices and permissions.",
    fields: [
      { key: "organisation", label: "Provider", kind: "relationship", required: true },
      { key: "child", label: "Child", kind: "person", required: true },
      { key: "sessions", label: "Regular sessions", kind: "list" },
      { key: "collection", label: "Collection permissions", kind: "list" },
    ],
    capabilities: [common.documents, "Drive departure routines", "Suppress on closure dates", "Receive invoices, notices and incidents", "Resolve child-specific requirements"],
    lifecycle: ["applying", "offered", "active", "temporarily absent", "notice given", "ended", "archived"],
    relationships: ["placement at organisation", "for child", "billed by invoice", "uses container", "authorises collector"],
    generates: ["attendance occurrences", "bag checks", "invoice workflow", "alternative childcare task"],
  },
  {
    type: "trip",
    label: "Trip or holiday",
    family: "Travel & occasions",
    description: "A temporary journey combining travellers, bookings, documents, packing, budget and itinerary.",
    fields: [
      { key: "name", label: "Trip", kind: "text", required: true },
      { key: "starts", label: "Starts", kind: "date" },
      { key: "ends", label: "Ends", kind: "date" },
      { key: "travellers", label: "Travellers", kind: "list" },
      { key: "destination", label: "Destination", kind: "place" },
    ],
    capabilities: [common.documents, common.reminders, "Create per-person packing", "Validate travel documents", "Track bookings, itinerary and budget"],
    lifecycle: ["idea", "planning", "booked", "preparing", "travelling", "complete", "cancelled", "archived"],
    relationships: ["includes traveller", "contains booking", "uses packing template", "covered by insurance"],
    generates: ["booking workflow", "packing occurrences", "document renewal", "travel actions"],
  },
  {
    type: "organisation",
    label: "Organisation or provider",
    family: "Services & providers",
    description: "A provider with locations, contacts, accounts, services and communication history.",
    fields: [
      { key: "name", label: "Name", kind: "text", required: true },
      { key: "category", label: "Type", kind: "text" },
      { key: "contacts", label: "Contact routes", kind: "list" },
      { key: "hours", label: "Opening hours", kind: "list" },
    ],
    capabilities: [common.history, "Provide services and appointments", "Issue invoices and documents", "Hold escalation routes"],
    lifecycle: ["preferred", "active", "do not use", "closed", "archived"],
    relationships: ["provides service", "employs contact", "issues invoice", "receives payment"],
    generates: ["contact action", "appointment", "invoice", "support case"],
  },
  {
    type: "fault",
    label: "Fault or problem",
    family: "Problems & emergencies",
    description: "A problem affecting an asset, service or place with triage, evidence and resolution.",
    fields: [
      { key: "subject", label: "Affected thing", kind: "relationship", required: true },
      { key: "symptoms", label: "What is happening", kind: "longText", required: true },
      { key: "severity", label: "Severity", kind: "select", options: ["Minor", "Disruptive", "Urgent", "Emergency"] },
      { key: "evidence", label: "Photos or evidence", kind: "document" },
    ],
    capabilities: [common.history, "Triage against instructions", "Find cover and emergency contacts", "Open repair or claim", "Track recurrence"],
    lifecycle: ["reported", "triaging", "workaround", "awaiting repair", "resolved", "recurring", "closed"],
    relationships: ["affects entity", "covered by warranty or policy", "resolved by repair", "reported to provider"],
    generates: ["immediate safety action", "troubleshooting check", "support contact", "repair workflow", "claim"],
  },
  {
    type: "project",
    label: "Project",
    family: "Projects & change",
    description: "A temporary outcome involving stages, decisions, costs, work and completion criteria.",
    fields: [
      { key: "name", label: "Project", kind: "text", required: true },
      { key: "outcome", label: "Desired outcome", kind: "longText" },
      { key: "deadline", label: "Target date", kind: "date" },
      { key: "budget", label: "Budget", kind: "money" },
    ],
    capabilities: [common.documents, common.history, common.reminders, "Contain stages, decisions, tasks and purchases", "Archive as household history"],
    lifecycle: ["idea", "planning", "active", "paused", "complete", "abandoned", "archived"],
    relationships: ["changes area", "contains work", "uses budget", "requires decision"],
    generates: ["plan", "task", "decision", "purchase", "completion record"],
  },
  {
    type: "automationRule",
    label: "Rule",
    family: "Automation & history",
    description: "An explicit household rule connecting a trigger and conditions to operational consequences.",
    fields: [
      { key: "trigger", label: "When", kind: "text", required: true },
      { key: "conditions", label: "Only if", kind: "list" },
      { key: "actions", label: "Then", kind: "list", required: true },
      { key: "escalation", label: "Reminder policy", kind: "relationship" },
    ],
    capabilities: ["Evaluate date, threshold, state and completion triggers", "Create work or occurrences", "Update status", "Notify or escalate", "Remain understandable to users"],
    lifecycle: ["draft", "active", "paused", "invalid", "retired", "archived"],
    relationships: ["watches entity", "creates work", "uses reminder policy", "depends on calendar"],
    generates: ["task", "check occurrence", "notification", "state change", "workflow"],
  },
];

export const capabilities = [
  "documents",
  "history",
  "access control",
  "stock tracking",
  "compatibility",
  "recurrence",
  "rotation",
  "deadline escalation",
  "checklist instantiation",
  "workflow branching",
  "structured completion",
  "appointments",
  "payments",
  "renewal",
  "maintenance",
  "fault handling",
  "emergency projection",
  "location",
  "packing",
  "preferences",
  "per-person requirements",
  "calendar exceptions",
  "shopping generation",
  "claim handling",
  "audit evidence",
];

export type Area = {
  id: string;
  name: string;
  parentId?: string;
  summary: string;
  attention: number;
  accent: string;
  entityIds: string[];
};

export type HouseholdEntity = {
  id: string;
  type: string;
  areaId: string;
  name: string;
  subtitle: string;
  status: string;
  facts: { label: string; value: string }[];
  links: { relation: string; target: string }[];
  tags: string[];
};

export type WorkItem = {
  id: string;
  title: string;
  areaId: string;
  entityId: string;
  kind: "check" | "buy" | "book" | "admin" | "follow-up";
  when: string;
  urgency: "now" | "today" | "soon";
  context: string;
  done?: boolean;
};

export const areas: Area[] = [
  { id: "nursery", name: "Nursery", summary: "Attendance, bags, closures, invoices and pickup knowledge", attention: 1, accent: "sage", entityIds: ["placement", "nursery-bag", "bag-routine"] },
  { id: "car", name: "Car", summary: "Legal dates, servicing, faults, documents and journeys", attention: 1, accent: "clay", entityIds: ["family-car", "mot-workflow"] },
  { id: "home", name: "Home", summary: "Rooms, appliances, supplies, safety and emergency information", attention: 2, accent: "stone", entityIds: ["printer", "printer-ink", "fridge-warranty"] },
  { id: "bins", name: "Bins", summary: "Collection knowledge, alternating rounds and preparation", attention: 1, accent: "blue", entityIds: ["bin-rotation", "bin-routine"] },
  { id: "food", name: "Food", summary: "Meal plans, recipes, stock, regulars and shopping", attention: 0, accent: "butter", entityIds: ["bolognese", "weekly-meals"] },
  { id: "holidays", name: "Holidays", summary: "Trips, bookings, documents, packing and budgets", attention: 0, accent: "lilac", entityIds: ["family-packing"] },
];

export const entities: HouseholdEntity[] = [
  {
    id: "placement", type: "childcarePlacement", areaId: "nursery", name: "Spencer’s nursery", subtitle: "Weekdays · 08:00–12:45", status: "Active",
    facts: [{ label: "Provider", value: "Little Oaks Nursery" }, { label: "Closed next", value: "Friday 14 August" }, { label: "Collection", value: "Connor, Victoria and Grandma approved" }],
    links: [{ relation: "uses", target: "Nursery bag" }, { relation: "drives", target: "Weekday departure check" }, { relation: "issues", target: "Monthly invoice" }], tags: ["childcare", "Spencer"]
  },
  {
    id: "nursery-bag", type: "container", areaId: "nursery", name: "Nursery bag", subtitle: "Persistent packing state", status: "Check due",
    facts: [{ label: "Usually kept", value: "Hall cupboard" }, { label: "Standard contents", value: "6 required · 2 conditional" }, { label: "Last checked", value: "Yesterday, 07:18 by Connor" }],
    links: [{ relation: "for", target: "Spencer" }, { relation: "uses", target: "Nursery bag contents" }, { relation: "checked by", target: "Weekday departure routine" }], tags: ["packing", "check"]
  },
  {
    id: "bag-routine", type: "routine", areaId: "nursery", name: "Weekday departure check", subtitle: "Mon–Fri at 07:15 · skips closures", status: "Active",
    facts: [{ label: "Cadence", value: "Every nursery weekday" }, { label: "Reminder", value: "07:15, repeat at 07:35 if unsigned" }, { label: "Conditions", value: "Swimming kit Wednesdays · replace clothes after accident" }],
    links: [{ relation: "checks", target: "Nursery bag" }, { relation: "suppressed by", target: "Nursery closures" }], tags: ["routine", "departure"]
  },
  {
    id: "family-car", type: "vehicle", areaId: "car", name: "Family car", subtitle: "Ford Kuga · AB12 CDE", status: "MOT action window",
    facts: [{ label: "MOT expires", value: "28 August" }, { label: "Preferred completion", value: "14 August" }, { label: "Mileage", value: "46,280 miles" }, { label: "Garage", value: "Central Autos" }],
    links: [{ relation: "covered by", target: "Admiral car insurance" }, { relation: "serviced by", target: "Central Autos" }, { relation: "requires", target: "MOT workflow" }], tags: ["vehicle", "renewal"]
  },
  {
    id: "mot-workflow", type: "workflow", areaId: "car", name: "MOT renewal", subtitle: "Book → attend → retain certificate", status: "Book now",
    facts: [{ label: "Action window", value: "17 July–28 August" }, { label: "Escalation", value: "Every 3 days · daily in final week" }, { label: "Completion", value: "Appointment captured, then new expiry and certificate" }],
    links: [{ relation: "concerns", target: "Family car" }, { relation: "fulfilled by", target: "MOT appointment" }], tags: ["workflow", "deadline"]
  },
  {
    id: "printer", type: "appliance", areaId: "home", name: "Printer", subtitle: "HP OfficeJet 8015", status: "Needs colour ink",
    facts: [{ label: "Location", value: "Study" }, { label: "Serial", value: "TH94K2…" }, { label: "Purchased", value: "John Lewis · March 2024" }],
    links: [{ relation: "uses", target: "HP 305XL cartridges" }, { relation: "covered by", target: "John Lewis warranty" }], tags: ["appliance", "emergency"]
  },
  {
    id: "printer-ink", type: "consumable", areaId: "home", name: "Printer ink", subtitle: "HP 305XL Black & Colour", status: "Colour out of stock",
    facts: [{ label: "Black", value: "1 cartridge" }, { label: "Colour", value: "0 cartridges" }, { label: "Usually bought", value: "Amazon · around £31.99" }, { label: "Stored", value: "Study cupboard" }],
    links: [{ relation: "compatible with", target: "Printer" }, { relation: "bought from", target: "Amazon" }], tags: ["supply", "purchasing"]
  },
  {
    id: "fridge-warranty", type: "warranty", areaId: "home", name: "Fridge freezer warranty", subtitle: "Samsung · valid until May 2028", status: "Active",
    facts: [{ label: "Provider", value: "Samsung" }, { label: "Evidence", value: "Receipt and serial stored" }, { label: "Support", value: "0333 000 0333" }],
    links: [{ relation: "covers", target: "Kitchen fridge freezer" }, { relation: "uses", target: "Currys receipt" }], tags: ["warranty", "emergency", "appliance"]
  },
  {
    id: "bin-rotation", type: "rotation", areaId: "bins", name: "Alternating collection", subtitle: "Black ↔ Green every Wednesday", status: "Green next",
    facts: [{ label: "Next", value: "Green bin · Wednesday" }, { label: "Following", value: "Black bin · next Wednesday" }, { label: "Exception handling", value: "Council notices can move collection date without breaking rotation" }],
    links: [{ relation: "drives", target: "Bin day routine" }], tags: ["rotation", "council"]
  },
  {
    id: "bin-routine", type: "routine", areaId: "bins", name: "Bin day", subtitle: "Preparation, collection and return", status: "Prep tonight",
    facts: [{ label: "Tuesday evening", value: "Gather relevant waste and put bin at kerb" }, { label: "Wednesday evening", value: "Bring bin back in" }, { label: "Reminder", value: "Persistent until each stage is signed off" }],
    links: [{ relation: "uses", target: "Alternating collection" }, { relation: "affected by", target: "Bank holiday changes" }], tags: ["routine", "check"]
  },
  {
    id: "bolognese", type: "recipe", areaId: "food", name: "Spaghetti bolognese", subtitle: "Serves 4 · family adaptation saved", status: "Ready",
    facts: [{ label: "Spencer", value: "No visible onion" }, { label: "Typical leftovers", value: "1 lunch portion" }, { label: "Missing this week", value: "Beef mince and passata" }],
    links: [{ relation: "planned by", target: "Weekly meal plan" }, { relation: "generates", target: "Food shopping list" }], tags: ["recipe", "family meal"]
  },
  {
    id: "weekly-meals", type: "mealPlanEntry", areaId: "food", name: "This week’s meals", subtitle: "5 dinners planned", status: "Ingredients suggested",
    facts: [{ label: "Monday", value: "Spaghetti bolognese" }, { label: "Tuesday", value: "Jacket potatoes" }, { label: "Wednesday", value: "Chicken curry" }],
    links: [{ relation: "uses", target: "Recipes" }, { relation: "creates demand in", target: "Food shopping list" }], tags: ["meal plan", "shopping"]
  },
  {
    id: "family-packing", type: "listTemplate", areaId: "holidays", name: "Family holiday packing", subtitle: "Reusable master template", status: "Ready",
    facts: [{ label: "People", value: "Connor, Victoria, Spencer and Rory" }, { label: "Structure", value: "Per-person bags + shared items" }, { label: "Conditions", value: "Destination, weather, duration and activities" }],
    links: [{ relation: "instantiates for", target: "Each trip" }, { relation: "checks", target: "Travel document validity" }], tags: ["packing", "template"]
  },
];

export const workItems: WorkItem[] = [
  { id: "w1", title: "Check Spencer’s nursery bag", areaId: "nursery", entityId: "nursery-bag", kind: "check", when: "Before leaving · 07:15", urgency: "now", context: "6 standard items and today’s conditional requirements" },
  { id: "w2", title: "Put the green bin out", areaId: "bins", entityId: "bin-routine", kind: "check", when: "Tonight", urgency: "today", context: "Gather garden waste and relevant indoor bins first" },
  { id: "w3", title: "Book the family car’s MOT", areaId: "car", entityId: "mot-workflow", kind: "book", when: "Before 28 August", urgency: "today", context: "Central Autos used last year · action window is open" },
  { id: "w4", title: "Order HP 305XL colour ink", areaId: "home", entityId: "printer-ink", kind: "buy", when: "Stock is zero", urgency: "today", context: "Usually Amazon · last paid £31.99 for black + colour" },
  { id: "w5", title: "Bring the green bin back in", areaId: "bins", entityId: "bin-routine", kind: "follow-up", when: "Wednesday evening", urgency: "soon", context: "Created after this collection occurrence" },
];

export const nurseryBagItems = [
  { id: "water", label: "Water bottle", detail: "Refilled", required: true },
  { id: "comforter", label: "Comforter", detail: "In front pocket", required: true },
  { id: "trousers", label: "Spare trousers", detail: "Replace after yesterday’s water play", required: true },
  { id: "underwear", label: "Spare underwear", detail: "2 pairs", required: true },
  { id: "socks", label: "Spare socks", detail: "1 pair", required: true },
  { id: "coat", label: "Raincoat", detail: "Conditional · rain expected", required: true },
];

export function getEntityDefinition(type: string) {
  return entityRegistry.find((entity) => entity.type === type);
}

export function getArea(id: string) {
  return areas.find((area) => area.id === id);
}

export function getEntity(id: string) {
  return entities.find((entity) => entity.id === id);
}
