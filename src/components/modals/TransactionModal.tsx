import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccountData, CategoryData, TransactionData } from '@/types';
import { toInputDateFormat } from '@/utils/date';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { AccountIcon } from '@/components/ui/AccountIcon';

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    accountId: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    amount: number;
    date: string;
    note?: string | null;
  }) => Promise<void>;
  editData?: TransactionData | null;
  accounts: AccountData[];
  categories: CategoryData[];
}

export function TransactionModal({
  visible,
  onClose,
  onSave,
  editData,
  accounts,
  categories,
}: TransactionModalProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(toInputDateFormat());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editData) {
      setType(editData.type as any);
      setAmount(String(editData.amount));
      setAccountId(editData.accountId);
      setToAccountId(editData.toAccountId || '');
      setCategoryId(editData.categoryId || '');
      setDate(toInputDateFormat(editData.date));
      setNote(editData.note || '');
    } else {
      setType('EXPENSE');
      setAmount('');
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        if (accounts.length > 1) {
          setToAccountId(accounts[1].id);
        }
      }
      const defaultCats = categories.filter((c) => c.type === 'EXPENSE');
      if (defaultCats.length > 0) {
        setCategoryId(defaultCats[0].id);
      }
      setDate(toInputDateFormat());
      setNote('');
    }
    setError('');
  }, [editData, visible, accounts, categories]);

  // Adjust category when type changes
  const handleTypeChange = (newType: 'EXPENSE' | 'INCOME' | 'TRANSFER') => {
    setType(newType);
    if (newType !== 'TRANSFER') {
      const matchCats = categories.filter((c) => c.type === newType);
      if (matchCats.length > 0) {
        setCategoryId(matchCats[0].id);
      } else {
        setCategoryId('');
      }
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('กรุณาระบุจำนวนเงินที่มากกว่า 0');
      return;
    }
    if (!accountId) {
      setError('กรุณาเลือกบัญชี');
      return;
    }
    if (type === 'TRANSFER') {
      if (!toAccountId) {
        setError('กรุณาเลือกบัญชีปลายทาง');
        return;
      }
      if (accountId === toAccountId) {
        setError('บัญชีต้นทางและปลายทางต้องไม่เป็นบัญชีเดียวกัน');
        return;
      }
    }

    setLoading(true);
    setError('');
    try {
      await onSave({
        accountId,
        toAccountId: type === 'TRANSFER' ? toAccountId : null,
        categoryId: type === 'TRANSFER' ? null : categoryId || null,
        type,
        amount: num,
        date,
        note: note.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editData ? 'แก้ไขรายการธุรกรรม' : 'บันทึกรายการธุรกรรม'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Type selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'EXPENSE' && { backgroundColor: '#fee2e2', borderColor: '#ef4444' },
                ]}
                onPress={() => handleTypeChange('EXPENSE')}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={16}
                  color={type === 'EXPENSE' ? '#dc2626' : '#64748b'}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    type === 'EXPENSE' && { color: '#dc2626', fontWeight: 'bold' },
                  ]}
                >
                  รายจ่าย
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'INCOME' && { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
                ]}
                onPress={() => handleTypeChange('INCOME')}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={16}
                  color={type === 'INCOME' ? '#16a34a' : '#64748b'}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    type === 'INCOME' && { color: '#16a34a', fontWeight: 'bold' },
                  ]}
                >
                  รายรับ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'TRANSFER' && { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
                ]}
                onPress={() => handleTypeChange('TRANSFER')}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={16}
                  color={type === 'TRANSFER' ? '#2563eb' : '#64748b'}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    type === 'TRANSFER' && { color: '#2563eb', fontWeight: 'bold' },
                  ]}
                >
                  โอนเงิน
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <Text style={styles.label}>จำนวนเงิน (บาท) *</Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.currencySymbol}>฿</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Account selection */}
            <Text style={styles.label}>
              {type === 'TRANSFER' ? 'จากบัญชี (ต้นทาง) *' : 'บัญชีที่ใช้ *'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {accounts.map((acc) => {
                const isSelected = accountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setAccountId(acc.id)}
                    style={[
                      styles.chip,
                      isSelected && {
                        backgroundColor: '#083D77',
                        borderColor: '#083D77',
                      },
                    ]}
                  >
                    <AccountIcon
                      type={acc.type}
                      size={14}
                      color={isSelected ? '#ffffff' : '#475569'}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && { color: '#ffffff', fontWeight: 'bold' },
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* If transfer, Destination account */}
            {type === 'TRANSFER' ? (
              <>
                <Text style={styles.label}>ไปยังบัญชี (ปลายทาง) *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => {
                      const isSelected = toAccountId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          onPress={() => setToAccountId(acc.id)}
                          style={[
                            styles.chip,
                            isSelected && {
                              backgroundColor: '#2563eb',
                              borderColor: '#2563eb',
                            },
                          ]}
                        >
                          <AccountIcon
                            type={acc.type}
                            size={14}
                            color={isSelected ? '#ffffff' : '#475569'}
                          />
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && { color: '#ffffff', fontWeight: 'bold' },
                            ]}
                          >
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </>
            ) : null}

            {/* If Expense or Income: Category selection */}
            {type !== 'TRANSFER' ? (
              <>
                <Text style={styles.label}>หมวดหมู่</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {filteredCategories.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setCategoryId(cat.id)}
                        style={[
                          styles.chip,
                          isSelected && {
                            backgroundColor: cat.color || '#3b82f6',
                            borderColor: cat.color || '#3b82f6',
                          },
                        ]}
                      >
                        <CategoryIcon
                          name={cat.icon}
                          size={14}
                          color={isSelected ? '#ffffff' : '#475569'}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && { color: '#ffffff', fontWeight: 'bold' },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}

            {/* Date input */}
            <Text style={styles.label}>วันที่ (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
            />

            {/* Note input */}
            <Text style={styles.label}>บันทึกช่วยจำ (Note)</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              value={note}
              onChangeText={setNote}
              placeholder="เช่น อาหารกลางวัน, เงินเดือน, ค่าโอน..."
              placeholderTextColor="#94a3b8"
              multiline
            />

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>
                {loading ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeBtnText: {
    fontSize: 13,
    color: '#475569',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#083D77',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    paddingVertical: 10,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    color: '#334155',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#083D77',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
