/**
 * What GET /api/BookingPortal/my-trips returns (Raphael.Shared/DTOs/TripReadDto.cs).
 *
 * ⚠️ Written by hand only because the endpoint returns IActionResult without
 * [ProducesResponseType], so Swagger does not describe it and the generator cannot see it.
 * Delete this file once the backend declares the type: it is exactly the drift §5 forbids.
 */
export interface TripRead {
  id: number;
  date: string;
  fromTime: string | null;
  toTime: string | null;
  customerId: number;
  customerName: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  spaceTypeName: string;
  isCancelled: boolean;
  charge: number | null;
  type: string | null;
  pickupComment: string | null;
  dropoffComment: string | null;
  tripId: string | null;
  distance: number | null;
  status: string;
  fundingSourceName: string | null;
  pickupCity: string | null;
  dropoffCity: string | null;
}
