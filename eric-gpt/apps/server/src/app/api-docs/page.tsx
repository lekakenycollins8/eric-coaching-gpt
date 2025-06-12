'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to prevent SSR issues
// This also helps with the React Strict Mode warnings
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/swagger')
      .then((response) => response.json())
      .then((data) => setSpec(data))
      .catch((error) => console.error('Error loading API docs:', error));
  }, []);

  return (
    <div className="swagger-container">
      <div className="swagger-header">
        <h1>Eric GPT Coaching Platform API Documentation</h1>
      </div>
      {spec ? (
        // SwaggerUI is rendered client-side only
        <div className="swagger-ui-wrapper">
          <SwaggerUI spec={spec} />
        </div>
      ) : (
        <div className="loading">Loading API documentation...</div>
      )}
      <style jsx global>{`
        .swagger-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .swagger-header {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eaeaea;
        }
        .loading {
          padding: 20px;
          text-align: center;
          font-size: 18px;
          color: #666;
        }
        .swagger-ui .info .title {
          color: #333;
        }
        .swagger-ui .opblock .opblock-summary-method {
          background-color: #0070f3;
        }
        .swagger-ui-wrapper {
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}
