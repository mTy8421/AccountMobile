import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAppConfig } from "@/lib/database";
import { AppConfigData } from "@/types";

export default function MoreScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<AppConfigData | null>(null);

  useEffect(() => {
    getAppConfig().then(setConfig).catch(console.error);
  }, []);

  const menuItems = [
    {
      title: "รายงานและสถิติ",
      subtitle: "สรุปภาพรวมรายเดือนและรายปี พร้อมกราฟการเงิน",
      icon: "bar-chart-outline",
      iconColor: "#3b82f6",
      bgColor: "#dbeafe",
      route: "/reports",
    },
    {
      title: "ค่าใช้จ่ายประจำ",
      subtitle: "จัดการรายการบิล recurring รายเดือนและบันทึกอัตโนมัติ",
      icon: "calendar-outline",
      iconColor: "#8b5cf6",
      bgColor: "#ede9fe",
      route: "/recurring",
    },
    {
      title: "จัดการหมวดหมู่",
      subtitle: "เพิ่ม/แก้ไขหมวดหมู่รายรับและรายจ่าย พร้อมไอคอนและสีสัน",
      icon: "pricetags-outline",
      iconColor: "#f59e0b",
      bgColor: "#fef3c7",
      route: "/categories",
    },
    {
      title: "ความปลอดภัย & PIN Lock",
      subtitle: config?.isPinEnabled
        ? "เปิดใช้งานรหัส PIN แล้ว"
        : "ยังไม่ได้ตั้งรหัส PIN",
      icon: "shield-checkmark-outline",
      iconColor: "#10b981",
      bgColor: "#d1fae5",
      route: "/pin-settings",
    },
    {
      title: "สำรองและกู้คืนข้อมูล",
      subtitle: "ส่งออก JSON, นำเข้าข้อมูล, รีเซ็ตข้อมูลเริ่มต้น",
      icon: "cloud-upload-outline",
      iconColor: "#083D77",
      bgColor: "#e0f2fe",
      route: "/backup",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>เมนูเพิ่มเติม & ตั้งค่า</Text>
          <Text style={styles.headerSub}>
            จัดการฟังก์ชันเสริมและการทำงานของระบบ
          </Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.menuCard}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <View
                style={[styles.iconWrap, { backgroundColor: item.bgColor }]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={item.iconColor}
                />
              </View>

              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="phone-portrait-outline" size={24} color="#083D77" />
          </View>
          <Text style={styles.infoTitle}>ระบบบัญชีส่วนตัว (Mobile)</Text>
          <Text style={styles.infoDesc}>
            สถาปัตยกรรม Local-first ทำงานแบบ Offline 100%
            ข้อมูลทั้งหมดจัดเก็บอยู่ในเครื่องของคุณเอง
            ปลอดภัยและเป็นส่วนตัวสูงสุด
          </Text>
          {/* <Text style={styles.versionText}>เวอร์ชัน 1.0.0 (Expo SDK 57)</Text> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  menuContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    marginBottom: 20,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
    marginRight: 8,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  infoIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#083D77",
    marginBottom: 6,
  },
  infoDesc: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 12,
  },
  versionText: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
  },
});
