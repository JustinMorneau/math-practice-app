import axe, { type Result } from 'axe-core';

/** One problem as a readable line, e.g. "label: Form elements must have labels (#name)". */
function describeViolation({ id, help, nodes }: Result): string {
  const where = nodes.map(({ target }) => target.join(' ')).join(', ');
  return `${id}: ${help} (${where})`;
}

/**
 * Accessibility problems axe-core finds in an element, as readable lines
 * (an empty list means none were found).
 *
 * Color contrast is skipped because the test environment cannot compute
 * colors; it is checked in a real browser instead.
 */
export async function findAccessibilityViolations(element: Element): Promise<string[]> {
  const results = await axe.run(element, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map(describeViolation);
}
