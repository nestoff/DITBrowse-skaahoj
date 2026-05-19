import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  active?: boolean;
}

export function IconButton({
  label,
  icon,
  active = false,
  className = "",
  type = "button",
  ...buttonProps
}: IconButtonProps): ReactElement {
  const classes = ["icon-button", active ? "active" : "", className].filter(Boolean).join(" ");

  return (
    <button {...buttonProps} type={type} aria-label={label} title={label} className={classes}>
      {icon}
    </button>
  );
}
