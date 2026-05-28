import { act } from '@testing-library/react-native';
import { useTransactionStore } from './useTransactionStore';
import { useWorkspaceStore } from '@/modules/workspaces/store/useWorkspaceStore';

describe('useTransactionStore', () => {
  beforeEach(() => {
    // Reset state before each test
    act(() => {
      useTransactionStore.setState({ transactions: [] });
      useWorkspaceStore.setState({ workspaces: [], activeWorkspaceId: null });
    });
  });

  it('adds a transaction correctly with auto-generated metadata', () => {
    act(() => {
      useTransactionStore.getState().addTransaction({
        amount: 1500,
        type: 'income',
        category: 'freelance',
        title: 'Web Dev Work',
        date: '2026-05-15T12:00:00Z',
      });
    });

    const txs = useTransactionStore.getState().transactions;
    expect(txs.length).toBe(1);
    expect(txs[0].amount).toBe(1500);
    expect(txs[0].type).toBe('income');
    expect(txs[0].id).toBeDefined();
    expect(txs[0].monthKey).toBe('2026-05'); // auto-generated
    expect(txs[0].createdAt).toBeDefined();  // auto-generated
  });

  it('updates an existing transaction correctly', () => {
    let id = '';
    act(() => {
      id = useTransactionStore.getState().addTransaction({
        amount: 50,
        type: 'expense',
        category: 'food',
        title: 'Lunch',
        date: new Date().toISOString(),
      });
    });

    // Verify initial insert
    let tx = useTransactionStore.getState().transactions.find(t => t.id === id);
    expect(tx?.amount).toBe(50);
    expect(tx?.title).toBe('Lunch');

    // Update it
    act(() => {
      useTransactionStore.getState().updateTransaction(id, {
        amount: 75,
        title: 'Dinner',
      });
    });

    // Verify update
    tx = useTransactionStore.getState().transactions.find(t => t.id === id);
    expect(tx?.amount).toBe(75);
    expect(tx?.title).toBe('Dinner');
    expect(tx?.type).toBe('expense'); // unmodified field should remain
  });

  it('deletes a transaction correctly', () => {
    let id = '';
    act(() => {
      id = useTransactionStore.getState().addTransaction({
        amount: 200,
        type: 'expense',
        category: 'shopping',
        title: 'Shoes',
        date: new Date().toISOString(),
      });
    });

    expect(useTransactionStore.getState().transactions.length).toBe(1);

    act(() => {
      useTransactionStore.getState().deleteTransaction(id);
    });

    expect(useTransactionStore.getState().transactions.length).toBe(0);
  });
});
