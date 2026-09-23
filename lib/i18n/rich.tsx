import { Fragment, type ReactNode } from 'react';

/**
 * Renders a translated string where `**text**` marks bold parts, so a sentence
 * with emphasis stays one translatable unit instead of being split into pieces.
 */
export function rich(text: string, strongProps?: React.HTMLAttributes<HTMLElement>): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} {...strongProps}>{part.slice(2, -2)}</strong>
      : <Fragment key={i}>{part}</Fragment>,
  );
}
