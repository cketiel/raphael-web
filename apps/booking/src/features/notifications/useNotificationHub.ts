"use client";

import {
  HttpTransportType,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";
import { bff } from "@/lib/bff";

/** Raphael.Notification/Application/DTOs/NotificationDto.cs — only what this screen reads. */
export interface LiveNotification {
  id: string;
  businessEventCode: string;
  title: string;
  message: string;
  createdAtUtc: string;
}

interface HubToken {
  accessToken: string;
  hubBaseUrl: string;
}

export type HubStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

/**
 * Live notifications for the signed-in facility (group Integrator_{id} on the backend).
 *
 * WebSockets only, without the negotiate round-trip: negotiate is a cross-origin fetch that would
 * need CORS on the API, while the WebSocket itself does not. The token is fetched from our BFF on
 * every (re)connect and lives only in this closure.
 */
export function useNotificationHub() {
  const [status, setStatus] = useState<HubStatus>("connecting");
  const [items, setItems] = useState<LiveNotification[]>([]);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    let disposed = false;

    async function start() {
      const { hubBaseUrl } = await bff<HubToken>("/api/realtime/token");
      const connection = new HubConnectionBuilder()
        .withUrl(`${hubBaseUrl}/hubs/notifications`, {
          transport: HttpTransportType.WebSockets,
          skipNegotiation: true,
          accessTokenFactory: async () => (await bff<HubToken>("/api/realtime/token")).accessToken,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      connection.on("ReceiveNotification", (n: LiveNotification) =>
        setItems((current) => [n, ...current].slice(0, 50)),
      );
      connection.onreconnecting(() => setStatus("reconnecting"));
      connection.onreconnected(() => setStatus("connected"));
      connection.onclose(() => setStatus("disconnected"));

      connectionRef.current = connection;
      await connection.start();
      if (disposed) await connection.stop();
      else setStatus("connected");
    }

    start().catch(() => !disposed && setStatus("disconnected"));

    return () => {
      disposed = true;
      const connection = connectionRef.current;
      if (connection && connection.state !== HubConnectionState.Disconnected) void connection.stop();
    };
  }, []);

  return { status, items };
}
