"use server";

import { StreamClient } from "@stream-io/node-sdk";
import { useAccount } from "wagmi";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

export const tokenProvider = async () => {
  const user = useAccount();
  if (!user) throw new Error("No user");
  if (!apiKey || !apiSecret) throw new Error("No API key or secret");

  const client = new StreamClient(apiKey, apiSecret);

  const token = client.createToken(user.address!);
};
