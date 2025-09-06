"use client";

import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
import { ReactNode, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { tokenProvider } from "./actions/stream.actions";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

export const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const user = useAccount();

  useEffect(() => {
    if (!user?.address || !apiKey) return;

    const client = new StreamVideoClient({
      apiKey,
      user: {
        id: user.address,
        name: user.address,
        image: `https://avatars.dicebear.com/api/identicon/${user.address}.svg`,
      },
      tokenProvider,
    });

    setVideoClient(client);

    return () => {
      client.disconnectUser();
    };
  }, [user?.address]);

  if (!videoClient) {
    return <div>Loading Stream client...</div>;
  }

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};
