'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './api-docs.module.css';
import 'swagger-ui-react/swagger-ui.css';


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
    <div className={styles.swaggerContainer}>
      <div className={styles.swaggerHeader}>
        <h1>Eric GPT Coaching Platform API Documentation</h1>
      </div>
      {spec ? (
        <div className={styles.swaggerUiWrapper}>
          <SwaggerUI spec={spec} />
        </div>
      ) : (
        <div className={styles.loading}>Loading API documentation...</div>
      )}
    </div>
  );
}