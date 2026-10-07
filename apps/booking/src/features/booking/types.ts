import type { Schemas } from "@raphael/api-client";

/**
 * What GET /api/BookingPortal/my-trips returns: the generated TripReadDto, not a copy.
 *
 * The generator marks every property optional, including C# value types (int, double,
 * DateTime) that the backend always serializes. The ones this portal relies on are declared
 * required here, rather than papered over with defaults that would hide a real gap.
 */
export type TripRead = Schemas["TripReadDto"] &
  Required<
    Pick<
      Schemas["TripReadDto"],
      "id" | "date" | "pickupLatitude" | "pickupLongitude" | "dropoffLatitude" | "dropoffLongitude"
    >
  >;
