import type { Id } from "@/convex/_generated/dataModel";

export type PersonRelationship =
  | "self"
  | "partner"
  | "child"
  | "parent"
  | "sibling"
  | "family"
  | "friend"
  | "professional"
  | "other";

export type ResponsibilityDomain =
  | "home"
  | "family"
  | "finance"
  | "food"
  | "health"
  | "transport"
  | "education"
  | "admin"
  | "pets"
  | "work"
  | "other";

export type ResponsibilityHealth = "on_track" | "attention" | "blocked";
export type ReviewCadence = "none" | "weekly" | "monthly" | "quarterly" | "yearly";
export type DomainTaskStatus = "open" | "in_progress" | "waiting" | "done";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type RoutineFrequency = "daily" | "weekly" | "fortnightly" | "monthly" | "interval";
export type RoutinePhase = "preparation" | "occurrence" | "follow_up";
export type ServiceMode = "dine_in" | "takeaway" | "delivery";
export type OrderMethod =
  | "direct_phone"
  | "direct_web"
  | "delivery_app"
  | "walk_in"
  | "at_table"
  | "other";
export type PreferenceCategory =
  | "meal"
  | "takeaway"
  | "snack"
  | "activity"
  | "drink"
  | "restaurant"
  | "ingredient";
export type PreferenceRelation =
  | "favourite"
  | "likes"
  | "usually"
  | "dislikes"
  | "avoids"
  | "needs"
  | "only_if";
export type PreferenceSource = "observed" | "told_by_person" | "household_knowledge";
export type Visibility = "private" | "household";

export type DomainPerson = {
  personId: Id<"domainPeople">;
  name: string;
  relationship: PersonRelationship;
  birthDate?: string;
  visibility: Visibility;
  linkedUserId?: Id<"users">;
};

export type DomainResponsibility = {
  responsibilityId: Id<"responsibilityAreas">;
  name: string;
  domain: ResponsibilityDomain;
  status: "active" | "paused";
  health: ResponsibilityHealth;
  ownerPersonId?: Id<"domainPeople">;
  backupPersonId?: Id<"domainPeople">;
  reviewCadence: ReviewCadence;
  nextReviewAt?: number;
  openTaskCount: number;
  routineCount: number;
};

export type RoutineVariant = {
  variantId: Id<"routineVariants">;
  name: string;
  sequencePosition: number;
};

export type RoutineStep = {
  stepId: Id<"routineStepTemplates">;
  variantId?: Id<"routineVariants">;
  title: string;
  phase: RoutinePhase;
  offsetDays: number;
  timeLocal?: string;
  assigneePersonId?: Id<"domainPeople">;
  position: number;
};

export type DomainRoutine = {
  routineId: Id<"routineDefinitions">;
  name: string;
  status: "active" | "paused";
  responsibilityId?: Id<"responsibilityAreas">;
  personId?: Id<"domainPeople">;
  frequency: RoutineFrequency;
  interval: number;
  weekdays: number[];
  dayOfMonth?: number;
  timeLocal?: string;
  startsOn: string;
  alternating: boolean;
  nextOccurrenceAt?: number;
  variants: RoutineVariant[];
  steps: RoutineStep[];
};

export type DomainTask = {
  taskId: Id<"domainTasks">;
  title: string;
  status: DomainTaskStatus;
  priority: TaskPriority;
  startAt?: number;
  dueAt?: number;
  estimatedMinutes?: number;
  responsibilityId?: Id<"responsibilityAreas">;
  routineId?: Id<"routineDefinitions">;
  concernsPersonId?: Id<"domainPeople">;
  accountablePersonId?: Id<"domainPeople">;
  assigneePersonId?: Id<"domainPeople">;
  completedAt?: number;
};

export type DomainRestaurant = {
  restaurantId: Id<"restaurants">;
  name: string;
  cuisine?: string;
  serviceModes: ServiceMode[];
  preferredOrderMethod?: OrderMethod;
  phone?: string;
  website?: string;
  addressLine?: string;
  postcode?: string;
  parkingGuidance?: string;
  bookingGuidance?: string;
  preferenceCount: number;
  orderCount: number;
};

export type FoodItem = {
  foodItemId: Id<"foodItems">;
  name: string;
  kind: "meal" | "takeaway_item" | "snack" | "drink" | "ingredient";
  brand?: string;
  defaultPreparation?: string;
};

export type ActivityItem = {
  activityId: Id<"activities">;
  name: string;
  venue?: string;
};

export type DomainPreference = {
  preferenceId: Id<"personPreferences">;
  personId: Id<"domainPeople">;
  category: PreferenceCategory;
  relation: PreferenceRelation;
  foodItemId?: Id<"foodItems">;
  restaurantId?: Id<"restaurants">;
  activityId?: Id<"activities">;
  preparationPreference?: string;
  avoidFoodItemIds: Id<"foodItems">[];
  source: PreferenceSource;
  lastConfirmedAt?: number;
  visibility: Visibility;
};

export type OrderLine = {
  lineId: Id<"restaurantOrderLines">;
  quantity: number;
  itemName: string;
  variant?: string;
  modifications: string[];
  forPersonIds: Id<"domainPeople">[];
  position: number;
};

export type OrderProfile = {
  orderProfileId: Id<"restaurantOrderProfiles">;
  restaurantId: Id<"restaurants">;
  name: string;
  scope: "household" | "person";
  personId?: Id<"domainPeople">;
  orderMethod?: OrderMethod;
  lines: OrderLine[];
};

export type DomainWorkspaceData = {
  people: DomainPerson[];
  responsibilities: DomainResponsibility[];
  routines: DomainRoutine[];
  tasks: DomainTask[];
  restaurants: DomainRestaurant[];
  foodItems: FoodItem[];
  activities: ActivityItem[];
  preferences: DomainPreference[];
  orderProfiles: OrderProfile[];
};

export type CreatorKind =
  | "responsibility"
  | "routine"
  | "task"
  | "person"
  | "restaurant"
  | "preference"
  | "order";
