import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReportsData } from '@/lib/database';
import { formatCurrency } from '@/utils/currency';
import { formatThaiMonthYear } from '@/utils/date';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

export default function ReportsScreen() {
  const now = new Date();
  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await getReportsData(mode, month, year);
      setData(res);
    } catch (e) {
      console.error('Failed to load reports', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode, month, year]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePrev = () => {
    if (mode === 'monthly') {
      if (month === 1) {
        setMonth(12);
        setYear((y) => y - 1);
      } else {
        setMonth((m) => m - 1);
      }
    } else {
      setYear((y) => y - 1);
    }
  };

  const handleNext = () => {
    if (mode === 'monthly') {
      if (month === 12) {
        setMonth(1);
        setYear((y) => y + 1);
      } else {
        setMonth((m) => m + 1);
      }
    } else {
      setYear((y) => y + 1);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#083D77']} />
      }
    >
      {/* Mode Switcher */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'monthly' && styles.modeTabActive]}
          onPress={() => setMode('monthly')}
        >
          <Text style={[styles.modeTabText, mode === 'monthly' && styles.modeTabTextActive]}>
            รายงานรายเดือน
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'yearly' && styles.modeTabActive]}
          onPress={() => setMode('yearly')}
        >
          <Text style={[styles.modeTabText, mode === 'yearly' && styles.modeTabTextActive]}>
            รายงานรายปี
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Navigator */}
      <View style={styles.dateNavigator}>
        <TouchableOpacity style={styles.navBtn} onPress={handlePrev}>
          <Ionicons name="chevron-back" size={20} color="#083D77" />
        </TouchableOpacity>
        <Text style={styles.navText}>
          {mode === 'monthly' ? formatThaiMonthYear(month, year) : `ปี ${year}`}
        </Text>
        <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
          <Ionicons name="chevron-forward" size={20} color="#083D77" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#083D77" />
        </View>
      ) : (
        <>
          {/* Summary 3 Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.sumCard, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.sumLabel}>รายรับรวม</Text>
              <Text style={[styles.sumAmount, { color: '#16a34a' }]}>
                +{formatCurrency(data?.totalIncome || 0)}
              </Text>
            </View>

            <View style={[styles.sumCard, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.sumLabel}>รายจ่ายรวม</Text>
              <Text style={[styles.sumAmount, { color: '#dc2626' }]}>
                -{formatCurrency(data?.totalExpense || 0)}
              </Text>
            </View>
          </View>

          <View style={styles.netCard}>
            <Text style={styles.netLabel}>ยอดคงเหลือสุทธิ</Text>
            <Text
              style={[
                styles.netAmount,
                (data?.net || 0) >= 0 ? { color: '#16a34a' } : { color: '#dc2626' },
              ]}
            >
              {(data?.net || 0) >= 0 ? '+' : ''}
              {formatCurrency(data?.net || 0)}
            </Text>
          </View>

          {/* Daily or Monthly Breakdown */}
          {mode === 'monthly' && data?.dailyExpenses ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>ยอดรายจ่ายรายวันในเดือนนี้</Text>
              <View style={styles.dailyScroll}>
                {data.dailyExpenses
                  .filter((d: any) => d.amount > 0)
                  .map((d: any, idx: number) => (
                    <View key={idx} style={styles.dailyRow}>
                      <Text style={styles.dailyDate}>{d.dateStr}</Text>
                      <View style={styles.dailyBarWrap}>
                        <View
                          style={[
                            styles.dailyBar,
                            {
                              width: `${Math.min(
                                100,
                                Math.max(5, (d.amount / (data.totalExpense || 1)) * 100)
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.dailyAmount}>
                        -{formatCurrency(d.amount)}
                      </Text>
                    </View>
                  ))}
                {data.dailyExpenses.filter((d: any) => d.amount > 0).length === 0 && (
                  <Text style={styles.emptyNotice}>ไม่มีค่าใช้จ่ายในเดือนนี้</Text>
                )}
              </View>
            </View>
          ) : mode === 'yearly' && data?.monthlyBreakdown ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>สรุปรายเดือนประจำปี {year}</Text>
              {data.monthlyBreakdown.map((m: any, idx: number) => (
                <View key={idx} style={styles.yearMonthRow}>
                  <Text style={styles.ymMonth}>{m.monthName}</Text>
                  <View style={styles.ymValues}>
                    <Text style={styles.ymInc}>+{formatCurrency(m.income)}</Text>
                    <Text style={styles.ymExp}>-{formatCurrency(m.expense)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.ymNet,
                      m.net >= 0 ? { color: '#16a34a' } : { color: '#dc2626' },
                    ]}
                  >
                    {formatCurrency(m.net)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Category Distribution */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>สัดส่วนค่าใช้จ่ายตามหมวดหมู่</Text>
            {data?.categoryExpenses && data.categoryExpenses.length > 0 ? (
              data.categoryExpenses.map((c: any, idx: number) => (
                <View key={idx} style={styles.catRow}>
                  <View
                    style={[
                      styles.catIconWrap,
                      { backgroundColor: `${c.color || '#64748b'}15` },
                    ]}
                  >
                    <CategoryIcon name={c.icon} size={16} color={c.color || '#64748b'} />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <View style={styles.catTextRow}>
                      <Text style={styles.catName}>{c.name}</Text>
                      <Text style={styles.catAmount}>{formatCurrency(c.amount)}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.min(100, Math.max(3, c.percentage))}%`,
                            backgroundColor: c.color || '#3b82f6',
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.catPct}>{c.percentage}%</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyNotice}>ไม่มีข้อมูลค่าใช้จ่าย</Text>
            )}
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: '#083D77',
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  modeTabTextActive: {
    color: '#ffffff',
  },
  dateNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  navText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#083D77',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  sumCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
  },
  sumLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  sumAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  netCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  netAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  dailyScroll: {
    gap: 8,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dailyDate: {
    fontSize: 12,
    color: '#64748b',
    width: 60,
  },
  dailyBarWrap: {
    flex: 1,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  dailyBar: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  dailyAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
    width: 80,
    textAlign: 'right',
  },
  yearMonthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  ymMonth: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    width: 40,
  },
  ymValues: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  ymInc: {
    fontSize: 11,
    color: '#16a34a',
  },
  ymExp: {
    fontSize: 11,
    color: '#dc2626',
  },
  ymNet: {
    fontSize: 12,
    fontWeight: '700',
    width: 85,
    textAlign: 'right',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTextRow: {
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
  catPct: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    width: 32,
    textAlign: 'right',
  },
  emptyNotice: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
