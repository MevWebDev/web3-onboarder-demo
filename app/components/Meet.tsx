import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";

import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";

const Meet = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    "isScheduleMeeting" | "isJoiningMeeting" | "isInstantMeeting" | undefined
  >();

  const [values, setValues] = useState(initialValues);

  const user = useAccount();
  const client = useStreamVideoClient();

  const [callDetails, setCallDetails] = useState<Call>();

  const createMeeting = async () => {
    if (!user?.address) return;

    try {
      const id = crypto.randomUUID();
      const call = client.call("default", id);

      if (!call) throw new Error("No call");

      const startsAt = values.dateTime.toISOString();
      new Date(Date.now()).toISOString();

      const description = values.description || "No description";

      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: { description },
        },
      });
      setCallDetails(call);
      if (!values.description) {
        router.push(`/meeting/${call.id}`);
      }
    } catch (error) {
      console.error("Error generating UUID:", error);
    }
  };
};
