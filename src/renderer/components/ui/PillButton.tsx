import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "primary" | "danger" | "muted";
  tooltip?: string;
}

export function PillButton({
  children,
  icon,
  tone = "default",
  className = "",
  type = "button",
  title,
  tooltip,
  ...buttonProps
}: PillButtonProps): ReactElement {
  const classes = ["pill-button", `pill-button-${tone}`, className].filter(Boolean).join(" ");
  const tooltipText = tooltip ?? title ?? (typeof children === "string" ? children : undefined);

  return (
    <button
      {...buttonProps}
      type={type}
      title={tooltipText}
      data-tooltip={tooltipText}
      className={classes}
    >
      {icon && <span className="pill-button-icon">{icon}</span>}
      <span className="pill-button-label">{children}</span>
    </button>
  );
}
