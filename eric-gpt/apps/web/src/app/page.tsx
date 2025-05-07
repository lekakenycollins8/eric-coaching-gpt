export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to{" "}
          <span className="text-green-600">Eric GPT Coaching Platform</span>
        </h1>
        <p className="mt-3 text-2xl">
          AI-powered leadership coaching with the Jackier Method
        </p>
        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6">
          <a
            href="/worksheets"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-green-600 focus:text-green-600"
          >
            <h3 className="text-2xl font-bold">Worksheets &rarr;</h3>
            <p className="mt-4 text-xl">
              Explore leadership worksheets from the 12 pillars
            </p>
          </a>

          <a
            href="/auth/signin"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-green-600 focus:text-green-600"
          >
            <h3 className="text-2xl font-bold">Sign In &rarr;</h3>
            <p className="mt-4 text-xl">
              Log in to your account to access your coaching dashboard
            </p>
          </a>
        </div>
      </main>
    </div>
  );
}