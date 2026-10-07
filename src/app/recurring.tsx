import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getRecurringExpenses,
  getCategories,
  getAccounts,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  processRecurringExpense,
} from '@/lib/database';
import { RecurringExpenseData, CategoryData, AccountData } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatThaiDate } from '@/utils/date';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { AccountIcon } from '@/components/ui/AccountIcon';
import { RecurringModal } from '@/components/modals/RecurringModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export default function RecurringScreen() {
  const [items, setItems] = useState<RecurringExpenseData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringExpenseData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [rList, cList, aList] = await Promise.all([
        getRecurringExpenses(),
        getCategories(),
        getAccounts(),
      ]);
      setItems(rList);
      setCategories(cList);
      setAccounts(aList);
    } catch (e) {
      console.error('Failed to load recurring items', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (item: RecurringExpenseData) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleSave = async (data: any) => {
    if (editingItem) {
      await updateRecurringExpense(editingItem.id, data);
    } else {
      await createRecurringExpense(data);
    }
    await loadData();
  };

  const handleProcess = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      await processRecurringExpense(id);
      await loadData();
      Alert.alert('สำเร็จ', `บันทึกรายการ "${name}" ลงในธุรกรรมเรียบร้อยแล้ว`);
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกรายการได้');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteRecurringExpense(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (e) {
      console.error('Failed to delete recurring item', e);
    } finally {
      setDeleting(false);
    }
  };

  const getFreqLabel = (f: string) => {
    switch (f) {
      case 'DAILY':
        return 'ทุกวัน';
      case 'WEEKLY':
        return 'ทุกสัปดาห์';
      case 'MONTHLY':
        return 'ทุกเดือน';
      case 'YEARLY':
        return 'ทุกปี';
      default:
        return 'ทุกเดือน';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header action */}
      <View style={styles.topBar}>
        <Text style={styles.subText}>
          ค่าใช้จ่ายประจำ เช่น ค่าห้อง, ค่าเน็ต, Netflix, บิลรายเดือน
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>เพิ่มรายการประจำ</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#083D77" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#083D77']} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>ไม่มีรายการค่าใช้จ่ายประจำ</Text>
              <Text style={styles.emptySub}>{'แตะ "เพิ่มรายการประจำ" เพื่อบันทึกบิลที่ต้องจ่ายซ้ำๆ'}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${item.category?.color || '#3b82f6'}15` },
                    ]}
                  >
                    <CategoryIcon
                      name={item.category?.icon}
                      size={20}
                      color={item.category?.color || '#3b82f6'}
                    />
                  </View>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.freqBadge}>
                      <Text style={styles.freqText}>{getFreqLabel(item.frequency)}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.amountText}>
                  -{formatCurrency(item.amount)}
                </Text>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <AccountIcon
                    type={item.account?.type || 'BANK'}
                    size={14}
                    color="#64748b"
                  />
                  <Text style={styles.metaText}>{item.account?.name}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color="#64748b" />
                  <Text style={styles.metaText}>
                    ครบกำหนด: {formatThaiDate(item.nextDueDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[
                    styles.runBtn,
                    processingId === item.id && { opacity: 0.6 },
                  ]}
                  onPress={() => handleProcess(item.id, item.name)}
                  disabled={processingId === item.id}
                >
                  {processingId === item.id ? (
                    <ActivityIndicator size="small" color="#083D77" />
                  ) : (
                    <Ionicons name="play" size={14} color="#083D77" />
                  )}
                  <Text style={styles.runBtnText}>บันทึกทันที</Text>
                </TouchableOpacity>

                <View style={styles.rightActions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleOpenEdit(item)}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => setDeleteId(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Recurring Modal */}
      <RecurringModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        editData={editingItem}
        categories={categories}
        accounts={accounts}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={Boolean(deleteId)}
        title="ลบรายการประจำ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการค่าใช้จ่ายประจำนี้?"
        confirmText="ลบรายการ"
        isDestructive
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
    marginRight: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#083D77',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  freqBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  freqText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#dc2626',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  runBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#083D77',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
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
});
