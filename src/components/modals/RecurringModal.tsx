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
import { RecurringExpenseData, CategoryData, AccountData } from '@/types';
import { toInputDateFormat } from '@/utils/date';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { AccountIcon } from '@/components/ui/AccountIcon';

interface RecurringModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    amount: number;
    type: string;
    categoryId: string;
    accountId: string;
    frequency: string;
    dayOfMonth?: number;
    nextDueDate: string;
  }) => Promise<void>;
  editData?: RecurringExpenseData | null;
  categories: CategoryData[];
  accounts: AccountData[];
}

const FREQUENCIES = [
  { label: 'ทุกเดือน', value: 'MONTHLY' },
  { label: 'ทุกสัปดาห์', value: 'WEEKLY' },
  { label: 'ทุกวัน', value: 'DAILY' },
  { label: 'ทุกปี', value: 'YEARLY' },
];

export function RecurringModal({
  visible,
  onClose,
  onSave,
  editData,
  categories,
  accounts,
}: RecurringModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState(toInputDateFormat());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setAmount(String(editData.amount));
      setCategoryId(editData.categoryId);
      setAccountId(editData.accountId);
      setFrequency(editData.frequency);
      setNextDueDate(toInputDateFormat(editData.nextDueDate));
    } else {
      setName('');
      setAmount('');
      const matchCats = categories.filter((c) => c.type === 'EXPENSE');
      if (matchCats.length > 0) setCategoryId(matchCats[0].id);
      if (accounts.length > 0) setAccountId(accounts[0].id);
      setFrequency('MONTHLY');
      setNextDueDate(toInputDateFormat());
    }
    setError('');
  }, [editData, visible, categories, accounts]);

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!name.trim()) {
      setError('กรุณาระบุชื่อรายการ');
      return;
    }
    if (isNaN(num) || num <= 0) {
      setError('กรุณาระบุจำนวนเงินที่มากกว่า 0');
      return;
    }
    if (!categoryId) {
      setError('กรุณาเลือกหมวดหมู่');
      return;
    }
    if (!accountId) {
      setError('กรุณาเลือกบัญชีที่จะตัดเงิน');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        amount: num,
        type: 'EXPENSE',
        categoryId,
        accountId,
        frequency,
        nextDueDate,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editData ? 'แก้ไขรายการประจำ' : 'เพิ่มรายการประจำใหม่'}
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
            {/* Name */}
            <Text style={styles.label}>ชื่อรายการประจำ *</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น ค่าห้อง, Netflix, ค่าเน็ต, ค่างวดรถ..."
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />

            {/* Amount */}
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

            {/* Frequency */}
            <Text style={styles.label}>รอบการตัดเงิน *</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => {
                const isSelected = frequency === f.value;
                return (
                  <TouchableOpacity
                    key={f.value}
                    onPress={() => setFrequency(f.value)}
                    style={[
                      styles.freqBtn,
                      isSelected && { backgroundColor: '#083D77', borderColor: '#083D77' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.freqBtnText,
                        isSelected && { color: '#ffffff', fontWeight: 'bold' },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Account selection */}
            <Text style={styles.label}>บัญชีที่ตัดเงิน *</Text>
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

            {/* Category selection */}
            <Text style={styles.label}>หมวดหมู่ *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {expenseCategories.map((cat) => {
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

            {/* Next due date */}
            <Text style={styles.label}>วันครบกำหนดถัดไป (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={nextDueDate}
              onChangeText={setNextDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
            />

            <View style={{ height: 20 }} />
          </ScrollView>

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
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
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
  freqRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  freqBtnText: {
    fontSize: 12,
    color: '#475569',
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 10,
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
