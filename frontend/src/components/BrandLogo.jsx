export default function BrandLogo({ compact = false }) {
  return (
    <>
      <svg className="brand-symbol" viewBox="0 0 40 40" role="img" aria-label="Spendora logo">
        <rect width="40" height="40" rx="13" fill="currentColor" />
        <path d="M27.8 12.8c-1.6-2-4.1-3.1-7.7-3.1-5.3 0-8.8 2.8-8.8 6.8 0 4 3.2 5.4 8.3 6.2 3.3.5 4.8 1 4.8 2.4 0 1.4-1.5 2.3-4.1 2.3-2.7 0-4.9-.9-6.7-2.8l-3.4 3.6c2.4 2.7 5.8 4 10.1 4 5.8 0 9.5-2.8 9.5-7.2 0-4.1-3.1-5.7-8.2-6.5-3.5-.6-4.9-1-4.9-2.3s1.3-2 3.6-2c2 0 3.8.7 5.2 2l2.3-3.4Z" fill="#F8FAF4" transform="translate(0 -1)" />
        <circle cx="29.5" cy="10" r="3" fill="#D6F27A" />
      </svg>
      {!compact && (
        <span className="brand-wordmark">spendora<span className="brand-period">.</span></span>
      )}
    </>
  );
}
