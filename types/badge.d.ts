// Type definitions for badge rendering

export interface CategoryObject {
  name: string;
  url: string;
}

export type CategoryItem = string | CategoryObject;

export interface BadgeGroup {
  groupName: string;
  groupIcon: string;
  groupColor: string;
  groupUrl?: string;
  categories: CategoryItem[];
}

export interface TooltipButton {
  button: HTMLButtonElement;
  tooltip: HTMLDivElement;
}
