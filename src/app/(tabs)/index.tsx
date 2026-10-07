import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getDashboardStats,
  getAccounts,
  getCategories,
  createTransaction,
} from '@/lib/database';
import { DashboardStats, AccountData, CategoryData } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatThaiDate } from '@/utils/date';
import { AccountIcon } from '@/components/ui/AccountIcon';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { TransactionModal } from '@/components/modals/TransactionModal';

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, accs, cats] = await Promise.all([
        getDashboardStats(),
        getAccounts(),
        getCategories(),
      ]);
      setStats(s);
      setAccounts(accs);
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
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

  const handleSaveTransaction = async (data: any) => {
    await createTransaction(data);
    await loadData();
  };

  if (loading && !stats) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#083D77" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#083D77']} />
        }
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.appTitle}>ภาพรวมการเงิน</Text>
            <Text style={styles.dateSubtitle}>{formatThaiDate(new Date())}</Text>
          </View>
          <TouchableOpacity
            style={styles.addQuickBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.addQuickBtnText}>บันทึกรายการ</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Total Balance Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>ยอดเงินคงเหลือทั้งหมด</Text>
            <View style={styles.heroIconBox}>
              <Ionicons name="wallet-outline" size={20} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.heroAmount}>
            {formatCurrency(stats?.totalBalance || 0)}
          </Text>
          <Text style={styles.heroAccountsCount}>
            รวม {stats?.accounts.length || 0} บัญชีที่เปิดใช้งาน
          </Text>
        </View>

        {/* 2. Monthly Summary Grid */}
        <View style={styles.metricsRow}>
          {/* Income */}
          <View style={[styles.metricCard, styles.incomeCard]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>รายรับเดือนนี้</Text>
              <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="arrow-up" size={16} color="#16a34a" />
              </View>
            </View>
            <Text style={[styles.metricAmount, { color: '#16a34a' }]}>
              +{formatCurrency(stats?.monthIncome || 0)}
            </Text>
            <Text style={styles.metricSub}>
              {stats?.monthTransactionCount || 0} รายการ
            </Text>
          </View>

          {/* Expense */}
          <View style={[styles.metricCard, styles.expenseCard]}>
            <View style={styles.metricTop}>
              <Text style={styles.metricLabel}>รายจ่ายเดือนนี้</Text>
              <View style={[styles.metricIconWrap, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="arrow-down" size={16} color="#dc2626" />
              </View>
            </View>
            <Text style={[styles.metricAmount, { color: '#dc2626' }]}>
              -{formatCurrency(stats?.monthExpense || 0)}
            </Text>
            <Text style={styles.metricSub}>
              {stats?.categoryExpenses.length || 0} หมวดหมู่
            </Text>
          </View>
        </View>

        {/* Net Monthly Balance */}
        <View style={styles.netSavingsCard}>
          <Text style={styles.netLabel}>ยอดคงเหลือสุทธิเดือนนี้:</Text>
          <Text
            style={[
              styles.netAmount,
              (stats?.monthNet || 0) >= 0 ? { color: '#16a34a' } : { color: '#dc2626' },
            ]}
          >
            {(stats?.monthNet || 0) >= 0 ? '+' : ''}
            {formatCurrency(stats?.monthNet || 0)}
          </Text>
        </View>

        {/* 3. Accounts Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>บัญชีของฉัน</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/accounts' as any)}>
            <Text style={styles.sectionLink}>จัดการบัญชี</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.accountsScroll}
        >
          {accounts.map((acc) => (
            <View
              key={acc.id}
              style={[
                styles.accountMiniCard,
                { borderLeftColor: acc.color || '#3b82f6' },
              ]}
            >
              <View style={styles.accountCardTop}>
                <AccountIcon
                  type={acc.type}
                  size={16}
                  color={acc.color || '#3b82f6'}
                />
                <Text style={styles.accountName} numberOfLines={1}>
                  {acc.name}
                </Text>
              </View>
              <Text style={styles.accountBalance}>
                {formatCurrency(acc.currentBalance)}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* 4. Category Expenses Breakdown */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>สัดส่วนรายจ่ายตามหมวดหมู่</Text>
          <Text style={styles.sectionSub}>เดือนนี้</Text>
        </View>
        {stats?.categoryExpenses && stats.categoryExpenses.length > 0 ? (
          <View style={styles.cardBox}>
            {stats.categoryExpenses.map((cat, idx) => (
              <View key={idx} style={styles.catRow}>
                <View style={styles.catLeft}>
                  <View
                    style={[
                      styles.catIconWrap,
                      { backgroundColor: `${cat.color || '#64748b'}20` },
                    ]}
                  >
                    <CategoryIcon
                      name={cat.icon}
                      size={16}
                      color={cat.color || '#64748b'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.catNameRow}>
                      <Text style={styles.catName}>{cat.categoryName}</Text>
                      <Text style={styles.catAmount}>{formatCurrency(cat.amount)}</Text>
                    </View>
                    {/* Progress Bar */}
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                            backgroundColor: cat.color || '#3b82f6',
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
                <Text style={styles.catPercent}>{cat.percentage}%</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>ยังไม่มีรายการค่าใช้จ่ายในเดือนนี้</Text>
          </View>
        )}

        {/* 5. Monthly Trend Summary (Last 6 Months) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>แนวโน้มรายรับ-รายจ่าย 6 เดือน</Text>
          <TouchableOpacity onPress={() => router.push('/reports' as any)}>
            <Text style={styles.sectionLink}>ดูรายงาน</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardBox}>
          {stats?.monthlyTrend.map((m, idx) => (
            <View key={idx} style={styles.trendRow}>
              <Text style={styles.trendMonth}>{m.month}</Text>
              <View style={styles.trendValues}>
                <Text style={styles.trendIncome}>+{formatCurrency(m.income)}</Text>
                <Text style={styles.trendExpense}>-{formatCurrency(m.expense)}</Text>
                <Text
                  style={[
                    styles.trendNet,
                    m.net >= 0 ? { color: '#16a34a' } : { color: '#dc2626' },
                  ]}
                >
                  คงเหลือ: {formatCurrency(m.net)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 6. Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>รายการล่าสุด</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions' as any)}>
            <Text style={styles.sectionLink}>ดูทั้งหมด</Text>
          </TouchableOpacity>
        </View>
        {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
          <View style={styles.cardBox}>
            {stats.recentTransactions.map((tx) => {
              const isExpense = tx.type === 'EXPENSE';
              const isIncome = tx.type === 'INCOME';
              return (
                <View key={tx.id} style={styles.txRow}>
                  <View
                    style={[
                      styles.txIconBox,
                      isExpense
                        ? { backgroundColor: '#fee2e2' }
                        : isIncome
                        ? { backgroundColor: '#dcfce7' }
                        : { backgroundColor: '#dbeafe' },
                    ]}
                  >
                    {isExpense ? (
                      <CategoryIcon
                        name={tx.category?.icon || 'Tag'}
                        size={18}
                        color="#dc2626"
                      />
                    ) : isIncome ? (
                      <CategoryIcon
                        name={tx.category?.icon || 'Tag'}
                        size={18}
                        color="#16a34a"
                      />
                    ) : (
                      <Ionicons name="swap-horizontal" size={18} color="#2563eb" />
                    )}
                  </View>

                  <View style={styles.txDetail}>
                    <Text style={styles.txTitle}>
                      {tx.type === 'TRANSFER'
                        ? `โอนเงิน: ${tx.account?.name} ➔ ${tx.toAccount?.name}`
                        : tx.category?.name || 'ไม่มีหมวดหมู่'}
                    </Text>
                    <Text style={styles.txSub}>
                      {tx.account?.name} • {formatThaiDate(tx.date)}
                      {tx.note ? ` • ${tx.note}` : ''}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.txAmount,
                      isExpense
                        ? { color: '#dc2626' }
                        : isIncome
                        ? { color: '#16a34a' }
                        : { color: '#2563eb' },
                    ]}
                  >
                    {isExpense ? '-' : isIncome ? '+' : ''}
                    {formatCurrency(tx.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>ยังไม่มีรายการธุรกรรม</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Transaction Modal */}
      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTransaction}
        accounts={accounts}
        categories={categories}
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
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  dateSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#083D77',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addQuickBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: '#083D77',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#083D77',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  heroIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 8,
  },
  heroAccountsCount: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  incomeCard: {},
  expenseCard: {},
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  metricIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  metricSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  netSavingsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  netLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  netAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748b',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#083D77',
  },
  accountsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  accountMiniCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    width: 140,
  },
  accountCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  accountName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  catLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 12,
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  catAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  catPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    width: 34,
    textAlign: 'right',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  trendMonth: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    width: 60,
  },
  trendValues: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  trendIncome: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  trendExpense: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  trendNet: {
    fontSize: 11,
    fontWeight: '600',
    width: 100,
    textAlign: 'right',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txDetail: {
    flex: 1,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  txSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
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
