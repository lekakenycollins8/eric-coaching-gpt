"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h2>Something went wrong!</h2>
      <p>{error.message || 'An unexpected error occurred.'}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
