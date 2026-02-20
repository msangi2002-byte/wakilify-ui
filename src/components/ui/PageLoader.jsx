import { APP_NAME, LOGO_PNG, LOGO_ICON } from '@/lib/constants/brand';
import { useState } from 'react';

export function PageLoader() {
  const [logoSrc, setLogoSrc] = useState(LOGO_PNG);

  return (
    <div
      className="page-loader"
      role="status"
      aria-live="polite"
      aria-label={`${APP_NAME} is loading`}
    >
      <div className="page-loader-card">
        <div className="page-loader-logo-wrap">
          <div className="page-loader-logo-ring" aria-hidden="true" />
          <img
            src={logoSrc}
            alt=""
            className="page-loader-logo"
            onError={() => setLogoSrc(LOGO_ICON)}
          />
        </div>
        <div className="page-loader-spinner" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="page-loader-label">
          Loading<span className="page-loader-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
        </p>
        <p className="page-loader-app">{APP_NAME}</p>
      </div>
    </div>
  );
}
