"use client";

import {
  HttpTransportType,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { bff } from "@/lib/bff";

/** Raphael.Notification NotificationDto — only what the portal reads. */
export interface LiveNotification {
  id: string;
  businessEventCode: string;
  title: string;
  message: string;
  createdAtUtc: string;
  metadata?: Record<string, string> | null;
}

/** Raphael.Shared TripStatusChangedMessage. */
export interface TripStatusChange {
  tripId: number;
  status: string;
  isCancelled: boolean;
  date: string;
}

/** Raphael.Shared TripVehiclePositionMessage. */
export interface TripVehiclePosition {
  tripId: number;
  latitude: number;
  longitude: number;
  speed: number;
  direction: string | null;
  atUtc: string;
  /** Where the vehicle is heading for this trip: "Pickup" until the patient is on board, then "Dropoff". */
  phase?: "Pickup" | "Dropoff";
  /** Miles to the stop of `phase`, measured by the backend on each fix without Google. Null when unknown. */
  remainingMiles?: number | null;
  /** The route's current ETAs ("HH:mm:ss"), as the driver's app last left them: they arrive with every fix. */
  pickupEta?: string | null;
  dropoffEta?: string | null;
}

/** Raphael.Shared WatchTripResult; null when the trip is not the clinic's. */
export interface WatchTripResult {
  inProgress: boolean;
  position: TripVehiclePosition | null;
}

export type HubStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

interface HubToken {
  accessToken: string;
  hubBaseUrl: string;
}

interface Realtime {
  status: HubStatus;
  /** Notices received live since the page opened. NotificationsProvider merges them with the stored ones. */
  notifications: LiveNotification[];
  /** Calls back on every status change of this clinic's trips. Returns the unsubscribe. */
  onTripStatus(listener: (change: TripStatusChange) => void): () => void;
  /**
   * Calls back when a followed trip's ETAs or routing change (Raphael.Shared TripTrackingChangedMessage):
   * the driver wrote an ETA, or the trip was routed, unrouted or re-timed. Only for trips joined with
   * watchTrip. Returns the unsubscribe.
   */
  onTripTracking(listener: (tripId: number) => void): () => void;
  /** Follows one trip's vehicle while it is under way. Returns null when the trip is not this clinic's. */
  watchTrip(tripId: number, onPosition: (p: TripVehiclePosition) => void): Promise<{ result: WatchTripResult | null; stop: () => void }>;
}

const RealtimeContext = createContext<Realtime | null>(null);

export function useRealtime() {
  const value = useContext(RealtimeContext);
  if (!value) throw new Error("useRealtime must be used inside <RealtimeProvider>.");
  return value;
}

/**
 * The portal's two live channels, opened once per page:
 * - notifications: what the clinic's integrator is told (scheduled, on the way, cancelled…);
 * - dispatch: every status change of the clinic's trips, and the vehicle of a trip under way.
 *
 * WebSockets only, without the negotiate round-trip: negotiate is a cross-origin fetch that would
 * need CORS on the API, while the WebSocket itself does not. The token comes from our BFF on every
 * (re)connect and lives only in memory.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<HubStatus>("connecting");
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const dispatchRef = useRef<HubConnection | null>(null);
  const statusListeners = useRef(new Set<(c: TripStatusChange) => void>());
  const trackingListeners = useRef(new Set<(tripId: number) => void>());
  const positionListeners = useRef(new Map<number, (p: TripVehiclePosition) => void>());

  useEffect(() => {
    let disposed = false;
    const connections: HubConnection[] = [];

    function build(hubBaseUrl: string, path: string) {
      const connection = new HubConnectionBuilder()
        .withUrl(`${hubBaseUrl}${path}`, {
          transport: HttpTransportType.WebSockets,
          skipNegotiation: true,
          accessTokenFactory: async () => (await bff<HubToken>("/api/realtime/token")).accessToken,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();
      connections.push(connection);
      return connection;
    }

    async function start() {
      const { hubBaseUrl } = await bff<HubToken>("/api/realtime/token");
      // Unmounted while the token was on its way (React mounts twice in development): open nothing.
      if (disposed) return;
      const base = hubBaseUrl.replace(/\/$/, "");

      const notificationHub = build(base, "/hubs/notifications");
      notificationHub.on("ReceiveNotification", (n: LiveNotification) => {
        setNotifications((current) => [n, ...current].slice(0, 200));
      });

      const dispatchHub = build(base, "/hubs/dispatch");
      dispatchHub.on("TripStatusChanged", (c: TripStatusChange) => statusListeners.current.forEach((l) => l(c)));
      dispatchHub.on("TripTrackingChanged", (m: { tripId: number }) => trackingListeners.current.forEach((l) => l(m.tripId)));
      dispatchHub.on("TripVehiclePosition", (p: TripVehiclePosition) => positionListeners.current.get(p.tripId)?.(p));
      // Groups do not survive a reconnect: the server sees a new connection and must be asked again.
      dispatchHub.onreconnected(async () => {
        await dispatchHub.invoke("WatchClinic").catch(() => undefined);
        for (const tripId of positionListeners.current.keys()) {
          await dispatchHub.invoke("WatchTrip", tripId).catch(() => undefined);
        }
        setStatus("connected");
      });
      dispatchHub.onreconnecting(() => setStatus("reconnecting"));
      dispatchHub.onclose(() => setStatus("disconnected"));
      dispatchRef.current = dispatchHub;

      await Promise.all([notificationHub.start(), dispatchHub.start()]);
      // Unmounted while connecting: the cleanup ran before these existed, so they are closed here,
      // or they would stay open and deliver every notice twice.
      if (disposed) {
        await Promise.all(connections.map((c) => c.stop()));
        return;
      }
      await dispatchHub.invoke("WatchClinic");
      setStatus("connected");
    }

    start().catch(() => !disposed && setStatus("disconnected"));

    return () => {
      disposed = true;
      for (const connection of connections) {
        if (connection.state !== HubConnectionState.Disconnected) void connection.stop();
      }
    };
  }, []);

  const onTripTracking = useCallback((listener: (tripId: number) => void) => {
    trackingListeners.current.add(listener);
    return () => void trackingListeners.current.delete(listener);
  }, []);

  const onTripStatus = useCallback((listener: (c: TripStatusChange) => void) => {
    statusListeners.current.add(listener);
    return () => void statusListeners.current.delete(listener);
  }, []);

  const watchTrip = useCallback(async (tripId: number, onPosition: (p: TripVehiclePosition) => void) => {
    positionListeners.current.set(tripId, onPosition);
    const hub = dispatchRef.current;
    const stop = () => {
      positionListeners.current.delete(tripId);
      if (hub?.state === HubConnectionState.Connected) void hub.invoke("UnwatchTrip", tripId).catch(() => undefined);
    };
    if (!hub || hub.state !== HubConnectionState.Connected) return { result: null, stop };
    const result = await hub.invoke<WatchTripResult | null>("WatchTrip", tripId).catch(() => null);
    return { result, stop };
  }, []);

  const value: Realtime = {
    status,
    notifications,
    onTripStatus,
    onTripTracking,
    watchTrip,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
