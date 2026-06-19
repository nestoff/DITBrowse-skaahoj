import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  active?: boolean;
  tooltip?: string;
}

export function IconButton({
  label,
  icon,
  active = false,
  tooltip,
  className = "",
  type = "button",
  ...buttonProps
}: IconButtonProps): ReactElement {
  const classes = ["icon-button", active ? "active" : "", className].filter(Boolean).join(" ");
  const tooltipText = tooltip ?? label;

  return (
    <button
      {...buttonProps}
      type={type}
      aria-label={label}
      title={tooltipText}
      data-tooltip={tooltipText}
      className={classes}
    >
      {icon}
    </button>
  );
}
