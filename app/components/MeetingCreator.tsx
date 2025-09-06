// app/components/MeetingCreator.tsx
'use client';import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { logger } from '@/lib/logger/index';interface MeetingCreatorProps {
mentorName: string;
onMeetingCreated: () => void;
onCancel: () => void;
}// Smart contract details
const CONTRACT_ADDRESS = '0x6b3398c941887a28c994802f6b22a84cc0a9322b' as const;
const RECEIVER_ADDRESS = '0xa9Eeb7010a1BDB3Ef38812Be8C5777F66d5163F0' as const;// Contract ABI for the createMeeting function
const CONTRACT_ABI = [
{
inputs: [
{
internalType: 'address',
name: '_receiver',
type: 'address',
},
],
name: 'createMeeting',
outputs: [],
stateMutability: 'payable',
type: 'function',
},
] as const;export default function MeetingCreator({ mentorName, onMeetingCreated, onCancel }: MeetingCreatorProps) {
const [paymentAmount, setPaymentAmount] = useState('0.001'); // Default amount in ETH
const [isCreating, setIsCreating] = useState(false);
const { address } = useAccount();const { writeContract, data: hash, error } = useWriteContract();const { isLoading: isTransactionLoading, isSuccess } = useWaitForTransactionReceipt({
hash,
});const handleCreateMeeting = async () => {
if (!address) {
logger.error('No wallet connected');
return;
}if (!paymentAmount || isNaN(Number(paymentAmount))) {
  logger.error('Invalid payment amount');
  return;
}try {
  setIsCreating(true);  logger.info('Creating meeting on blockchain', {
    mentorName,
    paymentAmount,
    receiver: RECEIVER_ADDRESS,
  });  await writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'createMeeting',
    args: [RECEIVER_ADDRESS],
    value: parseEther(paymentAmount),
  });} catch (error) {
  logger.error('Failed to create meeting:', error);
  setIsCreating(false);
}
};// Handle successful transaction
if (isSuccess) {
logger.info('Meeting created successfully', { hash });
onMeetingCreated();
return null;
}return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
<h3 className="text-lg font-semibold mb-4 text-gray-900">
Schedule Meeting with {mentorName}
</h3>    <p className="text-sm text-gray-600 mb-4">
      To start a video call with your mentor, please set the meeting fee that will be paid to the platform.
    </p>    <div className="mb-4">
      <label htmlFor="payment" className="block text-sm font-medium text-gray-700 mb-2">
        Meeting Fee (ETH)
      </label>
      <input
        id="payment"
        type="number"
        step="0.001"
        min="0"
        value={paymentAmount}
        onChange={(e) => setPaymentAmount(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        placeholder="0.001"
        disabled={isCreating || isTransactionLoading}
      />
      <p className="text-xs text-gray-500 mt-1">
        This fee will be sent to the platform to create the meeting
      </p>
    </div>    {error && (
      <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-md">
        <p className="text-sm text-red-700">
          Error: {error.message || 'Failed to create meeting'}
        </p>
      </div>
    )}    <div className="flex gap-3">
      <button
        onClick={onCancel}
        disabled={isCreating || isTransactionLoading}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>      <button
        onClick={handleCreateMeeting}
        disabled={isCreating || isTransactionLoading || !address}
        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
      >
        {isCreating || isTransactionLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            {isTransactionLoading ? 'Confirming...' : 'Creating...'}
          </div>
        ) : (
          `Pay ${paymentAmount} ETH & Start Call`
        )}
      </button>
    </div>    {hash && (
      <div className="mt-4 p-3 bg-blue-100 border border-blue-400 rounded-md">
        <p className="text-sm text-blue-700">
          Transaction submitted! 
          <a 
            href={`https://sepolia.basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline ml-1"
          >
            View on Explorer
          </a>
        </p>
      </div>
    )}    <div className="mt-4 text-xs text-gray-500">
      <p>Contract: {CONTRACT_ADDRESS}</p>
      <p>Network: Base Sepolia</p>
    </div>
  </div>
</div>
);
}