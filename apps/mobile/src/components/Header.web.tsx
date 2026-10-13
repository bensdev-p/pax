import { HeaderBar, type HeaderProps } from './HeaderBar';

/** Web (testing only) keeps Pax's own header. */
export function Header(props: HeaderProps) {
  return <HeaderBar {...props} />;
}

/** Pax's own header draws on web, so screens keep their usual layout. */
export const usesNativeHeader = (_props: HeaderProps) => false;
