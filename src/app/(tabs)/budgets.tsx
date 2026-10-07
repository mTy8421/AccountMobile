import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getBudgets,
  getCategories,
  setBudget,
  deleteBudget,
} from '@/lib/database';
import { BudgetData, CategoryData } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatThaiMonthYear } from '@/utils/date';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { BudgetModal } from '@/components/modals/BudgetModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export default function BudgetsScreen() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [bList, cList] = await Promise.all([
        getBudgets(month, year),
        getCategories(),
      ]);
      setBudgets(bList);
      setCategories(cList);
    } catch (e) {
      console.error('Failed to load budgets', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (b: BudgetData) => {
    setEditingBudget(b);
    setModalVisible(true);
  };

  const handleSaveBudget = async (data: any) => {
    await setBudget(data);
    await loadData();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteBudget(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (e) {
      console.error('Failed to delete budget', e);
    } finally {
      setDeleting(false);
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const totalPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>งบประมาณ</Text>
          <Text style={styles.headerSub}>ควบคุมและติดตามการใช้จ่ายรายเดือน</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addBtnText}>ตั้งงบประมาณ</Text>
        </TouchableOpacity>
      </View>

      {/* Month Navigator */}
      <View style={styles.monthNavigator}>
        <TouchableOpacity style={styles.arrowBtn} onPress={handlePrevMonth}>
          <Ionicons name="chevron-back" size={20} color="#083D77" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{formatThaiMonthYear(month, year)}</Text>
        <TouchableOpacity style={styles.arrowBtn} onPress={handleNextMonth}>
          <Ionicons name="chevron-forward" size={20} color="#083D77" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>งบประมาณรวม</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalBudget)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>ใช้ไปแล้ว</Text>
            <Text style={[styles.spentAmount, totalSpent > totalBudget && { color: '#ef4444' }]}>
              {formatCurrency(totalSpent)}
            </Text>
          </View>
        </View>

        {/* Global Progress Bar */}
        <View style={styles.globalProgressTrack}>
          <View
            style={[
              styles.globalProgressBar,
              {
                width: `${Math.min(100, Math.max(0, totalPercentage))}%`,
                backgroundColor: totalPercentage >= 100 ? '#ef4444' : totalPercentage >= 80 ? '#f59e0b' : '#10b981',
              },
            ]}
          />
        </View>

        <View style={styles.summaryBottom}>
          <Text style={styles.summarySub}>
            ใช้ไปแล้ว {totalPercentage}% ของงบประมาณทั้งหมด
          </Text>
          <Text style={styles.remainingText}>
            เหลือ {formatCurrency(Math.max(0, totalBudget - totalSpent))}
          </Text>
        </View>
      </View>

      {/* Budgets List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#083D77" />
        </View>
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#083D77']} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pie-chart-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>ยังไม่ได้ตั้งงบประมาณสำหรับเดือนนี้</Text>
              <Text style={styles.emptySub}>
                {'แตะปุ่ม "ตั้งงบประมาณ" เพื่อกำหนดเพดานค่าใช้จ่าย'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const spent = item.spent || 0;
            const pct = item.percentage || 0;
            const isOver = spent > item.amount;
            const isWarning = pct >= 80 && !isOver;

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.catLeft}>
                    <View
                      style={[
                        styles.catIconWrap,
                        { backgroundColor: `${item.category?.color || '#3b82f6'}15` },
                      ]}
                    >
                      <CategoryIcon
                        name={item.category?.icon}
                        size={18}
                        color={item.category?.color || '#3b82f6'}
                      />
                    </View>
                    <View>
                      <Text style={styles.catName}>{item.category?.name}</Text>
                      {isOver ? (
                        <View style={styles.alertBadge}>
                          <Ionicons name="alert-circle" size={12} color="#dc2626" />
                          <Text style={styles.alertText}>เกินงบ {formatCurrency(spent - item.amount)}</Text>
                        </View>
                      ) : isWarning ? (
                        <View style={[styles.alertBadge, { backgroundColor: '#fef3c7' }]}>
                          <Ionicons name="warning" size={12} color="#d97706" />
                          <Text style={[styles.alertText, { color: '#d97706' }]}>ใกล้เต็ม {pct}%</Text>
                        </View>
                      ) : (
                        <Text style={styles.remainingSub}>
                          เหลือ {formatCurrency(item.remaining || 0)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleOpenEdit(item)}
                    >
                      <Ionicons name="pencil-outline" size={16} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => setDeleteId(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(100, Math.max(0, pct))}%`,
                        backgroundColor: isOver ? '#ef4444' : isWarning ? '#f59e0b' : item.category?.color || '#3b82f6',
                      },
                    ]}
                  />
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.cardSpent}>
                    ใช้ไป {formatCurrency(spent)}
                  </Text>
                  <Text style={styles.cardLimit}>
                    งบ {formatCurrency(item.amount)} ({pct}%)
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Budget Modal */}
      <BudgetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveBudget}
        editData={editingBudget}
        categories={categories}
        month={month}
        year={year}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={Boolean(deleteId)}
        title="ลบงบประมาณ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบงบประมาณของหมวดหมู่นี้?"
        confirmText="ลบงบประมาณ"
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
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  arrowBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  monthText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#083D77',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  spentAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#083D77',
    marginTop: 2,
  },
  globalProgressTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  globalProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  summaryBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summarySub: {
    fontSize: 12,
    color: '#64748b',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  catIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  remainingSub: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  alertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardSpent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cardLimit: {
    fontSize: 12,
    color: '#64748b',
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
