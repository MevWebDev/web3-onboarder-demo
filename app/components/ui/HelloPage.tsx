import Image from 'next/image';

interface HelloPageProps {
  setter: (step: 'welcome' | 'connect' | 'onboarding' | 'home') => void;
}

export default function HelloPage({ setter }: HelloPageProps) {
  return (
    <div className="flex flex-col flex-1 w-[90%] items-center">
      <div className=" flex-1 flex-col gap-4  mx-auto from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 flex items-center justify-center">
        <div className="flex gap-4 items-center ">
          <h1 className="text-3xl font-bold text-[var(--app-foreground)] mb-4 text-center">
            Welcome to
          </h1>
          <Image src="/icon.png" alt="Welcome Illustration" width={64} height={64} className="" />
        </div>
        <p className="text-lg text-center mb-6">Let me onboard you to the web3 world.</p>
      </div>

      <button
        className=" mb-8 mx-8 w-full max-w-md py-4 rounded-3xl text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:from-blue-600 hover:to-purple-700 transition-all "
        onClick={() => setter('connect')}
      >
        Get Started
      </button>
    </div>
  );
}
