import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  reconcileAllAccounts,
} from '@/lib/database';
import { AccountData } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { AccountIcon } from '@/components/ui/AccountIcon';
import { AccountModal } from '@/components/modals/AccountModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAcc, setEditingAcc] = useState<AccountData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const accs = await getAccounts();
      setAccounts(accs);
    } catch (e) {
      console.error('Failed to load accounts', e);
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

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      await reconcileAllAccounts();
      await loadData();
      Alert.alert('สำเร็จ', 'ปรับปรุงและตรวจสอบยอดเงินทุกบัญชีเรียบร้อยแล้ว 100%');
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถปรับยอดเงินได้');
    } finally {
      setReconciling(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingAcc(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (acc: AccountData) => {
    setEditingAcc(acc);
    setModalVisible(true);
  };

  const handleSaveAccount = async (data: any) => {
    if (editingAcc) {
      await updateAccount(editingAcc.id, data);
    } else {
      await createAccount(data);
    }
    await loadData();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteAccount(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (e) {
      console.error('Failed to delete account', e);
    } finally {
      setDeleting(false);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>บัญชีการเงิน</Text>
          <Text style={styles.headerSub}>จัดการกระเป๋าเงินและบัญชีธนาคาร</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addBtnText}>เพิ่มบัญชี</Text>
        </TouchableOpacity>
      </View>

      {/* Summary & Reconcile Banner */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>ยอดเงินรวมทุกบัญชี</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalBalance)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.reconcileBtn, reconciling && { opacity: 0.6 }]}
            onPress={handleReconcile}
            disabled={reconciling}
          >
            {reconciling ? (
              <ActivityIndicator size="small" color="#083D77" />
            ) : (
              <Ionicons name="sync-outline" size={16} color="#083D77" />
            )}
            <Text style={styles.reconcileBtnText}>
              {reconciling ? 'กำลังปรับยอด...' : 'Reconcile'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.summaryHint}>
          ปุ่ม Reconcile จะคำนวณยอดเงินคงเหลือใหม่จากรายการธุรกรรมทั้งหมดเพื่อให้ตัวเลขแม่นยำ 100%
        </Text>
      </View>

      {/* Account List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#083D77" />
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#083D77']} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.accountCard,
                { borderLeftColor: item.color || '#3b82f6' },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.accountTitleRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${item.color || '#3b82f6'}15` },
                    ]}
                  >
                    <AccountIcon
                      type={item.type}
                      size={20}
                      color={item.color || '#3b82f6'}
                    />
                  </View>
                  <View>
                    <Text style={styles.accountName}>{item.name}</Text>
                    <Text style={styles.accountType}>{item.type}</Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenEdit(item)}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setDeleteId(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.subLabel}>ยอดยกมาเริ่มต้น</Text>
                  <Text style={styles.subValue}>
                    {formatCurrency(item.initialBalance)}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.balanceLabel}>ยอดคงเหลือปัจจุบัน</Text>
                  <Text
                    style={[
                      styles.currentBalanceValue,
                      { color: item.currentBalance >= 0 ? '#0f172a' : '#ef4444' },
                    ]}
                  >
                    {formatCurrency(item.currentBalance)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Account Modal */}
      <AccountModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveAccount}
        editData={editingAcc}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={Boolean(deleteId)}
        title="ลบบัญชีการเงิน"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้? รายการธุรกรรมทั้งหมดที่เกี่ยวข้องกับบัญชีนี้จะถูกลบไปด้วย"
        confirmText="ลบบัญชี"
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
    marginBottom: 14,
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
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#083D77',
    marginTop: 4,
  },
  reconcileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  reconcileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#083D77',
  },
  summaryHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 10,
    lineHeight: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  accountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountTitleRow: {
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
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  accountType: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  subLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  subValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  balanceLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  currentBalanceValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
});
