
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import {
  Category,
  Course,
  getCategories,
  getCourses,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/api";

function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function confirmDelete(message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(message)) onConfirm();
  } else {
    Alert.alert("Xác nhận xóa", message, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: onConfirm,
      },
    ]);
  }
}

export default function CategoriesScreen() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");

      const [categoryData, courseData] = await Promise.all([
        getCategories(),
        getCourses(),
      ]);

      setCategories(categoryData);
      setCourses(courseData);
    } catch (e) {
      console.error(e);
      setError("Không thể tải dữ liệu từ MockAPI.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const countCourses = (categoryId: string) => {
    return courses.filter(
      (course) =>
        String(course.categoryId) === String(categoryId)
    ).length;
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setDescription("");
  };

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setShowForm(true);
  };

  const openEdit = (category: Category) => {
    setEditingId(String(category.id));
    setName(category.name);
    setDescription(category.description || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName || !trimmedDescription) {
      notify(
        "Thiếu thông tin",
        "Vui lòng nhập tên và mô tả danh mục."
      );
      return;
    }

    const duplicate = categories.some(
      (cat) =>
        cat.name.trim().toLowerCase() ===
          trimmedName.toLowerCase() &&
        String(cat.id) !== editingId
    );

    if (duplicate) {
      notify("Trùng tên", "Tên danh mục này đã tồn tại.");
      return;
    }

    setSaving(true);

    try {
      const data = {
        name: trimmedName,
        description: trimmedDescription,
      };

      if (editingId) {
        await updateCategory(editingId, data);
        notify("Thành công", "Đã cập nhật danh mục.");
      } else {
        await createCategory(data);
        notify("Thành công", "Đã thêm danh mục mới.");
      }

      resetForm();
      await loadData();
    } catch (e) {
      console.error(e);
      notify("Lỗi", "Không thể lưu danh mục.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category: Category) => {
    if (deletingId) return;

    const categoryId = String(category.id);

    // Kiểm tra lại dữ liệu API trước khi xác nhận xóa
    const checkAndDelete = async () => {
      setDeletingId(categoryId);

      try {
        const latestCourses = await getCourses();
        setCourses(latestCourses);

        const inUse = latestCourses.some(
          (course) =>
            String(course.categoryId) === categoryId
        );

        if (inUse) {
          notify(
            "Không thể xóa",
            `Danh mục "${category.name}" đang có khóa học. ` +
              "Hãy chuyển hoặc xóa các khóa học trước."
          );
          return;
        }

        confirmDelete(
          `Bạn có chắc muốn xóa danh mục "${category.name}"?`,
          () => {
            // Kiểm tra một lần nữa ngay trước DELETE
            void (async () => {
              try {
                const refreshed = await getCourses();

                if (
                  refreshed.some(
                    (c) => String(c.categoryId) === categoryId
                  )
                ) {
                  notify(
                    "Không thể xóa",
                    "Danh mục đang có khóa học."
                  );
                  return;
                }

                await deleteCategory(categoryId);
                await loadData();
                notify("Thành công", "Đã xóa danh mục.");
              } catch (e) {
                console.error(e);
                notify("Lỗi", "Không thể xóa danh mục.");
              }
            })();
          }
        );
      } catch (e) {
        console.error(e);
        notify(
          "Lỗi",
          "Không kiểm tra được khóa học. Chưa xóa danh mục."
        );
      } finally {
        setDeletingId(null);
      }
    };

    void checkAndDelete();
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["bottom"]}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Quản lý danh mục</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Quản lý danh mục khóa học từ MockAPI
        </Text>
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.heading}>
          Danh mục ({categories.length})
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={showForm ? resetForm : openAdd}
        >
          <Text style={styles.whiteText}>
            {showForm ? "Đóng form" : "+ Thêm danh mục"}
          </Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {editingId ? "Sửa danh mục" : "Thêm danh mục"}
          </Text>

          <Text style={styles.label}>Tên danh mục *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Lập trình Game"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Mô tả *</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            multiline
            textAlignVertical="top"
            placeholder="Nhập mô tả danh mục"
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.disabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.whiteText}>
                {editingId ? "Lưu thay đổi" : "Thêm danh mục"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={{ marginTop: 40 }}
        />
      ) : error ? (
        <View style={styles.emptyBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={loadData}>
            <Text style={styles.retry}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          onRefresh={loadData}
          refreshing={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Chưa có danh mục nào.
            </Text>
          }
          renderItem={({ item }) => {
            const count = countCourses(String(item.id));

            return (
              <View style={styles.card}>
                <Text style={styles.categoryName}>
                  {item.name}
                </Text>

                <Text style={styles.description}>
                  {item.description}
                </Text>

                <View style={styles.countBox}>
                  <Text style={styles.countText}>
                    {count} khóa học
                  </Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEdit(item)}
                  >
                    <Text style={styles.whiteText}>Sửa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      deletingId === String(item.id) &&
                        styles.disabled,
                    ]}
                    disabled={deletingId !== null}
                    onPress={() => handleDelete(item)}
                  >
                    <Text style={styles.whiteText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  header: {
    backgroundColor: "#2563EB",
    padding: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    color: "#DBEAFE",
    marginTop: 8,
  },
  backText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    padding: 12,
  },
  whiteText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  form: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  label: {
    marginTop: 14,
    marginBottom: 6,
    color: "#374151",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  multiline: {
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 10,
    marginTop: 18,
  },
  disabled: {
    opacity: 0.5,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    elevation: 2,
  },
  categoryName: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "bold",
  },
  description: {
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 21,
  },
  countBox: {
    alignSelf: "flex-start",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  countText: {
    color: "#1D4ED8",
    fontWeight: "600",
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#F59E0B",
    padding: 12,
    borderRadius: 10,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    padding: 12,
    borderRadius: 10,
  },
  emptyBox: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#6B7280",
    textAlign: "center",
    marginTop: 50,
  },
  error: {
    color: "#DC2626",
    textAlign: "center",
  },
  retry: {
    color: "#2563EB",
    marginTop: 12,
  },
});
