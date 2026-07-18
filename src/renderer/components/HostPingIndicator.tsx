import type { ReactElement } from "react";
import { Circle } from "lucide-react";
import type { HostPingStatus } from "../../shared/hostPing";
import { Tooltip } from "./ui/Tooltip";

interface HostPingIndicatorProps {
  status: HostPingStatus;
}

interface PingPresentation {
  label: string;
  ariaLabel: string;
  tooltipTitle: string;
  tooltipDescription: string;
}

function formatLatency(latencyMs: number | null): string {
  if (latencyMs === null) {
    return "Online";
  }
  if (latencyMs < 1) {
    return "<1 ms";
  }
  if (latencyMs < 10) {
    return `${latencyMs.toFixed(1)} ms`;
  }
  return `${Math.round(latencyMs)} ms`;
}

function latencyAriaLabel(latencyMs: number | null): string {
  if (latencyMs === null) {
    return "reachable";
  }
  if (latencyMs < 1) {
    return "less than 1 millisecond";
  }

  const value = latencyMs < 10 ? latencyMs.toFixed(1) : String(Math.round(latencyMs));
  return `${value} milliseconds`;
}

function presentationFor(status: HostPingStatus): PingPresentation {
  if (status.state === "checking") {
    return {
      label: "Checking",
      ariaLabel: `Ping ${status.host}: checking`,
      tooltipTitle: "Checking camera",
      tooltipDescription: `Waiting for a small ping reply from ${status.host}. One 16-byte ping packet is sent every 5 seconds.`
    };
  }

  if (status.state === "offline") {
    return {
      label: "Offline",
      ariaLabel: `Ping ${status.host}: offline`,
      tooltipTitle: "No ping response",
      tooltipDescription: `${status.host} did not reply to ICMP. One 16-byte ping packet is sent every 5 seconds.`
    };
  }

  const label = formatLatency(status.latencyMs);
  return {
    label,
    ariaLabel: `Ping ${status.host}: ${latencyAriaLabel(status.latencyMs)}`,
    tooltipTitle: "Camera reachable",
    tooltipDescription: `${status.host} replied${status.latencyMs === null ? "" : ` in ${label}`}. One 16-byte ping packet is sent every 5 seconds.`
  };
}

export function HostPingIndicator({ status }: HostPingIndicatorProps): ReactElement {
  const presentation = presentationFor(status);

  return (
    <Tooltip
      title={presentation.tooltipTitle}
      description={presentation.tooltipDescription}
    >
      {(triggerProps) => (
        <span
          ref={triggerProps.ref}
          className={`host-ping-indicator ${status.state}`}
          role="img"
          tabIndex={0}
          aria-label={presentation.ariaLabel}
          aria-describedby={triggerProps["aria-describedby"]}
          onPointerEnter={triggerProps.onPointerEnter}
          onPointerLeave={triggerProps.onPointerLeave}
          onFocus={triggerProps.onFocus}
          onBlur={triggerProps.onBlur}
          onClick={triggerProps.onClick}
        >
          <Circle
            className="host-ping-dot"
            size={7}
            strokeWidth={0}
            fill="currentColor"
            aria-hidden="true"
          />
          <span aria-hidden="true">{presentation.label}</span>
        </span>
      )}
    </Tooltip>
  );
}
