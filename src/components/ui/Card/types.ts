import * as React from 'react';

/** Semantic tone of the card surface/border */
export type CardTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

/** Structural variant */
export type CardVariant = 'surface' | 'elevated' | 'default'; // 'default' aliases 'elevated'

/** Shadow depth for elevated variant */
export type CardElevation = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Spacing applied by CardSection and wrappers */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/** Text density */
export type CardDensity = 'compact' | 'standard' | 'comfortable';

/** Layout direction for subcomponents */
export type CardOrientation = 'vertical' | 'horizontal';

/** Corner radius scale (includes 'none') */
export type CardRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Root Card props */
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  href?: string;
  target?: string;
  rel?: string;

  className?: string;
  children?: React.ReactNode;

  variant?: CardVariant; // 'surface' | 'elevated' | 'default' (alias of 'elevated')
  tone?: CardTone; // default/info/success/warning/danger
  elevation?: CardElevation; // only meaningful for 'elevated'/'default'

  density?: CardDensity;
  orientation?: CardOrientation;
  padding?: CardPadding;
  radius?: CardRadius;

  /** Whether the card clips children to its rounded corners. Default: true */
  clipContent?: boolean;

  interactive?: boolean;
  disabled?: boolean;

  shadowOnHover?: boolean;
  border?: boolean;

  onClick?: React.MouseEventHandler<HTMLElement>;
}

/** Value provided via CardContext */
export interface CardContextValue {
  density: CardDensity;
  padding: CardPadding;
  orientation: CardOrientation;
  disabled: boolean;
}

/* ------------------------------------------------------------------ */
/* Subcomponent prop types                                             */
/* ------------------------------------------------------------------ */

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  disablePadding?: boolean;
  divider?: boolean | 'top' | 'bottom';
}

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  disablePadding?: boolean;
  /** Optional divider around the content block */
  divider?: boolean | 'top' | 'bottom';
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end' | 'between';
  disablePadding?: boolean;
  divider?: boolean | 'top' | 'bottom';
}

export interface CardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  disablePadding?: boolean;
  divider?: boolean | 'top' | 'bottom';
  /** horizontal alignment */
  justify?: 'start' | 'center' | 'end' | 'between';
  /** gap between children */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /** allow wrapping to next line */
  wrap?: boolean;
}

/** Media props used in CardMedia.tsx */
export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which media element to render inside (we’ll wrap it) */
  component?: 'img' | 'video' | 'iframe' | React.ElementType;

  // Common media attributes we explicitly proxy to the inner element:
  src?: string;
  alt?: string; // for <img> and generally useful
  loading?: 'eager' | 'lazy'; // <img>
  height?: number | string;
  width?: number | string;

  // <video> attributes
  poster?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;

  /** Remove internal padding */
  disablePadding?: boolean;

  /** Constrain media to an aspect ratio, or 'auto' for natural size */
  ratio?: number | 'auto' | '16:9' | '4:3' | '1:1' | '3:2' | '21:9';

  /** Allow media to bleed to edges */
  bleed?: boolean | 'x' | 'y' | 'top' | 'right' | 'bottom' | 'left';

  /** Corner rounding behavior for just the media box */
  rounded?: boolean | 'top' | 'bottom' | 'left' | 'right' | 'none';

  /** Object-fit behavior */
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/** Visual separator */
export interface CardDividerProps extends React.HTMLAttributes<HTMLHRElement> {
  inset?: boolean | 'start' | 'end' | 'both';
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
}

/** Section with optional inline header */
export interface CardSectionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  disablePadding?: boolean;
  divider?: boolean | 'top' | 'bottom';
  title?: React.ReactNode; // NOT the native tooltip title
  subtitle?: React.ReactNode;
}
