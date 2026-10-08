import type { ComponentProps } from 'react';

/** Standard document navigation keeps direct URLs and browser history working
 * when the current Vinext production client router fails to initialize. */
export default function NativeLink(props: ComponentProps<'a'>) {
  return <a {...props} />;
}
