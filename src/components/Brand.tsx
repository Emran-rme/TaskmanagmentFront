import { APP_NAME, BRAND_ICON, BRAND_LOGO } from "../lib/branding";

export default function Brand({ large = false }: { large?: boolean }) {
  return (
    <div className={large ? "hamrah-brand hamrah-brand-large" : "hamrah-brand"}>
      <span className="hamrah-logo-surface">
        <img src={large ? BRAND_LOGO : BRAND_ICON} alt="همراه؛ سامانه جامع همکاری‌های سازمانی" width={large ? 144 : 48} height={large ? 144 : 48} />
      </span>
      <span className={large ? "sr-only" : "hamrah-brand-caption"}>{APP_NAME}</span>
    </div>
  );
}
