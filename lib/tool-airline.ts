import type { Airline } from "@/lib/types";

export type ToolAirline = Pick<Airline, "slug" | "name" | "fees">;
