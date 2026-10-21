import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` styles the confirm button for actions that erase data. */
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A modal confirmation dialog (specification section 6.6).
 *
 * Uses the native <dialog> element opened with showModal(), which keeps
 * focus inside the dialog and makes the rest of the page inert. Focus
 * starts on the cancel button, so pressing Enter by accident never erases
 * anything, and returns to the control that opened the dialog when it
 * closes. Escape cancels.
 */
function ConfirmDialog({ open, ...props }: ConfirmDialogProps) {
  return open ? <OpenDialog {...props} /> : null;
}

function OpenDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}: Omit<ConfirmDialogProps, 'open'>) {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        // Environments without showModal (such as some test runners) still show the dialog.
        dialog.setAttribute('open', '');
      }
    }
    cancelRef.current?.focus();

    return () => {
      opener?.focus();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onKeyDown={handleKeyDown}
      // Let React state decide when the dialog closes, rather than the browser.
      onCancel={(event) => event.preventDefault()}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <div id={messageId} className={styles.message}>
        {message}
      </div>
      <div className={styles.actions}>
        <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
