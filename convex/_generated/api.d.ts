/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as households from "../households.js";
import type * as http from "../http.js";
import type * as invitations from "../invitations.js";
import type * as mentalLoad from "../mentalLoad.js";
import type * as ordia from "../ordia.js";
import type * as profiles from "../profiles.js";

/**
 * A utility for referencing Convex functions in your app's API.
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  households: typeof households;
  http: typeof http;
  invitations: typeof invitations;
  mentalLoad: typeof mentalLoad;
  ordia: typeof ordia;
  profiles: typeof profiles;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;