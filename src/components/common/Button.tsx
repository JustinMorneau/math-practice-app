import type { ComponentProps } from 'react';
import { Link, type LinkProps } from 'react-router';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'medium' | 'large';

interface ButtonStyleProps {
  /**
   * `primary` for the main action on a screen, `danger` for actions that
   * erase data, and `secondary` for everything else.
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function buttonClassName(
  { variant = 'primary', size = 'medium' }: ButtonStyleProps,
  extraClassName?: string,
): string {
  return [styles.button, styles[variant], styles[size], extraClassName].filter(Boolean).join(' ');
}

/** All native button props, including `ref`. */
export interface ButtonProps extends ComponentProps<'button'>, ButtonStyleProps {}

/** A button that performs an action on the current page. Defaults to `type="button"`. */
export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClassName({ variant, size }, className)} {...rest} />;
}

export interface ButtonLinkProps extends LinkProps, ButtonStyleProps {}

/**
 * A link that looks like a button. Use it when the control navigates to
 * another page, so screen readers correctly announce it as a link.
 */
export function ButtonLink({ variant, size, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClassName({ variant, size }, className)} {...rest} />;
}
