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
import { BudgetData, CategoryData } from '@/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

interface BudgetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    categoryId: string;
    amount: number;
    month: number;
    year: number;
  }) => Promise<void>;
  editData?: BudgetData | null;
  categories: CategoryData[];
  month: number;
  year: number;
}

export function BudgetModal({
  visible,
  onClose,
  onSave,
  editData,
  categories,
  month,
  year,
}: BudgetModalProps) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  useEffect(() => {
    if (editData) {
      setCategoryId(editData.categoryId);
      setAmount(String(editData.amount));
    } else {
      const matchCats = categories.filter((c) => c.type === 'EXPENSE');
      if (matchCats.length > 0) {
        setCategoryId(matchCats[0].id);
      }
      setAmount('');
    }
    setError('');
  }, [editData, visible, categories]);

  const handleSubmit = async () => {
    const num = parseFloat(amount);
    if (!categoryId) {
      setError('กรุณาเลือกหมวดหมู่');
      return;
    }
    if (isNaN(num) || num <= 0) {
      setError('กรุณาระบุงบประมาณที่มากกว่า 0');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave({
        categoryId,
        amount: num,
        month,
        year,
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
              {editData ? 'แก้ไขงบประมาณ' : 'ตั้งงบประมาณใหม่'}
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
            {/* Category selection */}
            <Text style={styles.label}>เลือกหมวดหมู่รายจ่าย *</Text>
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

            {/* Amount input */}
            <Text style={styles.label}>วงเงินงบประมาณ (บาท) *</Text>
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
                {loading ? 'กำลังบันทึก...' : 'บันทึกงบประมาณ'}
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
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 14,
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
