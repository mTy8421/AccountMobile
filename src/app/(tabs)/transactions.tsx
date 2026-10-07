import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getTransactions,
  getAccounts,
  getCategories,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/lib/database';
import { TransactionData, AccountData, CategoryData } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatThaiDate } from '@/utils/date';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { TransactionModal } from '@/components/modals/TransactionModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState('ALL');

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [txResult, accs, cats] = await Promise.all([
        getTransactions({
          search,
          type: type === 'ALL' ? undefined : type,
          accountId: selectedAccountId === 'ALL' ? undefined : selectedAccountId,
          limit: 100,
        }),
        getAccounts(),
        getCategories(),
      ]);

      setTransactions(txResult.transactions);
      setAccounts(accs);
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load transactions', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, type, selectedAccountId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenAdd = () => {
    setEditingTx(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (tx: TransactionData) => {
    setEditingTx(tx);
    setModalVisible(true);
  };

  const handleSaveTransaction = async (data: any) => {
    if (editingTx) {
      await updateTransaction(editingTx.id, data);
    } else {
      await createTransaction(data);
    }
    await loadData();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteTransaction(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (e) {
      console.error('Failed to delete transaction', e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>รายการธุรกรรม</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addBtnText}>เพิ่มรายการ</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาตามบันทึก, หมวดหมู่, หรือบัญชี..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs (ALL, EXPENSE, INCOME, TRANSFER) */}
      <View style={styles.typeTabs}>
        {[
          { label: 'ทั้งหมด', value: 'ALL' },
          { label: 'รายจ่าย', value: 'EXPENSE' },
          { label: 'รายรับ', value: 'INCOME' },
          { label: 'โอนเงิน', value: 'TRANSFER' },
        ].map((t) => {
          const isSelected = type === t.value;
          return (
            <TouchableOpacity
              key={t.value}
              onPress={() => setType(t.value)}
              style={[
                styles.typeTab,
                isSelected && styles.typeTabActive,
              ]}
            >
              <Text
                style={[
                  styles.typeTabText,
                  isSelected && styles.typeTabTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Account filter chips */}
      <View style={{ marginBottom: 10, paddingHorizontal: 16 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'ALL', name: 'ทุกบัญชี' }, ...accounts]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedAccountId === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedAccountId(item.id)}
                style={[
                  styles.accountChip,
                  isSelected && styles.accountChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.accountChipText,
                    isSelected && styles.accountChipTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#083D77" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#083D77']} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>ไม่พบรายการธุรกรรม</Text>
              <Text style={styles.emptySub}>
                {search ? 'ลองเปลี่ยนคำค้นหา' : 'แตะปุ่ม "เพิ่มรายการ" เพื่อเริ่มต้นบันทึก'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isExpense = item.type === 'EXPENSE';
            const isIncome = item.type === 'INCOME';
            const isTransfer = item.type === 'TRANSFER';

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handleOpenEdit(item)}
              >
                <View
                  style={[
                    styles.iconBox,
                    isExpense
                      ? { backgroundColor: '#fee2e2' }
                      : isIncome
                      ? { backgroundColor: '#dcfce7' }
                      : { backgroundColor: '#dbeafe' },
                  ]}
                >
                  {isExpense ? (
                    <CategoryIcon
                      name={item.category?.icon || 'Tag'}
                      size={20}
                      color="#dc2626"
                    />
                  ) : isIncome ? (
                    <CategoryIcon
                      name={item.category?.icon || 'Tag'}
                      size={20}
                      color="#16a34a"
                    />
                  ) : (
                    <Ionicons name="swap-horizontal" size={20} color="#2563eb" />
                  )}
                </View>

                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {isTransfer
                      ? `โอนเงิน: ${item.account?.name} ➔ ${item.toAccount?.name}`
                      : item.category?.name || 'ไม่มีหมวดหมู่'}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {item.account?.name} • {formatThaiDate(item.date)}
                    {item.note ? ` • ${item.note}` : ''}
                  </Text>
                </View>

                <View style={styles.cardRight}>
                  <Text
                    style={[
                      styles.cardAmount,
                      isExpense
                        ? { color: '#dc2626' }
                        : isIncome
                        ? { color: '#16a34a' }
                        : { color: '#2563eb' },
                    ]}
                  >
                    {isExpense ? '-' : isIncome ? '+' : ''}
                    {formatCurrency(item.amount)}
                  </Text>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => setDeleteId(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenAdd}>
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Transaction Modal */}
      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTransaction}
        editData={editingTx}
        accounts={accounts}
        categories={categories}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={Boolean(deleteId)}
        title="ลบรายการธุรกรรม"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการธุรกรรมนี้? ยอดเงินในบัญชีจะถูกปรับปรุงให้อัตโนมัติ"
        confirmText="ลบรายการ"
        isDestructive
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#083D77',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  typeTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  typeTabActive: {
    backgroundColor: '#083D77',
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  typeTabTextActive: {
    color: '#ffffff',
  },
  accountChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  accountChipActive: {
    backgroundColor: '#083D77',
    borderColor: '#083D77',
  },
  accountChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  accountChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardMain: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 24 : 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#083D77',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#083D77',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
