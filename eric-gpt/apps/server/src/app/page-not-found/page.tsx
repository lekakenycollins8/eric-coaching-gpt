export default function PageNotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h2>404 - Page Not Found</h2>
      <p>Could not find the requested resource.</p>
    </div>
  );
}

export const dynamic = 'force-static';
