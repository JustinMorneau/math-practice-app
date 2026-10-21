import { OPERATION_DETAILS } from '../../constants/practiceOptions';
import type { MathOperation } from '../../types';
import styles from './OperationSymbol.module.css';

/**
 * The operation's symbol on its colored counting block. Decorative: pair it
 * with the operation's name, and hide it from screen readers.
 */
function OperationSymbol({ operation }: { operation: MathOperation }) {
  return (
    <span className={`${styles.symbol} ${styles[operation]}`}>
      {OPERATION_DETAILS[operation].symbol}
    </span>
  );
}

export default OperationSymbol;
