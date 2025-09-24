"use client";

import { SessionProvider } from "next-auth/react";
import { ImageKitProvider } from "@imagekit/next";
import { NotificationProvider } from "./Notification";

const urlEndPoint = process.env.NEXT_PUBLIC_URL_ENDPOINT!;

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Remove the refetch restrictions to allow proper session updates
      refetchInterval={5 * 60} // Refresh every 5 minutes
      refetchOnWindowFocus={true} // Refresh when window regains focus
    >
      <ImageKitProvider urlEndpoint={urlEndPoint}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ImageKitProvider>
    </SessionProvider>
  );
}