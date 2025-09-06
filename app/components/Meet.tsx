"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";

// Define initial values
const initialValues = {
  dateTime: new Date(),
  description: "",
  link: "",
};

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
    if (!user?.address || !client) return;

    try {
      const id = crypto.randomUUID();
      const call = client.call("default", id);

      if (!call) throw new Error("Failed to create call");

      const startsAt = values.dateTime.toISOString();
      const description = values.description || "Instant meeting";

      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description,
            created_by: user.address,
          },
        },
      });

      setCallDetails(call);

      if (!values.description) {
        router.push(`/meeting/${call.id}`);
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
    }
  };

  const joinMeeting = () => {
    if (values.link) {
      router.push(values.link);
    }
  };

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {/* Instant Meeting */}
      <div
        className="bg-orange-1 px-4 py-6 flex flex-col justify-between w-full xl:max-w-[270px] min-h-[260px] rounded-[14px] cursor-pointer"
        onClick={() => setMeetingState("isInstantMeeting")}
      >
        <div className="flex-center glassmorphism w-12 h-12 rounded-[10px]">
          📹
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">New Meeting</h1>
          <p className="text-lg font-normal">Start an instant meeting</p>
        </div>
      </div>

      {/* Join Meeting */}
      <div
        className="bg-blue-1 px-4 py-6 flex flex-col justify-between w-full xl:max-w-[270px] min-h-[260px] rounded-[14px] cursor-pointer"
        onClick={() => setMeetingState("isJoiningMeeting")}
      >
        <div className="flex-center glassmorphism w-12 h-12 rounded-[10px]">
          ➕
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Join Meeting</h1>
          <p className="text-lg font-normal">via invitation link</p>
        </div>
      </div>

      {/* Schedule Meeting */}
      <div
        className="bg-purple-1 px-4 py-6 flex flex-col justify-between w-full xl:max-w-[270px] min-h-[260px] rounded-[14px] cursor-pointer"
        onClick={() => setMeetingState("isScheduleMeeting")}
      >
        <div className="flex-center glassmorphism w-12 h-12 rounded-[10px]">
          📅
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Schedule Meeting</h1>
          <p className="text-lg font-normal">Plan your meeting</p>
        </div>
      </div>

      {/* View Recordings */}
      <div
        className="bg-yellow-1 px-4 py-6 flex flex-col justify-between w-full xl:max-w-[270px] min-h-[260px] rounded-[14px] cursor-pointer"
        onClick={() => router.push("/recordings")}
      >
        <div className="flex-center glassmorphism w-12 h-12 rounded-[10px]">
          📼
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">View Recordings</h1>
          <p className="text-lg font-normal">Meeting recordings</p>
        </div>
      </div>

      {/* Modals based on meeting state */}
      {meetingState === "isInstantMeeting" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl mb-4">Start Instant Meeting</h2>
            <button
              onClick={createMeeting}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Start Meeting
            </button>
            <button
              onClick={() => setMeetingState(undefined)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {meetingState === "isJoiningMeeting" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl mb-4">Join Meeting</h2>
            <input
              type="text"
              placeholder="Meeting link"
              value={values.link}
              onChange={(e) => setValues({ ...values, link: e.target.value })}
              className="border p-2 rounded w-full mb-4"
            />
            <button
              onClick={joinMeeting}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Join
            </button>
            <button
              onClick={() => setMeetingState(undefined)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Meet;
