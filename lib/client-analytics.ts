export type AnalyticsParameters = Record<string, string | number | boolean>;

export function trackAnalyticsEvent(eventName: string, parameters: AnalyticsParameters) {
  if (typeof window === "undefined") return;
  const analyticsWindow = window as Window & {
    gtag?: (command: "event", name: string, values: AnalyticsParameters) => void;
  };
  analyticsWindow.gtag?.("event", eventName, parameters);
}
