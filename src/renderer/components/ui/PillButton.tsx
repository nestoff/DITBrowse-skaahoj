import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "primary" | "danger" | "muted";
}

export function PillButton({
  children,
  icon,
  tone = "default",
  className = "",
  type = "button",
  ...buttonProps
}: PillButtonProps): ReactElement {
  const classes = ["pill-button", `pill-button-${tone}`, className].filter(Boolean).join(" ");

  return (
    <button {...buttonProps} type={type} className={classes}>
      {icon && <span className="pill-button-icon">{icon}</span>}
      <span className="pill-button-label">{children}</span>
    </button>
  );
}
