
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Category,
  CourseInput,
  getCategories,
  getCourseById,
  createCourse,
  updateCourse,
} from "../../services/api";

const initialForm = {
  title: "",
  description: "",
  categoryId: "",
  instructor: "",
  price: "",
  duration: "",
  thumbnail: "",
  trailerUrl: "",
};

type FormField = keyof typeof initialForm;

export default function CourseFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (key: FormField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        const cats = await getCategories();
        if (!active) return;
        setCategories(cats);

        if (id) {
          const course = await getCourseById(id);
          if (!active) return;

          setForm({
            title: course.title || "",
            description: course.description || "",
            categoryId: String(course.categoryId || ""),
            instructor: course.instructor || "",
            price: String(course.price ?? ""),
            duration: String(course.duration ?? ""),
            thumbnail: course.thumbnail || "",
            trailerUrl: course.trailerUrl || "",
          });
        } else if (cats.length > 0) {
          setForm({
            ...initialForm,
            categoryId: String(cats[0].id),
          });
        }
      } catch (e) {
        if (active) setError("Không thể tải dữ liệu form.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [id]);

  const handleSave = async () => {
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.instructor.trim() ||
      !form.thumbnail.trim() ||
      !form.trailerUrl.trim() ||
      !form.price.trim() ||
      !form.duration.trim()
    ) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ các trường.");
      return;
    }

    if (
      !categories.some(
        (cat) => String(cat.id) === form.categoryId
      )
    ) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục hợp lệ.");
      return;
    }

    const price = Number(form.price);
    const duration = Number(form.duration);

    if (!Number.isFinite(price) || price < 0) {
      Alert.alert("Lỗi", "Học phí phải là số không âm.");
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      Alert.alert("Lỗi", "Thời lượng phải lớn hơn 0.");
      return;
    }

    const validUrl = (value: string) => {
      try {
        const url = new URL(value);
        return url.protocol === "https:" ||
          url.protocol === "http:";
      } catch {
        return false;
      }
    };

    if (
      !validUrl(form.thumbnail.trim()) ||
      !validUrl(form.trailerUrl.trim())
    ) {
      Alert.alert("Lỗi", "URL ảnh hoặc trailer không hợp lệ.");
      return;
    }

    const data: CourseInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      instructor: form.instructor.trim(),
      price,
      duration,
      thumbnail: form.thumbnail.trim(),
      trailerUrl: form.trailerUrl.trim(),
      createdAt: new Date().toISOString(),
    };

    setSaving(true);

    try {
      if (editing && id) {
        // Giữ ngày tạo ban đầu nếu đang sửa
        const oldCourse = await getCourseById(id);
        data.createdAt = oldCourse.createdAt ||
          data.createdAt;

        await updateCourse(id, data);
      } else {
        await createCourse(data);
      }

      // Quay về danh sách và tải lại từ API
      router.replace("/");
    } catch (e) {
      Alert.alert(
        "Lỗi",
        "Không thể lưu khóa học. Hãy kiểm tra kết nối MockAPI."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>{error}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {editing ? "Sửa khóa học" : "Thêm khóa học"}
        </Text>

        <Text style={styles.label}>Tên khóa học *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên khóa học"
          value={form.title}
          onChangeText={(v) => setField("title", v)}
        />

        <Text style={styles.label}>Mô tả *</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          multiline
          textAlignVertical="top"
          placeholder="Nhập mô tả"
          value={form.description}
          onChangeText={(v) => setField("description", v)}
        />

        <Text style={styles.label}>Danh mục *</Text>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              form.categoryId === String(cat.id) &&
                styles.categoryActive,
            ]}
            onPress={() =>
              setField("categoryId", String(cat.id))
            }
          >
            <Text
              style={
                form.categoryId === String(cat.id)
                  ? styles.categoryTextActive
                  : styles.categoryText
              }
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Giảng viên *</Text>
        <TextInput
          style={styles.input}
          placeholder="Tên giảng viên"
          value={form.instructor}
          onChangeText={(v) => setField("instructor", v)}
        />

        <Text style={styles.label}>Học phí (VNĐ) *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Ví dụ: 500000"
          value={form.price}
          onChangeText={(v) => setField("price", v)}
        />

        <Text style={styles.label}>Thời lượng (giờ) *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Ví dụ: 30"
          value={form.duration}
          onChangeText={(v) => setField("duration", v)}
        />

        <Text style={styles.label}>URL ảnh bìa *</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="url"
          placeholder="https://..."
          value={form.thumbnail}
          onChangeText={(v) => setField("thumbnail", v)}
        />

        {!!form.thumbnail.trim() && (
          <View>
            <Text style={styles.label}>Xem trước ảnh</Text>
            <Image
              source={{ uri: form.thumbnail.trim() }}
              style={styles.preview}
              resizeMode="cover"
            />
          </View>
        )}

        <Text style={styles.label}>URL trailer MP4 *</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="url"
          placeholder="https://.../video.mp4"
          value={form.trailerUrl}
          onChangeText={(v) => setField("trailerUrl", v)}
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>
              {editing ? "Lưu thay đổi" : "Thêm khóa học"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
    color: "#374151",
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: "#111827",
  },
  multiline: {
    height: 100,
  },
  categoryButton: {
    padding: 13,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  categoryActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  categoryText: {
    color: "#374151",
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  saveButton: {
    backgroundColor: "#16A34A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
  },
  disabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  cancelText: {
    color: "#6B7280",
  },
  back: {
    color: "#2563EB",
    marginTop: 20,
  },
});
