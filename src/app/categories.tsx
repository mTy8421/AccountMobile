import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/database';
import { CategoryData } from '@/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CategoryModal } from '@/components/modals/CategoryModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const list = await getCategories();
      setCategories(list);
    } catch (e) {
      console.error('Failed to load categories', e);
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

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleOpenAdd = () => {
    setEditingCat(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (c: CategoryData) => {
    setEditingCat(c);
    setModalVisible(true);
  };

  const handleSave = async (data: any) => {
    if (editingCat) {
      await updateCategory(editingCat.id, data);
    } else {
      await createCategory(data);
    }
    await loadData();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (e) {
      console.error('Failed to delete category', e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with Add Button */}
      <View style={styles.topBar}>
        <View style={styles.tabSwitch}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'EXPENSE' && styles.tabBtnActive]}
            onPress={() => setActiveTab('EXPENSE')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'EXPENSE' && styles.tabBtnTextActive,
              ]}
            >
              หมวดหมู่รายจ่าย
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'INCOME' && styles.tabBtnActive]}
            onPress={() => setActiveTab('INCOME')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'INCOME' && styles.tabBtnTextActive,
              ]}
            >
              หมวดหมู่รายรับ
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>เพิ่มหมวดหมู่</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#083D77" />
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#083D77']} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetags-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>ไม่มีหมวดหมู่</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: `${item.color || '#64748b'}20` },
                  ]}
                >
                  <CategoryIcon
                    name={item.icon}
                    size={22}
                    color={item.color || '#64748b'}
                  />
                </View>
                <View>
                  <Text style={styles.catName}>{item.name}</Text>
                  <View style={styles.colorRow}>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: item.color || '#64748b' },
                      ]}
                    />
                    <Text style={styles.colorHex}>{item.color || '#64748b'}</Text>
                  </View>
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
          )}
        />
      )}

      {/* Category Modal */}
      <CategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        editData={editingCat}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        visible={Boolean(deleteId)}
        title="ลบหมวดหมู่"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? รายการธุรกรรมเดิมจะยังคงอยู่แต่จะไม่มีหมวดหมู่"
        confirmText="ลบหมวดหมู่"
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
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#083D77',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#083D77',
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorHex: {
    fontSize: 11,
    color: '#94a3b8',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
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
});
