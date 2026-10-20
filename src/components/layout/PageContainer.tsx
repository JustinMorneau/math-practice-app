import type { ReactNode } from 'react';
import { APP_NAME } from '../../app/constants';
import styles from './PageContainer.module.css';

interface PageContainerProps {
  /** Page name, used for the browser tab title and (by default) the visible <h1>. */
  title: string;
  /** Set to false when the page renders its own custom <h1>. */
  showTitle?: boolean;
  children: ReactNode;
}

/**
 * Wraps a page's content with consistent spacing and sets the browser tab
 * title. React 19 hoists the <title> element into the document head.
 */
function PageContainer({ title, showTitle = true, children }: PageContainerProps) {
  const documentTitle = title === APP_NAME ? APP_NAME : `${title} | ${APP_NAME}`;

  return (
    <div className={styles.page}>
      <title>{documentTitle}</title>
      {showTitle ? <h1 className={styles.title}>{title}</h1> : null}
      {children}
    </div>
  );
}

export default PageContainer;
